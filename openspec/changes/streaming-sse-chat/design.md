## Context

사용자가 채팅 메시지를 보냈을 때 AI 응답이 모두 완성된 후 한 번에 표시되어 체감 속도가 느렸다. Gemini 2.5 Flash 모델의 응답 생성에 수 초가 걸리므로 스트리밍으로 점진적 표시가 필요했다.

기존 흐름:
```
사용자 전송 → POST /conversations/{id}/messages → (2-5초 대기) → 전체 응답 표시
```

## Goals / Non-Goals

**Goals:**
- AI 응답 텍스트를 생성되는 즉시 프론트엔드에 전달 (SSE streaming)
- 도구 실행(증상 저장) 완료 시 record_ids를 실시간으로 프론트에 알림
- 기존 비스트리밍 엔드포인트 하위 호환 유지

**Non-Goals:**
- WebSocket 양방향 통신
- 음성 스트리밍
- 스트리밍 중 취소(abort) 기능

## Architecture

### Backend: OpenAI Agents SDK Runner.run_streamed()

```python
# runner.py
async def stream_agent(...) -> AsyncGenerator[str, None]:
    result = Runner.run_streamed(agent, messages, context=context)
    async for event in result.stream_events():
        if event.type == "raw_response_event":
            # ChatCompletionChunk → delta.content → text_delta SSE
        elif event.type == "run_item_stream_event" and event.name == "tool_output":
            # tool 결과 → record_ids → record_saved SSE
    # 완료 후 DB에 메시지 저장
    yield done SSE
```

### SSE 이벤트 스키마

| type | payload | 의미 |
|------|---------|------|
| `text_delta` | `{ text: string }` | 텍스트 청크 (연속 수신) |
| `record_saved` | `{ record_ids: number[] }` | 증상 기록 저장 완료 |
| `done` | `{ conversation_id, record_ids }` | 스트림 종료 |
| `error` | `{ message: string }` | 에러 발생 |

### Backend Endpoint

```
POST /conversations/{id}/messages/stream
Content-Type: application/json
Authorization: Bearer <jwt>

→ 200 text/event-stream
data: {"type":"text_delta","text":"안녕"}

data: {"type":"record_saved","record_ids":[42]}

data: {"type":"done","conversation_id":1,"record_ids":[42]}
```

FastAPI `StreamingResponse`로 `stream_agent()` 비동기 제너레이터를 감쌈.

### Frontend: fetch + ReadableStream

```typescript
// api.ts
async function streamMessage(conversationId, content, onEvent) {
  const res = await fetch(`.../messages/stream`, { method: "POST", ... });
  const reader = res.body!.getReader();
  // SSE 라인 파싱 → onEvent 콜백 호출
}
```

```typescript
// chat/page.tsx
await streamMessage(conversationId, text, (event) => {
  if (event.type === "text_delta") {
    streamedText += event.text;
    setMessages([...withUser, { role: "assistant", content: streamedText }]);
  }
});
```

어시스턴트 버블은 빈 문자열로 즉시 추가되고, `text_delta` 이벤트마다 내용이 갱신된다.

## Decisions

### SSE vs WebSocket

**결정**: SSE (단방향 서버→클라이언트 push)

**이유**: 채팅 스트리밍은 단방향으로 충분. SSE는 HTTP 기반이라 CORS, 인증 헤더 적용이 그대로 가능하고 재연결도 브라우저가 자동 처리. WebSocket 대비 설정 복잡도 현저히 낮음.

### 기존 엔드포인트 유지 여부

**결정**: 유지 (`POST /conversations/{id}/messages` 비스트리밍 엔드포인트 존재)

**이유**: `run_agent()`를 `stream_agent()` 위에 래퍼로 재구현하여 코드 중복 없이 하위 호환 유지.

## Risks / Trade-offs

- **SSE 연결 끊김**: 모바일 환경에서 네트워크 전환 시 스트림이 끊길 수 있음. `done` 이벤트 전에 끊어지면 메시지가 불완전하게 저장됨 → MVP에서 허용, 재시도 안내 메시지로 처리.
- **FastAPI StreamingResponse + async generator**: DB 세션이 스트림 완료 전까지 열려 있어야 함. `get_db()` dependency가 아닌 session을 직접 전달하여 생명주기 관리.
