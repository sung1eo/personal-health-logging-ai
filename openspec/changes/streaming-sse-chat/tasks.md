## 1. 백엔드 스트리밍 Agent Runner

- [x] 1.1 `backend/app/agent/runner.py` — `stream_agent()` 비동기 제너레이터 구현
  - `Runner.run_streamed()` 사용
  - `raw_response_event` → `text_delta` SSE yield
  - `run_item_stream_event` (tool_output) → `record_saved` SSE yield
  - 완료 후 DB 메시지 저장 → `done` SSE yield
  - 예외 → `error` SSE yield
- [x] 1.2 `backend/app/agent/runner.py` — `run_agent()` 래퍼 함수 추가 (stream_agent 소비 → tuple 반환, 하위 호환)

## 2. 백엔드 스트리밍 엔드포인트

- [x] 2.1 `backend/app/routers/conversations.py` — `POST /conversations/{id}/messages/stream` 추가
  - `StreamingResponse(stream_agent(...), media_type="text/event-stream")` 사용
  - `Cache-Control: no-cache`, `X-Accel-Buffering: no` 헤더 설정
  - 기존 비스트리밍 엔드포인트 유지

## 3. 프론트엔드 스트리밍 클라이언트

- [x] 3.1 `frontend/lib/api.ts` — `streamMessage()` 함수 추가
  - fetch + ReadableStream으로 SSE 파싱
  - 라인별 `data: {...}` 파싱 → `onEvent` 콜백 호출
- [x] 3.2 `frontend/app/chat/page.tsx` — `sendMessage()` → `streamMessage()` 교체
  - 어시스턴트 버블 즉시 추가 (빈 content)
  - `text_delta` 이벤트마다 content 갱신 → 실시간 타이핑 효과
  - `record_saved` → record_ids 수집
  - 스트림 완료 후 localStorage 저장

## 4. 테스트

- [ ] 4.1 로컬에서 스트리밍 채팅 전체 흐름 확인 (텍스트 점진적 표시)
- [ ] 4.2 증상 언급 시 `record_saved` 이벤트 수신 확인
- [ ] 4.3 에러 시나리오 (네트워크 끊김) 동작 확인
