from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from app.schemas.agency import AgencyOut
from app.schemas.user import UserOut
from app.schemas.audit_log import AuditLogOut
from app.schemas.side_convo import SideConversationOut


class TicketMessageCreate(BaseModel):
    sender_id: Optional[str] = None
    sender_email: str
    sender_role: str
    message_type: str = "PUBLIC"  # PUBLIC or INTERNAL_NOTE
    body: str


class TicketMessageOut(BaseModel):
    id: str
    ticket_id: str
    sender_id: Optional[str]
    sender_email: str
    sender_role: str
    message_type: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketCreate(BaseModel):
    tboh_hash: str
    agency_id: str
    requester_email: str
    subject: str
    description: str
    category: str
    priority: Optional[str] = "MEDIUM"
    check_in_date: datetime
    last_cancellation_date: Optional[datetime] = None
    region: Optional[str] = "GLOBAL"
    theme_tags: Optional[List[str]] = []


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    category: Optional[str] = None
    theme_tags: Optional[List[str]] = None


class TicketEscalateRequest(BaseModel):
    reason: str
    escalation_notes: Optional[str] = None
    actor_id: Optional[str] = None
    actor_name: Optional[str] = "Operations Lead"
    actor_role: Optional[str] = "LEAD"


class TicketTransferRequest(BaseModel):
    target_agent_id: str
    reason: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = "Agent"
    actor_role: Optional[str] = "AGENT"


class TicketSummary(BaseModel):
    id: str
    ticket_number: str
    tboh_hash: str
    agency_id: str
    agency_name: Optional[str] = None
    agency_tier: Optional[str] = None
    requester_email: str
    subject: str
    category: str
    priority: str
    status: str
    region: str
    check_in_date: datetime
    last_cancellation_date: Optional[datetime] = None
    assigned_agent_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    routing_score: float
    routing_reason: Optional[str] = None
    sla_status: str
    sla_deadline: datetime
    theme_tags: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketDetail(TicketSummary):
    description: str
    agency: Optional[AgencyOut] = None
    assigned_agent: Optional[UserOut] = None
    messages: List[TicketMessageOut] = []
    side_conversations: List[SideConversationOut] = []
    audit_logs: List[AuditLogOut] = []

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    items: List[TicketSummary]
    total: int
    page: int
    page_size: int


class ContextLinksResponse(BaseModel):
    current_ticket_id: str
    tboh_hash: str
    agency_id: str
    same_booking_tickets: List[TicketSummary]
    same_agency_tickets: List[TicketSummary]
