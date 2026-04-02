## Why

개인과 가족의 건강 상태를 자연어 대화(텍스트/음성)로 손쉽게 기록하고, AI가 증상 패턴을 분석해 병원 진료를 효과적으로 받을 수 있도록 돕는 서비스가 없다. 기존 건강 앱은 수동 입력 중심이라 꾸준한 기록이 어렵고, 축적된 데이터를 의료 현장에 연결하는 기능이 부재하다.

## What Changes

- **신규 서비스** 개발 (기존 코드베이스 없음, greenfield)
- 채팅 UI를 첫 화면으로 제공 — 텍스트 및 음성 인풋 지원
- AI Agent가 자연어 입력에서 신체 부위 + 증상을 자동 분류·추출하여 구조화된 형태로 저장
- 달력 화면에서 날짜별 증상 이력 조회 및 수정
- 채팅 내 "달력에서 확인하기" 버튼으로 기록 결과로 바로 이동
- 과거 동일·유사 증상 패턴 감지 시 AI가 대화 중 연결 고리 제시

## Capabilities

### New Capabilities

- `chat`: 텍스트/음성 인풋을 받아 AI와 건강 상태를 대화하는 채팅 인터페이스
- `symptom-extraction`: 자연어에서 신체 부위·증상·시간대를 추출하고 구조화하는 AI Agent 처리
- `health-record`: 증상 기록의 CRUD — 부위, 증상, 시간대, 사용자 컨텍스트 포함
- `calendar-view`: 날짜별 건강 기록 시각화 및 상세 조회/수정
- `pattern-detection`: 과거 증상 이력과 현재 증상을 비교해 패턴 감지 및 대화 중 알림

### Modified Capabilities

(해당 없음 — 신규 서비스)

## Impact

- **Frontend**: React 기반 모바일 웹 (Next.js), 음성 입력 Web Speech API 연동
- **Backend**: Python (FastAPI), 관계형 DB (SQLite → PostgreSQL)
- **AI**: Gemini API + OpenAI Agents SDK (Gemini OpenAI 호환 엔드포인트 사용)
- **외부 의존성**: Gemini API 키 (workspace 기존 보유), 음성 인식 브라우저 API
- **향후 검토**: Graph DB 전환 가능성 (사람-부위-증상-이력 관계 표현), 법률/컴플라이언스 검토 필요 (진단 기능 금지 원칙 준수)
