import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = Column(String(32), unique=True, nullable=False, index=True)
    tboh_hash = Column(String(64), nullable=False, index=True)  # TBO Hotel/Booking Reference
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    requester_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requester_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)  # CANCELLATION, AMENDMENT, REFUND, VOUCHER_ISSUE, etc.
    priority = Column(String(32), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(32), nullable=False, default="NEW", index=True)  # NEW, OPEN, PENDING_SUPPLIER, ESCALATED, RESOLVED, CLOSED
    check_in_date = Column(DateTime, nullable=False)
    last_cancellation_date = Column(DateTime, nullable=True)
    region = Column(String(64), nullable=False, default="GLOBAL")
    assigned_agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    routing_score = Column(Float, nullable=False, default=0.0)
    routing_reason = Column(Text, nullable=True)
    sla_status = Column(String(32), nullable=False, default="ON_TRACK")  # ON_TRACK, AT_RISK, BREACHED
    sla_deadline = Column(DateTime, nullable=False)
    theme_tags_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="tickets")
    assigned_agent = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_agent_id])
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.created_at.asc()")
    side_conversations = relationship("SideConversation", back_populates="ticket", cascade="all, delete-orphan", order_by="SideConversation.created_at.asc()")
    audit_logs = relationship("AuditLog", back_populates="ticket", cascade="all, delete-orphan", order_by="AuditLog.created_at.desc()")

    @property
    def theme_tags(self):
        try:
            return json.loads(self.theme_tags_json) if self.theme_tags_json else []
        except Exception:
            return []

    @theme_tags.setter
    def theme_tags(self, val):
        self.theme_tags_json = json.dumps(val if isinstance(val, list) else [])


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_email = Column(String(255), nullable=False)
    sender_role = Column(String(32), nullable=False)  # REQUESTER, AGENT, ESCALATION_MANAGER, LEAD, SYSTEM
    message_type = Column(String(32), nullable=False, default="PUBLIC")  # PUBLIC, INTERNAL_NOTE
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="messages")
