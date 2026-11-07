from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.ticket import Ticket, TicketMessage
from app.models.agency import Agency
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.side_convo import SideConversation, SideConversationMessage
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketSummary,
    TicketDetail,
    TicketListResponse,
    TicketEscalateRequest,
    TicketTransferRequest,
    TicketMessageCreate,
    TicketMessageOut,
)
from app.services.routing_engine import evaluate_ticket_routing
from app.services.sla_service import calculate_travel_aware_sla
from app.services.linkage_service import get_ticket_context_links

router = APIRouter(prefix="/tickets", tags=["Tickets"])


def serialize_summary(t: Ticket) -> dict:
    return {
        "id": t.id,
        "ticket_number": t.ticket_number,
        "tboh_hash": t.tboh_hash,
        "agency_id": t.agency_id,
        "agency_name": t.agency.name if t.agency else "Unknown",
        "agency_tier": t.agency.tier if t.agency else "STANDARD",
        "requester_email": t.requester_email,
        "subject": t.subject,
        "category": t.category,
        "priority": t.priority,
        "status": t.status,
        "region": t.region,
        "check_in_date": t.check_in_date,
        "last_cancellation_date": t.last_cancellation_date,
        "assigned_agent_id": t.assigned_agent_id,
        "assigned_agent_name": t.assigned_agent.full_name if t.assigned_agent else "Unassigned",
        "routing_score": t.routing_score,
        "routing_reason": t.routing_reason,
        "sla_status": t.sla_status,
        "sla_deadline": t.sla_deadline,
        "theme_tags": t.theme_tags,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


@router.get("", response_model=TicketListResponse)
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    sla_status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    if status:
        query = query.filter(Ticket.status == status.upper())
    if priority:
        query = query.filter(Ticket.priority == priority.upper())
    if region:
        query = query.filter(Ticket.region == region.upper())
    if assigned_to:
        query = query.filter(Ticket.assigned_agent_id == assigned_to)
    if sla_status:
        query = query.filter(Ticket.sla_status == sla_status.upper())
    if category:
        query = query.filter(Ticket.category == category.upper())
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(search_fmt),
                Ticket.tboh_hash.ilike(search_fmt),
                Ticket.subject.ilike(search_fmt),
                Ticket.requester_email.ilike(search_fmt),
            )
        )

    total = query.count()
    items = (
        query.order_by(desc(Ticket.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Re-evaluate live dynamic SLA status for accuracy
    now = datetime.utcnow()
    for item in items:
        rem_sec = (item.sla_deadline - now).total_seconds()
        if rem_sec <= 0 and item.status not in ["RESOLVED", "CLOSED"]:
            item.sla_status = "BREACHED"
        elif rem_sec <= 3600 and item.status not in ["RESOLVED", "CLOSED"]:
            item.sla_status = "AT_RISK"
        elif item.status not in ["RESOLVED", "CLOSED"]:
            item.sla_status = "ON_TRACK"

    return {
        "items": [serialize_summary(t) for t in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", response_model=dict)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    agency = db.query(Agency).filter(Agency.id == payload.agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Generate sequential/unique ticket number
    count = db.query(Ticket).count() + 1000
    ticket_number = f"TBO-2026-{count}"

    now = datetime.utcnow()

    # Dynamic SLA calculation
    effective_deadline, sla_status = calculate_travel_aware_sla(
        created_at=now,
        check_in_date=payload.check_in_date,
        last_cancellation_date=payload.last_cancellation_date,
        priority=payload.priority or "MEDIUM",
    )

    ticket = Ticket(
        ticket_number=ticket_number,
        tboh_hash=payload.tboh_hash.strip().upper(),
        agency_id=agency.id,
        requester_email=payload.requester_email.strip(),
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        category=payload.category.strip().upper(),
        priority=(payload.priority or "MEDIUM").upper(),
        status="NEW",
        check_in_date=payload.check_in_date,
        last_cancellation_date=payload.last_cancellation_date,
        region=payload.region or agency.region,
        sla_deadline=effective_deadline,
        sla_status=sla_status,
        theme_tags=payload.theme_tags or [],
    )

    # Multi-dimensional routing evaluation
    assigned_agent, score, reason = evaluate_ticket_routing(db, ticket, agency)
    if assigned_agent:
        ticket.assigned_agent_id = assigned_agent.id
        ticket.routing_score = score
        ticket.routing_reason = reason
        ticket.status = "OPEN"
        assigned_agent.active_ticket_count += 1
    else:
        ticket.routing_score = 0.0
        ticket.routing_reason = reason

    db.add(ticket)
    db.flush()

    # Create Initial Audit Log
    audit = AuditLog(
        ticket_id=ticket.id,
        actor_name="OpsDesk Engine",
        actor_role="SYSTEM",
        action_type="CREATED",
        new_state=ticket.status,
        reason=f"Ticket created and evaluated. {reason}",
    )
    db.add(audit)

    # Add initial customer message to conversation timeline
    first_msg = TicketMessage(
        ticket_id=ticket.id,
        sender_email=payload.requester_email,
        sender_role="REQUESTER",
        message_type="PUBLIC",
        body=payload.description,
    )
    db.add(first_msg)

    db.commit()
    db.refresh(ticket)

    return {
        "ticket": serialize_summary(ticket),
        "routed_to": {
            "id": assigned_agent.id if assigned_agent else None,
            "name": assigned_agent.full_name if assigned_agent else "Unassigned Queue",
            "score": score,
        },
        "routing_reason": reason,
    }


@router.get("/{ticket_id}", response_model=TicketDetail)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Refresh SLA status in memory
    now = datetime.utcnow()
    rem_sec = (ticket.sla_deadline - now).total_seconds()
    if rem_sec <= 0 and ticket.status not in ["RESOLVED", "CLOSED"]:
        ticket.sla_status = "BREACHED"
    elif rem_sec <= 3600 and ticket.status not in ["RESOLVED", "CLOSED"]:
        ticket.sla_status = "AT_RISK"

    # Assemble response
    summary = serialize_summary(ticket)
    summary["description"] = ticket.description
    summary["agency"] = ticket.agency
    summary["assigned_agent"] = ticket.assigned_agent
    summary["messages"] = ticket.messages
    summary["side_conversations"] = ticket.side_conversations
    summary["audit_logs"] = ticket.audit_logs

    return summary


@router.patch("/{ticket_id}", response_model=dict)
def update_ticket(ticket_id: str, payload: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    if payload.status and payload.status.upper() != ticket.status:
        ticket.status = payload.status.upper()
        audit = AuditLog(
            ticket_id=ticket.id,
            actor_name="Operations Agent",
            actor_role="AGENT",
            action_type="STATUS_CHANGED",
            previous_state=old_status,
            new_state=ticket.status,
            reason=f"Status manually updated to {ticket.status}",
        )
        db.add(audit)

    if payload.priority:
        ticket.priority = payload.priority.upper()
    if payload.category:
        ticket.category = payload.category.upper()
    if payload.theme_tags is not None:
        ticket.theme_tags = payload.theme_tags

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return serialize_summary(ticket)


@router.post("/{ticket_id}/messages", response_model=TicketMessageOut)
def add_ticket_message(ticket_id: str, payload: TicketMessageCreate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=payload.sender_id,
        sender_email=payload.sender_email,
        sender_role=payload.sender_role,
        message_type=payload.message_type,
        body=payload.body,
    )
    db.add(msg)

    # Log internal notes or replies
    action = "NOTE_ADDED" if payload.message_type == "INTERNAL_NOTE" else "REPLY_POSTED"
    audit = AuditLog(
        ticket_id=ticket.id,
        actor_id=payload.sender_id,
        actor_name=payload.sender_email.split("@")[0].title(),
        actor_role=payload.sender_role,
        action_type=action,
        reason=f"Added {payload.message_type} ({len(payload.body)} chars)",
    )
    db.add(audit)

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/{ticket_id}/context-links")
def get_context_links(ticket_id: str, db: Session = Depends(get_db)):
    return get_ticket_context_links(db, ticket_id)


@router.post("/{ticket_id}/escalate", response_model=dict)
def escalate_ticket(ticket_id: str, payload: TicketEscalateRequest, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    old_agent_name = ticket.assigned_agent.full_name if ticket.assigned_agent else "Unassigned"

    # Find active Escalation Manager
    mgr = db.query(User).filter(
        User.role == "ESCALATION_MANAGER",
        User.availability_status.in_(["AVAILABLE", "BUSY"]),
    ).first()

    if not mgr:
        # Fallback to lead
        mgr = db.query(User).filter(User.role == "LEAD").first()

    ticket.status = "ESCALATED"
    ticket.priority = "URGENT"
    if mgr:
        if ticket.assigned_agent and ticket.assigned_agent.active_ticket_count > 0:
            ticket.assigned_agent.active_ticket_count -= 1
        ticket.assigned_agent_id = mgr.id
        mgr.active_ticket_count += 1

    ticket.updated_at = datetime.utcnow()

    # Record immutable audit timeline entry
    reason_full = f"{payload.reason} | Notes: {payload.escalation_notes or 'None'}"
    audit = AuditLog(
        ticket_id=ticket.id,
        actor_id=payload.actor_id,
        actor_name=payload.actor_name or "Operations Desk",
        actor_role=payload.actor_role or "LEAD",
        action_type="ESCALATED",
        previous_state=f"{old_status} (Assigned: {old_agent_name})",
        new_state=f"ESCALATED (Assigned: {mgr.full_name if mgr else 'Manager Pool'})",
        reason=reason_full,
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)

    return {
        "status": "success",
        "ticket": serialize_summary(ticket),
        "escalated_to": mgr.full_name if mgr else "Escalation Pool",
        "audit_id": audit.id,
    }


@router.post("/{ticket_id}/transfer", response_model=dict)
def transfer_ticket(ticket_id: str, payload: TicketTransferRequest, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    target_agent = db.query(User).filter(User.id == payload.target_agent_id).first()
    if not target_agent:
        raise HTTPException(status_code=404, detail="Target agent not found")

    old_agent_name = ticket.assigned_agent.full_name if ticket.assigned_agent else "Unassigned"

    if ticket.assigned_agent and ticket.assigned_agent.active_ticket_count > 0:
        ticket.assigned_agent.active_ticket_count -= 1

    ticket.assigned_agent_id = target_agent.id
    target_agent.active_ticket_count += 1
    ticket.updated_at = datetime.utcnow()

    audit = AuditLog(
        ticket_id=ticket.id,
        actor_id=payload.actor_id,
        actor_name=payload.actor_name or "Agent",
        actor_role=payload.actor_role or "AGENT",
        action_type="TRANSFERRED",
        previous_state=f"Assigned to {old_agent_name}",
        new_state=f"Assigned to {target_agent.full_name}",
        reason=payload.reason,
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)

    return {
        "status": "success",
        "ticket": serialize_summary(ticket),
        "transferred_to": target_agent.full_name,
        "note": "Side-conversations and explicit recipient arrays preserved intact.",
    }
