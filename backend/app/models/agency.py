import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    tier = Column(String(32), nullable=False, default="STANDARD")  # PLATINUM, GOLD, SILVER, STANDARD
    region = Column(String(64), nullable=False)  # EMEA, APAC, AMER, GLOBAL
    country_code = Column(String(2), nullable=False)  # AE, IN, GB, US, etc.
    account_manager = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    tickets = relationship("Ticket", back_populates="agency", cascade="all, delete-orphan")
