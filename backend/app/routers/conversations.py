from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import Conversation, User
from app.agent.runner import run_agent, stream_agent

router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationOut(BaseModel):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class MessageIn(BaseModel):
    content: str


class MessageOut(BaseModel):
    response: str
    saved_record_ids: list[int]
    conversation_id: int


@router.post("", response_model=ConversationOut)
def create_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(user_id=current_user.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: int,
    body: MessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    response_text, saved_record_ids = await run_agent(
        user_message=body.content,
        conversation_id=conversation_id,
        user_id=current_user.id,
        db=db,
    )

    return MessageOut(
        response=response_text,
        saved_record_ids=saved_record_ids,
        conversation_id=conversation_id,
    )


@router.post("/{conversation_id}/messages/stream")
async def send_message_stream(
    conversation_id: int,
    body: MessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return StreamingResponse(
        stream_agent(
            user_message=body.content,
            conversation_id=conversation_id,
            user_id=current_user.id,
            db=db,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
