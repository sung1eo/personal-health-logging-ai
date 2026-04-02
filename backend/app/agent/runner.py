import json
from datetime import datetime
from typing import AsyncGenerator

from agents import Agent, Runner, set_tracing_disabled
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel

set_tracing_disabled(True)
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.models.models import Conversation, Message
from app.agent.prompts import get_system_prompt
from app.agent.tools import AgentContext, extract_and_save_symptoms, update_health_record
from app.services.pattern_service import get_pattern_summary_for_agent


def _get_gemini_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        api_key=settings.gemini_api_key,
    )


def _make_agent(current_date: str, past_summary: str) -> Agent:
    client = _get_gemini_client()
    return Agent(
        name="health-logger",
        model=OpenAIChatCompletionsModel(model="gemini-2.5-flash", openai_client=client),
        instructions=get_system_prompt(current_date, past_summary),
        tools=[extract_and_save_symptoms, update_health_record],
    )


async def stream_agent(
    user_message: str,
    conversation_id: int,
    user_id: int,
    db: Session,
) -> AsyncGenerator[str, None]:
    """
    Agent를 스트리밍으로 실행하고 SSE 형식의 문자열을 yield합니다.
    이벤트 타입:
      - text_delta: 텍스트 청크
      - record_saved: 기록 저장 완료 (record_ids 포함)
      - done: 완료 (conversation_id 포함)
      - error: 에러
    """
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    history = []
    if conversation:
        for msg in conversation.messages:
            history.append({"role": msg.role, "content": msg.content})

    past_summary = get_pattern_summary_for_agent(user_id, db)
    current_date = datetime.now().strftime("%Y년 %m월 %d일")
    agent = _make_agent(current_date, past_summary)

    context = AgentContext(db=db, user_id=user_id)
    messages_for_agent = history + [{"role": "user", "content": user_message}]

    try:
        result = Runner.run_streamed(agent, messages_for_agent, context=context)
        full_text = ""
        saved_record_ids: list[int] = []

        stream_iter = result.stream_events().__aiter__()
        while True:
            try:
                event = await stream_iter.__anext__()
            except StopAsyncIteration:
                break
            except Exception as e:
                import logging
                logging.warning(f"[stream] skipped event error: {type(e).__name__}: {str(e)[:120]}")
                continue

            if event.type == "raw_response_event":
                data = event.data
                # openai-agents >= 0.13: ResponseTextDeltaEvent (type="response.output_text.delta")
                if hasattr(data, "type") and data.type == "response.output_text.delta":
                    text = data.delta
                    if text:
                        full_text += text
                        yield f"data: {json.dumps({'type': 'text_delta', 'text': text}, ensure_ascii=False)}\n\n"
                # 구버전 ChatCompletionChunk 포맷 fallback
                elif hasattr(data, "choices") and data.choices:
                    delta = data.choices[0].delta
                    if delta and delta.content:
                        full_text += delta.content
                        yield f"data: {json.dumps({'type': 'text_delta', 'text': delta.content}, ensure_ascii=False)}\n\n"

            elif event.type == "run_item_stream_event" and event.name == "tool_output":
                # 툴 실행 완료 — record_ids 수집
                item = event.item
                if hasattr(item, "output") and isinstance(item.output, dict):
                    ids = item.output.get("record_ids", [])
                    if ids:
                        saved_record_ids.extend(ids)
                        yield f"data: {json.dumps({'type': 'record_saved', 'record_ids': ids})}\n\n"

        # 메시지 DB 저장
        db.add(Message(conversation_id=conversation_id, role="user", content=user_message))
        db.add(Message(conversation_id=conversation_id, role="assistant", content=full_text))
        db.commit()

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'record_ids': saved_record_ids})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


async def run_agent(
    user_message: str,
    conversation_id: int,
    user_id: int,
    db: Session,
) -> tuple[str, list[int]]:
    """stream_agent를 소비하여 최종 텍스트와 record_ids를 반환합니다."""
    full_text = ""
    record_ids: list[int] = []
    async for chunk in stream_agent(user_message, conversation_id, user_id, db):
        data_str = chunk.removeprefix("data: ").strip()
        if not data_str:
            continue
        try:
            event = json.loads(data_str)
            if event.get("type") == "text_delta":
                full_text += event.get("text", "")
            elif event.get("type") == "record_saved":
                record_ids.extend(event.get("record_ids", []))
        except json.JSONDecodeError:
            pass
    return full_text, record_ids
