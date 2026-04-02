## Why

헬스로그 서비스를 30명 베타 사용자에게 배포하기 위해 Google OAuth 기반 인증과 멀티유저 데이터 분리가 필요하다. 현재는 인증 없이 단일유저 가정으로 동작하여 실서비스 배포가 불가능하다.

## What Changes

- Google OAuth 2.0 로그인/로그아웃 흐름 추가 (백엔드 + 프론트엔드)
- JWT 기반 세션 관리 (발급 → 검증 → 만료)
- 모든 API 엔드포인트에 인증 미들웨어 적용
- health_records, conversations 쿼리에 user_id 필터 적용 (데이터 분리)
- 로그인 페이지 및 인증 상태 기반 라우팅 추가
- FastAPI Dockerfile 및 환경변수 구조 정비 (SQLite → PostgreSQL 지원)
- Cloud Run (백엔드) + Vercel (프론트) 배포 준비

## Capabilities

### New Capabilities

- `google-auth`: Google OAuth 2.0 로그인, JWT 발급/검증, 로그아웃
- `multiuser-data`: user_id 기반 데이터 격리 — 각 사용자는 본인 기록만 조회/수정 가능
- `deployment-config`: Dockerfile, 환경변수 체계, CORS 설정, PostgreSQL 지원

### Modified Capabilities

- `health-record`: 모든 기록 생성/조회/수정/삭제에 인증된 user_id 바인딩 필수
- `symptom-extraction`: AI Agent 실행 시 인증된 user_id로 기록 저장

## Impact

- **Backend**: `app/routers/auth.py` 신규, 모든 기존 라우터에 `Depends(get_current_user)` 추가, `app/models/models.py` User 모델 google_id/picture 컬럼 확인
- **Frontend**: `app/login/page.tsx` 신규, `lib/api.ts` Authorization 헤더 추가, 모든 페이지에 인증 체크
- **Infra**: `Dockerfile`, `.env.example`, `docker-compose.yml` 신규
- **Dependencies**: `python-jose`, `httpx`, `authlib` (백엔드), NextAuth.js 또는 직접 구현 (프론트)
