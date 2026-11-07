from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class UserBase(BaseModel):
    email: str
    full_name: str
    role: str  # REQUESTER, AGENT, ESCALATION_MANAGER, LEAD
    region: str = "GLOBAL"
    skills: List[str] = []
    availability_status: str = "AVAILABLE"
    max_concurrency: int = 6


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    id: str
    active_ticket_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
