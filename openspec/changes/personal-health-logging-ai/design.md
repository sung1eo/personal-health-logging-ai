## Context

신규 greenfield 서비스. 기존 코드베이스 없음. 사용자가 자연어(텍스트/음성)로 건강 상태를 기록하면 AI Agent가 신체 부위·증상을 자동 분류하고, 달력 기반 UI로 이력을 조회·수정할 수 있는 웹 서비스를 구축한다.

- **AI 모델**: Gemini API (workspace 내 기존 API 키 보유)
- **Agent 프레임워크**: OpenAI Agents SDK (Gemini OpenAI 호환 엔드포인트 연동)
- **플랫폼**: 모바일 웹 우선 → 향후 앱 전환 가능 구조

## Goals / Non-Goals

**Goals:**
- 채팅 UI 첫 화면 — 텍스트/음성 인풋으로 증상 기록
- AI Agent가 자연어에서 신체 부위·증상·시간대 자동 추출 및 저장
- 달력에서 날짜별 이력 조회·수정 (부위 아이콘 + 증상 + 컨텍스트)
- 채팅 → 달력 바로가기 버튼 제공
- 과거 동일·유사 증상 패턴 감지 후 대화 중 알림
- 모바일 웹에서 원활하게 동작하는 반응형 UI

**Non-Goals:**
- 의료 진단 기능 (compliance 저촉 — 절대 금지)
- 가족 구성원 공유/멀티유저 기능 (Phase 2)
- 병원 연계·광고 (Phase 2)
- 네이티브 앱 (Phase 2)
- Graph DB 전환 (Phase 2 — 현재는 관계형 DB)

## Decisions

### 1. Agent 프레임워크: OpenAI Agents SDK + Gemini 호환 엔드포인트

**결정**: OpenAI Agents SDK를 사용하되 Gemini의 OpenAI 호환 엔드포인트(`https://generativelanguage.googleapis.com/v1beta/openai/`)에 연결한다.

**이유**: SK가 Azure OpenAI 기반 Agent 개발에 익숙하여 학습 곡선 최소화. LangGraph 대비 단순한 API 구조, `@function_tool` 데코레이터 기반 Tool calling이 직관적. MVP 단계에서 복잡한 멀티에이전트 오케스트레이션 불필요.

**대안 검토**:
- LangGraph: 복잡한 상태 관리에 강하지만 학습 곡선 높고 MVP 오버스펙
- Google ADK: Gemini 네이티브이나 SK에게 낯선 프레임워크
- 자체 구현: 유연하지만 반복 구현 비용 높음

### 2. 증상 추출 방식: Function Calling 기반 구조화 추출

**결정**: AI 대화 중 `extract_symptoms` tool을 통해 신체 부위·증상·시간대·날짜를 구조화된 JSON으로 추출하고 DB에 저장한다. 모호한 경우 AI가 확인 질문 후 저장.

**이유**: LLM이 문맥에서 날짜·시간대·부위를 충분히 추론 가능. Function calling으로 추출 결과를 타입 안전하게 처리 가능. 현재 날짜를 system prompt에 포함하여 "어제", "오늘 오후" 등 상대적 표현 처리.

### 3. 프론트엔드: Next.js + Web Speech API

**결정**: Next.js(App Router)로 모바일 웹 최적화 UI를 구현하고, 음성 인풋은 브라우저 내장 Web Speech API를 사용한다.

**이유**: SSR/SSG 유연성, React 생태계, 향후 PWA 전환 용이. Web Speech API는 별도 외부 서비스 없이 브라우저에서 무료로 음성 인식 제공.

**대안 검토**:
- Whisper API: 정확도 높지만 비용 발생 및 레이턴시 증가 → Phase 2 고려

### 4. 백엔드: FastAPI + SQLite (→ PostgreSQL)

**결정**: Python FastAPI로 REST API를 구현하고, 초기엔 SQLite를 사용한다. 프로덕션 전환 시 PostgreSQL로 마이그레이션.

**이유**: 빠른 개발 속도, Python AI 라이브러리 생태계 친화적. SQLite는 초기 서버 없이 로컬 개발 가능.

### 5. DB 스키마 핵심 구조

```
users
  id, email, name, created_at

health_records
  id, user_id, body_part (enum), symptom_text, context_text,
  occurred_at (datetime, nullable), recorded_at, source (chat|manual)

conversations
  id, user_id, created_at

messages
  id, conversation_id, role (user|assistant), content, created_at
```

`body_part` enum 예시: 머리, 목, 가슴, 복부, 등, 허리, 팔, 다리, 전신, 기타

## Risks / Trade-offs

- **Gemini ↔ OpenAI Agents SDK 호환성 엣지케이스** → Function calling 복잡도 낮게 유지, 초기 통합 테스트 충분히 수행
- **Web Speech API 브라우저 지원 제한** → Chrome/Edge 우선 지원, 미지원 브라우저엔 텍스트 인풋만 제공
- **날짜 추론 오류** → 추론 불확실 시 AI가 반드시 확인 질문, 사용자가 달력에서 직접 수정 가능
- **의료 책임 리스크** → 모든 응답에 "의료 진단이 아님" 면책 문구 포함, 진단·처방 관련 질문은 명시적 거부
- **Graph DB 전환 비용** → health_records 테이블 설계 시 향후 그래프 변환을 고려한 관계 명확화

## Open Questions

- 음성 인풋 미지원 브라우저 fallback UI 상세 디자인
- `body_part` enum 최종 목록 확정 (현재 초안 수준)
- 법률/컴플라이언스 검토 결과에 따른 면책 문구 위치·내용 (TODO)
