## 1. GCP VM 사전 준비

- [ ] 1.1 VM 외부 IP 정적(Static) 전환
  - `gcloud compute addresses create health-logging-ip --region=us-central1`
  - 기존 ephemeral IP(35.188.23.189) 동일하게 유지되는지 확인
  - 도메인: `35-188-23-189.sslip.io`
- [ ] 1.2 GCP 방화벽 규칙 추가 (포트 80, 443)
  - `gcloud compute firewall-rules create allow-http-https ...`
- [ ] 1.3 VM 스왑 메모리 1GB 추가
  - `fallocate -l 1G /swapfile && mkswap /swapfile && swapon /swapfile`
  - `/etc/fstab`에 영구 등록

## 2. Neon PostgreSQL 설정

- [ ] 2.1 Neon 계정 생성 및 프로젝트 생성 (neon.tech)
- [ ] 2.2 `healthlog` 스키마 생성 (기본 public 스키마 사용 가능)
- [ ] 2.3 Connection string 확인 및 `.env`에 `DATABASE_URL` 업데이트
  - 형식: `postgresql://user:password@ep-xxx.neon.tech/neondb`

## 3. 백엔드 코드 수정

- [ ] 3.1 `backend/requirements.txt` — `psycopg2-binary` 추가
- [ ] 3.2 로컬에서 Neon DB 연결 확인
  - `.env`의 `DATABASE_URL`을 Neon으로 변경 후 uvicorn 기동
- [ ] 3.3 `alembic upgrade head` — Neon DB에 스키마 생성
- [ ] 3.4 `ALLOWED_ORIGINS`에 Vercel 프론트 URL 추가 예정 (6번 완료 후)

## 4. GCP VM 백엔드 배포

- [ ] 4.1 `deploy/` 디렉토리에 헬스로그 전용 배포 스크립트 작성
  - stock-advisor `03_deploy.sh` 패턴 참고
  - tar 업로드 + venv 설치 + systemd 서비스 등록
  - 서비스명: `health-logging`
  - uvicorn 바인딩: `--host 127.0.0.1 --port 8000`
- [ ] 4.2 VM에 배포 실행 및 서비스 기동 확인
  - `sudo systemctl status health-logging`
- [ ] 4.3 VM에서 로컬 healthcheck 확인
  - `curl http://127.0.0.1:8000/health`

## 5. nginx + HTTPS 설정

- [ ] 5.1 VM에 nginx 설치
  - `sudo apt-get install -y nginx`
- [ ] 5.2 nginx 설정 작성 (`/etc/nginx/sites-available/health-logging`)
  ```nginx
  server {
      listen 80;
      server_name 35-188-23-189.sslip.io;
      location / { proxy_pass http://127.0.0.1:8000; }
  }
  ```
- [ ] 5.3 Certbot 설치 및 SSL 인증서 발급
  - `sudo certbot --nginx -d 35-188-23-189.sslip.io`
- [ ] 5.4 HTTPS 외부 접근 확인
  - `curl https://35-188-23-189.sslip.io/health`
- [ ] 5.5 인증서 자동 갱신 크론 확인
  - `sudo certbot renew --dry-run`

## 6. 프론트엔드 Vercel 배포

- [ ] 6.1 GitHub 레포에 frontend 코드 push 확인
- [ ] 6.2 Vercel 프로젝트 생성 및 GitHub 레포 연결
  - Root Directory: `frontend`
  - Framework: Next.js
- [ ] 6.3 Vercel 환경변수 설정
  - `NEXT_PUBLIC_API_URL=https://35-188-23-189.sslip.io`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`
- [ ] 6.4 배포 후 도메인 확인 (*.vercel.app)
- [ ] 6.5 백엔드 `ALLOWED_ORIGINS`에 Vercel 도메인 추가 후 재배포

## 7. 법적 요건

- [ ] 7.1 개인정보 처리방침 페이지 작성 (`/privacy`)
  - 수집 항목: 이름, 이메일, 프로필 사진 (Google OAuth), 건강 기록 (민감정보)
  - 보유 기간, 제3자 제공 없음, 파기 방법
- [ ] 7.2 서비스 이용약관 페이지 작성 (`/terms`)
  - 의료 면책 조항 명시
  - 서비스 중단·변경 권리 유보
- [ ] 7.3 최초 로그인 시 동의 절차 구현
  - 로그인 완료 후 동의 여부 DB 컬럼 확인
  - 미동의 시 동의 모달 표시 (필수: 개인정보 처리방침 + 이용약관, 필수: 건강 민감정보 수집)
  - 동의 완료 후 `users.terms_agreed_at` 타임스탬프 저장
- [ ] 7.4 채팅 면책 문구 보강 (현재 하단 한 줄 → 더 명확하게)

## 8. Umami 분석 설정

- [ ] 8.1 Neon에 `umami` 스키마(또는 별도 DB) 생성
- [ ] 8.2 Vercel에 Umami 프로젝트 배포
  - Umami GitHub 레포 fork 또는 직접 배포
  - 환경변수: `DATABASE_URL` (Neon umami 스키마)
- [ ] 8.3 Umami 관리자 계정 설정 및 헬스로그 사이트 등록
- [ ] 8.4 헬스로그 `frontend/app/layout.tsx`에 추적 스크립트 추가
- [ ] 8.5 핵심 이벤트 추적 코드 추가
  - 음성 입력 사용 (`voice_input_used`)
  - 메시지 전송 (`message_sent`)
  - 건강 기록 저장 완료 (`record_saved`)

## 9. 에러 모니터링 (GlitchTip)

- [ ] 9.1 GlitchTip 클라우드 계정 생성 및 프로젝트 2개 생성 (frontend, backend)
- [ ] 9.2 백엔드 Sentry SDK 연동 (`sentry-sdk[fastapi]` 추가, main.py에 초기화)
- [ ] 9.3 프론트엔드 Sentry SDK 연동 (`@sentry/nextjs` 추가)

## 10. 최종 검증

- [ ] 10.1 실제 Google 로그인 → 동의 모달 → 채팅 전체 흐름 확인
- [ ] 10.2 건강 기록 저장 → DB 확인 (Neon 콘솔)
- [ ] 10.3 Umami 대시보드에 이벤트 수신 확인
- [ ] 10.4 GlitchTip에 테스트 에러 수신 확인
- [ ] 10.5 VM 메모리 사용량 재확인 (`free -h`)
