import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class BodyPart(str, enum.Enum):
    머리 = "머리"
    목 = "목"
    가슴 = "가슴"
    복부 = "복부"
    등 = "등"
    허리 = "허리"
    팔 = "팔"
    다리 = "다리"
    전신 = "전신"
    기타 = "기타"


class RecordSource(str, enum.Enum):
    chat = "chat"
    manual = "manual"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    health_records = relationship("HealthRecord", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body_part = Column(Enum(BodyPart), nullable=False)
    symptom_text = Column(String, nullable=False)
    context_text = Column(Text, nullable=True)
    occurred_at = Column(DateTime, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    source = Column(Enum(RecordSource), default=RecordSource.chat)

    user = relationship("User", back_populates="health_records")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
