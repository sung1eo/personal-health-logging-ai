from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.models import HealthRecord


def get_past_records_by_body_part(user_id: int, body_part: str, db: Session, limit: int = 5) -> list[HealthRecord]:
    return (
        db.query(HealthRecord)
        .filter(HealthRecord.user_id == user_id, HealthRecord.body_part == body_part)
        .order_by(desc(HealthRecord.recorded_at))
        .limit(limit)
        .all()
    )


def get_pattern_summary_for_agent(user_id: int, db: Session) -> str:
    """
    사용자의 최근 증상 이력을 요약해서 Agent system prompt에 주입할 텍스트로 반환합니다.
    기록이 없으면 빈 문자열을 반환합니다.
    """
    records = (
        db.query(HealthRecord)
        .filter(HealthRecord.user_id == user_id)
        .order_by(desc(HealthRecord.recorded_at))
        .limit(20)
        .all()
    )

    if not records:
        return ""

    lines = []
    for r in records:
        date_str = r.occurred_at.strftime("%Y-%m-%d %H:%M") if r.occurred_at else "날짜 미상"
        context = f" (컨텍스트: {r.context_text})" if r.context_text else ""
        lines.append(f"- [{date_str}] {r.body_part.value}: {r.symptom_text}{context}")

    return "\n".join(lines)
