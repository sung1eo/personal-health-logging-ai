from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import BodyPart, HealthRecord, User

router = APIRouter(prefix="/health-records", tags=["health-records"])


class HealthRecordOut(BaseModel):
    id: int
    body_part: str
    symptom_text: str
    context_text: Optional[str]
    occurred_at: Optional[datetime]
    recorded_at: datetime
    source: str

    class Config:
        from_attributes = True


class HealthRecordUpdate(BaseModel):
    body_part: Optional[str] = None
    symptom_text: Optional[str] = None
    context_text: Optional[str] = None
    occurred_at: Optional[datetime] = None


@router.get("", response_model=list[HealthRecordOut])
def list_health_records(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(HealthRecord).filter(HealthRecord.user_id == current_user.id)
    if start_date:
        query = query.filter(HealthRecord.occurred_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(HealthRecord.occurred_at <= datetime.combine(end_date, datetime.max.time()))
    return query.order_by(HealthRecord.occurred_at.desc()).all()


@router.get("/{record_date}", response_model=list[HealthRecordOut])
def get_records_by_date(
    record_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.combine(record_date, datetime.min.time())
    end = datetime.combine(record_date, datetime.max.time())
    return (
        db.query(HealthRecord)
        .filter(
            HealthRecord.user_id == current_user.id,
            HealthRecord.occurred_at >= start,
            HealthRecord.occurred_at <= end,
        )
        .order_by(HealthRecord.occurred_at)
        .all()
    )


@router.patch("/{record_id}", response_model=HealthRecordOut)
def update_health_record(
    record_id: int,
    body: HealthRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(HealthRecord).filter(
        HealthRecord.id == record_id,
        HealthRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if body.body_part is not None:
        try:
            record.body_part = BodyPart(body.body_part)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid body_part: {body.body_part}")

    if body.symptom_text is not None:
        record.symptom_text = body.symptom_text
    if body.context_text is not None:
        record.context_text = body.context_text
    if body.occurred_at is not None:
        record.occurred_at = body.occurred_at

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_health_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(HealthRecord).filter(
        HealthRecord.id == record_id,
        HealthRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
