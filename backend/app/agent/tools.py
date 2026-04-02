from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from agents import RunContextWrapper, function_tool
from sqlalchemy.orm import Session

from app.models.models import BodyPart, HealthRecord, RecordSource


@dataclass
class AgentContext:
    db: Session
    user_id: int


@function_tool
def extract_and_save_symptoms(
    ctx: RunContextWrapper[AgentContext],
    body_parts: list[str],
    symptom_texts: list[str],
    occurred_at_strs: list[str],
    context_texts: list[str],
) -> dict:
    """
    사용자의 발화에서 추출한 증상 정보를 health_record로 저장합니다.
    body_parts, symptom_texts, occurred_at_strs, context_texts는 같은 길이의 배열입니다.
    각 인덱스가 하나의 증상 기록에 해당합니다.
    occurred_at_strs는 ISO 8601 형식 또는 빈 문자열(날짜 불명)입니다.
    저장된 record_id 목록을 반환합니다. update_health_record 호출 시 이 ID를 사용하세요.
    """
    db = ctx.context.db
    user_id = ctx.context.user_id

    ids = []
    for i in range(len(body_parts)):
        try:
            bp = BodyPart(body_parts[i])
        except ValueError:
            bp = BodyPart.기타

        occurred_at = datetime.now()
        if i < len(occurred_at_strs) and occurred_at_strs[i]:
            try:
                occurred_at = datetime.fromisoformat(occurred_at_strs[i])
            except ValueError:
                pass

        record = HealthRecord(
            user_id=user_id,
            body_part=bp,
            symptom_text=symptom_texts[i] if i < len(symptom_texts) else "",
            context_text=context_texts[i] if i < len(context_texts) else None,
            occurred_at=occurred_at,
            source=RecordSource.chat,
        )
        db.add(record)
        db.flush()
        ids.append(record.id)

    db.commit()
    return {"saved": True, "record_ids": ids}


@function_tool
def update_health_record(
    ctx: RunContextWrapper[AgentContext],
    record_id: int,
    body_part: Optional[str],
    symptom_text: Optional[str],
    occurred_at_str: Optional[str],
    context_text: Optional[str],
) -> dict:
    """
    기존 health_record를 수정합니다. record_id는 extract_and_save_symptoms가 반환한 record_ids 중 하나여야 합니다.
    수정할 필드만 값을 전달하고 나머지는 None으로 둡니다.
    """
    db = ctx.context.db

    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        return {"updated": False, "error": f"record_id {record_id} not found"}

    if body_part:
        try:
            record.body_part = BodyPart(body_part)
        except ValueError:
            record.body_part = BodyPart.기타

    if symptom_text:
        record.symptom_text = symptom_text

    if context_text is not None:
        record.context_text = context_text

    if occurred_at_str:
        try:
            record.occurred_at = datetime.fromisoformat(occurred_at_str)
        except ValueError:
            return {"updated": False, "error": f"invalid occurred_at_str: {occurred_at_str}"}

    db.commit()
    return {"updated": True, "record_id": record_id}
