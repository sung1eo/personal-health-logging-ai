# Personal Health Logging AI

AI와 대화하며 건강 상태를 기록하는 서비스.

## 로컬 실행

### 백엔드

```bash
cd backend
cp .env.example .env
# .env에 GEMINI_API_KEY 입력

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

alembic upgrade head
uvicorn app.main:app --reload
# http://localhost:8000
```

### 프론트엔드

```bash
cd frontend
cp .env.local.example .env.local

npm install
npm run dev
# http://localhost:3000
```

## 구조

```
backend/
  app/
    agent/      # OpenAI Agents SDK + Gemini 연동
    models/     # SQLAlchemy 모델
    routers/    # FastAPI 라우터
    services/   # 패턴 감지 등 비즈니스 로직
  migrations/   # Alembic 마이그레이션

frontend/
  app/
    chat/       # 채팅 화면 (기본 화면)
    calendar/   # 달력 화면
    my/         # 마이 화면
  components/   # 공통 컴포넌트
  lib/          # API 클라이언트, 유틸
```
