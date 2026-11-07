import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class SideConversation(Base):
    __tablename__ = "side_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    supplier_email = Column(String(255), nullable=False)
    # Explicit recipient list bound directly to this side thread instance, survives any ticket reassignment/transfer
    recipient_emails_json = Column(Text, nullable=False, default="[]")
    status = Column(String(32), nullable=False, default="OPEN")  # OPEN, WAITING_ON_SUPPLIER, RESOLVED
    created_by_agent_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="side_conversations")
    creator = relationship("User", back_populates="side_conversations")
    messages = relationship("SideConversationMessage", back_populates="side_conversation", cascade="all, delete-orphan", order_by="SideConversationMessage.created_at.asc()")

    @property
    def recipient_emails(self):
        try:
            return json.loads(self.recipient_emails_json) if self.recipient_emails_json else []
        except Exception:
            return []

    @recipient_emails.setter
    def recipient_emails(self, val):
        self.recipient_emails_json = json.dumps(val if isinstance(val, list) else [])


class SideConversationMessage(Base):
    __tablename__ = "side_conversation_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    side_conversation_id = Column(String(36), ForeignKey("side_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_email = Column(String(255), nullable=False)
    is_supplier_incoming = Column(Boolean, nullable=False, default=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    side_conversation = relationship("SideConversation", back_populates="messages")
