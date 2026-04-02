## ADDED Requirements

### Requirement: 백엔드는 컨테이너로 빌드할 수 있다
시스템 SHALL Dockerfile을 통해 FastAPI 백엔드를 컨테이너 이미지로 빌드할 수 있어야 한다.

#### Scenario: Docker 빌드
- **WHEN** `docker build` 명령을 실행한다
- **THEN** 오류 없이 컨테이너 이미지가 생성된다

#### Scenario: 컨테이너 실행
- **WHEN** 환경변수를 주입하여 컨테이너를 실행한다
- **THEN** FastAPI 서버가 정상 기동되고 `/health` 엔드포인트가 200을 반환한다

### Requirement: DATABASE_URL 환경변수로 SQLite와 PostgreSQL을 전환할 수 있다
시스템 SHALL `DATABASE_URL` 환경변수 값에 따라 SQLite 또는 PostgreSQL에 연결해야 한다.

#### Scenario: SQLite 로컬 개발
- **WHEN** `DATABASE_URL=sqlite:///./health.db`로 설정한다
- **THEN** SQLite 파일 기반 DB에 연결된다

#### Scenario: PostgreSQL 프로덕션
- **WHEN** `DATABASE_URL=postgresql://user:pass@host/db`로 설정한다
- **THEN** PostgreSQL에 연결된다

### Requirement: 프로덕션 CORS 설정을 지원한다
시스템 SHALL `ALLOWED_ORIGINS` 환경변수로 CORS 허용 출처를 설정할 수 있어야 한다.

#### Scenario: 프론트엔드 도메인 허용
- **WHEN** `ALLOWED_ORIGINS=https://healthlog.vercel.app`으로 설정한다
- **THEN** 해당 도메인에서의 API 요청이 허용된다

### Requirement: 필수 환경변수가 정의되어 있어야 한다
시스템 SHALL `.env.example`에 모든 필수 환경변수를 문서화해야 한다.

#### Scenario: 환경변수 목록 확인
- **WHEN** 새 개발자가 `.env.example`을 확인한다
- **THEN** DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, ALLOWED_ORIGINS, FRONTEND_URL 항목이 모두 포함되어 있다
