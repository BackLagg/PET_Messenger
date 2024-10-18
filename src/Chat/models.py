from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.database import Base
from datetime import datetime

class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True, index=True)
    participants = Column(JSONB)
    messages = relationship("Message", back_populates="chat")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    text = Column(String, nullable=False)
    is_picture = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    sender = Column(Integer, ForeignKey("user.id"), nullable=False)
    chat = relationship("Chat", back_populates="messages")
