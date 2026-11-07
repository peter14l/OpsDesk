from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class SideConversationMessageBase(BaseModel):
    sender_email: str
    is_supplier_incoming: bool = False
    body: str


class SideConversationMessageCreate(BaseModel):
    sender_email: Optional[str] = None
    is_supplier_incoming: bool = False
    body: str


class SideConversationMessageOut(SideConversationMessageBase):
    id: str
    side_conversation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SideConversationCreate(BaseModel):
    ticket_id: str
    subject: str
    supplier_name: str
    supplier_email: str
    recipient_emails: List[str]
    initial_message: str
    created_by_agent_id: Optional[str] = None


class SideConversationOut(BaseModel):
    id: str
    ticket_id: str
    subject: str
    supplier_name: str
    supplier_email: str
    recipient_emails: List[str]
    status: str
    created_by_agent_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[SideConversationMessageOut] = []

    model_config = ConfigDict(from_attributes=True)
