## Context

헬스로그는 현재 단일유저 로컬 서비스로 동작 중. 모든 API가 인증 없이 접근 가능하고 health_records/conversations는 user_id 컬럼은 있지만 실제로 필터링하지 않는다. 30명 베타 배포를 위해 최소한의 인증과 데이터 격리가 필요하다.

- GCP 프로젝트 `project-ef4dc6d3-bcb1-4a97-a85` (서울, 빌링 활성)
- Gemini API 이미 활성화 및 사용 중
- 기존 Compute Engine VM (`crypto-bot` e2-micro)이 존재하나 별도 서비스

## Goals / Non-Goals

**Goals:**
- Google OAuth 2.0로 로그인/로그아웃 (추가 가입 폼 없음)
- JWT 발급/검증으로 API 인증
- user_id 기반 데이터 격리
- Cloud Run + Vercel 배포 가능한 상태로 코드 정비
- SQLite와 PostgreSQL 모두 지원 (로컬 개발: SQLite, 프로덕션: PostgreSQL)

**Non-Goals:**
- 이메일/패스워드 인증
- 관리자 대시보드
- 사용자 권한 구분 (모든 유저 동일한 권한)
- Firebase Auth 등 외부 Auth 서비스
- Refresh token rotation (MVP 단계: 단순 JWT 만료)

## Decisions

### 1. OAuth 흐름: Authorization Code Flow (백엔드 처리)

**결정**: Google OAuth redirect를 백엔드(`/auth/google`)에서 처리하고, callback에서 JWT를 발급하여 프론트로 전달한다.

**이유**: 프론트엔드에서 client_secret을 노출하지 않아 보안상 안전. Cloud Run 환경에서 환경변수로 secret 관리 가능.

**흐름**:
```
프론트 "Google 로그인" 클릭
  → GET /auth/google (백엔드가 Google OAuth URL 생성 + redirect)
  → Google 인증 완료
  → GET /auth/google/callback (code 교환 → 유저 정보 조회 → JWT 발급)
  → 프론트 /auth/callback?token=<jwt> 로 redirect
  → 프론트가 token 저장 후 /chat으로 이동
```

**대안**: NextAuth.js — 설정 간편하지만 백엔드 JWT와 연동 복잡도 증가, 백엔드 인증 로직이 분산됨.

### 2. JWT 저장: localStorage

**결정**: JWT를 localStorage에 저장하고 API 요청 시 `Authorization: Bearer` 헤더로 전송.

**이유**: 현재 채팅 이력도 localStorage 사용 중으로 일관성 유지. httpOnly cookie는 CORS + Cloud Run 환경 설정이 복잡해 MVP 오버스펙.

**리스크**: XSS 취약점 시 토큰 탈취 가능 → MVP 30명 베타에서는 허용. Phase 2에서 httpOnly cookie로 전환 검토.

### 3. DB: DATABASE_URL 환경변수로 SQLite/PostgreSQL 전환

**결정**: `DATABASE_URL` 환경변수로 DB를 추상화. 로컬 개발은 `sqlite:///./health.db`, 프로덕션은 `postgresql://...`

**이유**: 코드 변경 없이 환경만 바꾸면 DB 전환 가능. Alembic migration은 동일하게 동작.

### 4. 배포: Cloud Run + Vercel

**결정**: 백엔드는 Dockerfile → Cloud Run, 프론트엔드는 Vercel.

**이유**:
- Cloud Run: scale-to-zero로 30명 트래픽에서 거의 무비용, 서버 관리 불필요
- Vercel: Next.js 최적화, 무료 Hobby 플랜으로 충분
- Cloud SQL db-f1-micro: 월 ~$7, 30명에 충분

## Risks / Trade-offs

- **JWT localStorage XSS 리스크** → MVP 베타에서 허용. 운영 안정화 후 httpOnly cookie 전환
- **Cloud SQL 비용** → db-f1-micro ~$7/월 고정비. 트래픽 없어도 과금됨. 대안: Supabase free tier (하지만 GCP 통합 복잡)
- **Google OAuth consent screen 심사** → 30명 미만이면 테스트 유저로 등록하여 심사 없이 사용 가능
- **Cold start 지연** → Cloud Run scale-to-zero 시 첫 요청 2-3초 지연. 30명 베타에서 허용
- **SQLite → PostgreSQL 마이그레이션** → 기존 로컬 데이터는 이전 불필요 (베타 신규 시작)

## Migration Plan

1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
2. 테스트 유저 30명 등록 (OAuth consent screen)
3. 백엔드 코드 변경 → 로컬 테스트
4. Cloud SQL PostgreSQL 인스턴스 생성 (db-f1-micro, 서울)
5. Cloud Run 서비스 배포 (환경변수: DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, JWT_SECRET)
6. Vercel 배포 (환경변수: NEXT_PUBLIC_API_URL)
7. 테스트 유저 순차 초대

**롤백**: Cloud Run 이전 revision으로 즉시 전환 가능. Vercel도 이전 deployment로 롤백.

## Open Questions

- Google OAuth consent screen 앱 이름/로고 (베타는 "헬스로그 (테스트)" 정도로)
- Cloud SQL vs Supabase free tier — 비용 vs 편의성 최종 결정
- 베타 사용자 30명 초대 방식 — Google 테스트 유저 등록 vs 도메인 제한 없이 오픈
