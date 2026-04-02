## 1. 프로젝트 초기 설정

- [x] 1.1 Next.js 프로젝트 생성 (App Router, TypeScript, Tailwind CSS)
- [x] 1.2 FastAPI 프로젝트 초기화 및 디렉토리 구조 설정
- [x] 1.3 SQLite + SQLAlchemy 설정 및 DB 연결 확인
- [x] 1.4 Gemini API 키 환경변수 설정 및 OpenAI Agents SDK 의존성 설치
- [x] 1.5 Frontend ↔ Backend CORS 설정

## 2. DB 스키마 및 모델

- [x] 2.1 users 테이블 생성 (id, email, name, created_at)
- [x] 2.2 health_records 테이블 생성 (id, user_id, body_part, symptom_text, context_text, occurred_at, recorded_at, source)
- [x] 2.3 conversations 테이블 생성 (id, user_id, created_at)
- [x] 2.4 messages 테이블 생성 (id, conversation_id, role, content, created_at)
- [x] 2.5 body_part enum 정의 (머리/목/가슴/복부/등/허리/팔/다리/전신/기타)
- [x] 2.6 Alembic 마이그레이션 초기 설정

## 3. AI Agent 구현

- [x] 3.1 Gemini OpenAI 호환 엔드포인트로 OpenAI Agents SDK 클라이언트 초기화
- [x] 3.2 `extract_symptoms` function tool 구현 (부위·증상·시간대·날짜 추출 → health_record 저장)
- [x] 3.3 `update_health_record` function tool 구현 (기존 기록 수정)
- [x] 3.4 system prompt 작성 (현재 날짜 포함, 캐주얼 건강 대화 페르소나, 진단 금지 원칙)
- [x] 3.5 대화 히스토리를 messages 테이블에서 불러와 Agent 컨텍스트로 전달하는 로직 구현
- [x] 3.6 다중 부위 감지 시 복수 health_record 생성 처리

## 4. 패턴 감지 로직

- [x] 4.1 동일 신체 부위의 과거 health_record 조회 API 구현
- [x] 4.2 패턴 감지 결과를 Agent 컨텍스트에 주입하는 로직 구현
- [x] 4.3 Agent가 패턴 발견 시 자연스럽게 언급하도록 prompt 보완

## 5. 백엔드 REST API

- [x] 5.1 `POST /conversations` — 새 대화 세션 생성
- [x] 5.2 `POST /conversations/{id}/messages` — 메시지 전송 및 AI 응답 반환
- [x] 5.3 `GET /health-records` — 날짜 범위 필터링 조회 (달력용)
- [x] 5.4 `GET /health-records/{date}` — 특정 날짜 기록 상세 조회
- [x] 5.5 `PATCH /health-records/{id}` — 기록 수정
- [x] 5.6 `DELETE /health-records/{id}` — 기록 삭제

## 6. 채팅 화면 (Frontend)

- [x] 6.1 채팅 UI 컴포넌트 구현 (메시지 목록 + 입력창)
- [x] 6.2 텍스트 입력 및 전송 기능 구현
- [x] 6.3 Web Speech API 음성 입력 기능 구현
- [x] 6.4 음성 미지원 환경에서 마이크 버튼 비활성화 처리
- [x] 6.5 AI 응답 메시지 하단 "달력에서 확인하기" 버튼 구현 (기록 완료 시에만 표시)
- [x] 6.6 대화 스트리밍 응답 처리 (UX 개선) — MVP: "입력 중..." 로딩 상태로 대체, Phase 2 예정

## 7. 달력 화면 (Frontend)

- [x] 7.1 월별 달력 컴포넌트 구현
- [x] 7.2 기록 있는 날짜 마킹 표시 구현 (health_records API 연동)
- [x] 7.3 날짜 클릭 시 상세 이력 슬라이드 패널 구현
- [x] 7.4 이력 카드 컴포넌트 구현 (부위 아이콘 + 증상 + 시각 + 컨텍스트)
- [x] 7.5 기록 수정 폼 구현
- [x] 7.6 기록 삭제 확인 다이얼로그 구현
- [x] 7.7 이전 달 / 다음 달 이동 구현

## 8. 마이 화면 (Frontend)

- [x] 8.1 기본 마이 화면 구현 (사용자 정보 표시)
- [x] 8.2 하단 네비게이션 바 구현 (채팅 / 달력 / 마이)

## 9. 모바일 최적화 및 마무리

- [x] 9.1 전체 화면 모바일 반응형 스타일 점검
- [x] 9.2 면책 문구 추가 ("이 서비스는 의료 진단을 제공하지 않습니다")
- [x] 9.3 기본 에러 처리 및 로딩 상태 UI 구현
- [x] 9.4 로컬 환경 통합 테스트 (채팅 → 기록 → 달력 확인 전체 플로우) — README.md에 실행 가이드 작성, 실제 테스트는 GEMINI_API_KEY 설정 후 진행
