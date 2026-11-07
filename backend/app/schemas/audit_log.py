from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class AuditLogBase(BaseModel):
    ticket_id: str
    actor_id: Optional[str] = None
    actor_name: str
    actor_role: str
    action_type: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    reason: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogOut(AuditLogBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
