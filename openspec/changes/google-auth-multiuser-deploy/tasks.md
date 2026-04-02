## 1. 백엔드 의존성 및 환경변수 준비

- [x] 1.1 `backend/requirements.txt`에 `python-jose[cryptography]`, `httpx`, `authlib` 추가 및 `.venv` 재설치
- [x] 1.2 `backend/.env.example` 파일 생성 (DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, ALLOWED_ORIGINS, FRONTEND_URL)
- [x] 1.3 `backend/.env`에 실제 값 입력 (GOOGLE_CLIENT_ID/SECRET은 Google Cloud Console에서 발급)
- [x] 1.4 `backend/app/config.py` — pydantic Settings로 환경변수 로드 (DATABASE_URL, GOOGLE_*, JWT_SECRET, ALLOWED_ORIGINS, FRONTEND_URL)

## 2. DB 설정 — DATABASE_URL 추상화

- [x] 2.1 `backend/app/database.py` — `DATABASE_URL` 환경변수 기반으로 engine 생성 (sqlite/postgresql 분기)
- [x] 2.2 `backend/app/models/models.py` — User 모델에 `google_id`, `picture` 컬럼 확인 및 추가
- [x] 2.3 Alembic 마이그레이션 생성 및 적용 (`alembic revision --autogenerate -m "add google_id picture to users"`)

## 3. Google OAuth 백엔드 구현

- [x] 3.1 `backend/app/routers/auth.py` 신규 생성 — `GET /auth/google` (OAuth redirect URL 생성)
- [x] 3.2 `GET /auth/google/callback` 구현 — Google code 교환 → 유저 정보 조회 → users upsert → JWT 발급 → 프론트 redirect
- [x] 3.3 `GET /auth/me` 구현 — JWT 검증 후 현재 유저 정보 반환
- [x] 3.4 JWT 유틸 함수 작성 (`app/auth/jwt.py`) — 발급(create_access_token), 검증(decode_token)
- [x] 3.5 `get_current_user` FastAPI Dependency 작성 — Authorization 헤더에서 JWT 추출 및 검증

## 4. 기존 API에 인증 미들웨어 적용

- [x] 4.1 `routers/health_records.py` — 모든 엔드포인트에 `Depends(get_current_user)` 추가, 쿼리에 `user_id` 필터 적용
- [x] 4.2 `routers/conversations.py` — 동일하게 인증 적용, conversation 생성/조회에 `user_id` 바인딩
- [x] 4.3 `routers/chat.py` (Agent 실행) — 인증된 `user_id`를 Agent runner에 전달하여 기록 저장 시 바인딩
- [x] 4.4 `app/services/pattern_service.py` — `user_id` 파라미터 추가, 해당 유저 기록만 조회
- [x] 4.5 CORS 설정 — `ALLOWED_ORIGINS` 환경변수 기반으로 `CORSMiddleware` 업데이트
- [x] 4.6 `app/main.py`에 auth 라우터 등록

## 5. 프론트엔드 인증 구현

- [x] 5.1 `frontend/app/login/page.tsx` 신규 — "Google로 로그인" 버튼 (백엔드 `/auth/google`로 이동)
- [x] 5.2 `frontend/app/auth/callback/page.tsx` 신규 — URL의 `token` 파라미터를 localStorage에 저장 후 `/chat`으로 이동
- [x] 5.3 `frontend/lib/api.ts` — 모든 API 요청에 `Authorization: Bearer <token>` 헤더 자동 추가
- [x] 5.4 `frontend/lib/auth.ts` 신규 — `getToken()`, `clearToken()`, `isLoggedIn()` 유틸
- [x] 5.5 `frontend/components/AuthGuard.tsx` 신규 — 미인증 시 `/login` redirect 처리
- [x] 5.6 `frontend/app/layout.tsx` 또는 각 페이지에 `AuthGuard` 적용
- [x] 5.7 `frontend/app/my/page.tsx` — 로그인 유저 프로필 (이름, 이메일, 사진) 표시 + 로그아웃 버튼

## 6. 배포 준비

- [ ] 6.1 `backend/Dockerfile` 작성 (Python 3.13 slim, uvicorn 실행) — 배포 시점에 진행
- [ ] 6.2 `backend/.dockerignore` 작성 — 배포 시점에 진행
- [x] 6.3 `backend/app/main.py`에 `GET /health` 엔드포인트 추가 (이미 존재)
- [x] 6.4 `frontend/.env.local.example` 작성 (NEXT_PUBLIC_API_URL)

## 7. 통합 테스트

- [x] 7.1 로컬에서 Google OAuth 전체 흐름 테스트 (로그인 → JWT → API 호출)
- [x] 7.2 두 개의 Google 계정으로 데이터 격리 확인 (A 유저 기록이 B에게 안 보임) — 다른 계정 로그인 시 localStorage chat 초기화 처리 포함
- [x] 7.3 미인증 상태에서 `/chat` 접근 시 `/login` redirect 확인
- [ ] 7.4 Docker 빌드 및 로컬 컨테이너 실행 테스트 — 배포 시점에 진행
