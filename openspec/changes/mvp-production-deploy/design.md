## Context

헬스로그 MVP를 실제 사용자에게 제공하기 위한 프로덕션 배포 설계.
현재 백엔드는 로컬에서만 실행 중이며, SQLite 파일 기반 DB를 사용하고 있다.
기존 GCP VM(crypto-bot, us-central1-a)이 stock-advisor를 운영 중이므로 동일 VM에 백엔드를 추가하여 인프라 비용을 최소화한다.

현재 상태:
```
로컬 개발 환경
├── backend (FastAPI + SQLite, uvicorn 수동 실행)
└── frontend (Next.js, localhost:3000)
```

목표 상태:
```
[Vercel]
 ├── 헬스로그 프론트 (health-logging.vercel.app)
 └── Umami 분석 대시보드 (umami.vercel.app)

[GCP VM - crypto-bot, us-central1-a, 35.188.23.189]
 ├── nginx (80/443, sslip.io + Let's Encrypt)
 ├── 헬스로그 백엔드 (uvicorn :8000, systemd)
 └── stock-advisor (기존, systemd)

[Neon - 무료]
 ├── 헬스로그 DB (users, conversations, health_records)
 └── Umami DB (analytics events)
```

## Goals / Non-Goals

**Goals:**
- 헬스로그 백엔드를 기존 GCP VM에 추가 배포 (추가 인프라 비용 없음)
- SQLite → Neon PostgreSQL 마이그레이션 (데이터 영속성 확보)
- HTTPS 적용 (Vercel 프론트 → VM 백엔드 mixed content 차단 해소)
- Vercel에 프론트엔드 자동 배포 (GitHub push → 배포)
- Umami로 기본 사용자 행동 분석 수집
- 개인정보 처리방침 + 최초 로그인 동의 절차 구현 (법적 의무)

**Non-Goals:**
- Cloud Run, Railway 등 별도 PaaS 사용
- 커스텀 도메인 구매 (sslip.io 활용)
- 에러 모니터링 고도화 (GlitchTip 기본 연동은 포함)
- 다국어 지원
- 유료 플랜 결제 기능

## Architecture

### HTTPS 처리: sslip.io + Let's Encrypt

VM 외부 IP(35.188.23.189)를 고정(Static IP)으로 전환 후 sslip.io 도메인 사용:

```
https://35-188-23-189.sslip.io  →  nginx → uvicorn :8000
```

sslip.io는 IP 주소를 도메인으로 매핑해주는 무료 와일드카드 DNS 서비스.
이 도메인으로 Let's Encrypt SSL 인증서 발급 가능.

### 백엔드 배포: systemd (stock-advisor 방식 동일)

```ini
# /etc/systemd/system/health-logging.service
[Service]
ExecStart=/home/.../health-logging/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
EnvironmentFile=.env
Restart=always
```

uvicorn은 127.0.0.1에만 바인딩. 외부에서는 nginx 통해서만 접근.

### 데이터베이스: Neon PostgreSQL

```
Neon 프로젝트 1개
├── schema: healthlog   (헬스로그 테이블들)
└── schema: umami       (Umami 분석 이벤트)
```

SQLAlchemy는 PostgreSQL을 그대로 지원. DATABASE_URL 환경변수만 교체.
Alembic 마이그레이션을 새 DB에 적용하여 스키마 생성.

### 프론트엔드: Vercel

GitHub 레포 연결 → `frontend/` 디렉토리를 루트로 자동 배포.
환경변수 `NEXT_PUBLIC_API_URL`을 `https://35-188-23-189.sslip.io`로 설정.

### 분석: Umami on Vercel

Umami는 Next.js 앱이므로 Vercel에 별도 프로젝트로 배포.
Neon의 umami 스키마를 DB로 연결.
헬스로그 프론트에 `<script>` 태그 한 줄로 추적 코드 삽입.

### 에러 추적: GlitchTip (클라우드 무료 티어)

자체 호스팅 없이 GlitchTip 클라우드 무료 플랜 사용.
FastAPI 미들웨어 + Next.js SDK 연동.

## Decisions

### sslip.io vs 커스텀 도메인

**결정**: sslip.io

**이유**: 도메인 구매 비용($10~15/년) 없이 Let's Encrypt SSL 발급 가능.
MVP 단계에서 사용자에게 노출되는 URL은 프론트(Vercel 도메인)이므로
백엔드 URL이 sslip.io여도 UX에 영향 없음.
트래픽이 늘어 커스텀 도메인이 필요해지면 nginx 설정만 변경하면 됨.

### VM 공동 사용 vs 별도 인프라

**결정**: 기존 VM 공동 사용

**이유**: e2-micro 현재 메모리 사용량 480MB/958MB, FastAPI 추가 시 ~630MB 예상.
스왑 1GB 추가로 안전 마진 확보. stock-advisor는 주기적 실행 패턴이라
uvicorn 상시 실행과 메모리 경합 가능성 낮음.

### SQLite vs PostgreSQL

**결정**: Neon PostgreSQL

**이유**: SQLite는 단일 파일이라 VM 재배포·장애 시 데이터 유실 위험.
백업 자동화가 없으면 복구 불가. Neon은 자동 백업 포함.
코드 변경 최소 (DATABASE_URL 환경변수만 교체, psycopg2-binary 추가).

### Umami 자체 호스팅 vs Vercel 배포

**결정**: Vercel 배포

**이유**: VM 메모리 여유가 충분하지 않아 Node.js 프로세스 추가 부담을 피함.
Umami는 Next.js 기반이라 Vercel에 바로 올릴 수 있음.
Neon DB와 연결하면 별도 인프라 비용 없음.

## Risks / Trade-offs

- **VM 단일 장애점**: stock-advisor + 헬스로그 백엔드가 같은 VM. VM 장애 시 두 서비스 모두 중단. MVP 단계에서는 허용, 이후 서비스 분리 검토.
- **sslip.io 의존성**: 외부 DNS 서비스. 장애 시 백엔드 접근 불가. 발생 가능성 낮고, 커스텀 도메인으로 교체 용이.
- **Neon 무료 티어 한도**: 0.5GB 스토리지. 헬스로그 + Umami 합산. 건강 기록 텍스트 기준 수만 건 수용 가능. 초과 시 유료 전환($19/월) 또는 오래된 데이터 정리.
- **메모리 압박**: e2-micro 1GB + 스왑 1GB. OOM 발생 시 systemd restart 정책으로 자동 복구.
- **Cold Start 없음**: 상시 실행 uvicorn이므로 Cloud Run 대비 응답 지연 없음.
