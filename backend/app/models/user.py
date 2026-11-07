import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False)  # REQUESTER, AGENT, ESCALATION_MANAGER, LEAD
    region = Column(String(64), nullable=False, default="GLOBAL")  # EMEA, APAC, AMER, GLOBAL
    skills_json = Column(Text, nullable=False, default="[]")  # Serialized JSON list
    availability_status = Column(String(32), nullable=False, default="AVAILABLE")  # AVAILABLE, BUSY, OFFLINE
    active_ticket_count = Column(Integer, nullable=False, default=0)
    max_concurrency = Column(Integer, nullable=False, default=6)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    assigned_tickets = relationship("Ticket", back_populates="assigned_agent", foreign_keys="Ticket.assigned_agent_id")
    side_conversations = relationship("SideConversation", back_populates="creator")

    @property
    def skills(self):
        try:
            return json.loads(self.skills_json) if self.skills_json else []
        except Exception:
            return []

    @skills.setter
    def skills(self, val):
        self.skills_json = json.dumps(val if isinstance(val, list) else [])
