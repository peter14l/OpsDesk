import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(32), nullable=False)
    action_type = Column(String(64), nullable=False)  # CREATED, ROUTED, STATUS_CHANGED, ESCALATED, TRANSFERRED, SIDE_CONVO_CREATED, NOTE_ADDED, SLA_UPDATED
    previous_state = Column(String(255), nullable=True)
    new_state = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    ticket = relationship("Ticket", back_populates="audit_logs")
