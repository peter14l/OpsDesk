from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.side_convo import SideConversation, SideConversationMessage
from app.models.audit_log import AuditLog
from app.schemas.side_convo import (
    SideConversationCreate,
    SideConversationOut,
    SideConversationMessageCreate,
    SideConversationMessageOut,
)
from app.routers.events import event_broadcaster

router = APIRouter(tags=["Side Conversations"])


@router.get("/tickets/{ticket_id}/side-conversations", response_model=List[SideConversationOut])
def list_side_conversations(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    convos = (
        db.query(SideConversation)
        .filter(SideConversation.ticket_id == ticket_id)
        .order_by(SideConversation.created_at.asc())
        .all()
    )
    return convos


@router.post("/tickets/{ticket_id}/side-conversations", response_model=SideConversationOut)
async def create_side_conversation(
    ticket_id: str,
    payload: SideConversationCreate,
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    creator_id = payload.created_by_agent_id or ticket.assigned_agent_id
    if not creator_id:
        raise HTTPException(status_code=400, detail="Creator agent ID required")

    # Clean and ensure unique recipient list
    recipients = list(dict.fromkeys([email.strip() for email in payload.recipient_emails if email.strip()]))
    if payload.supplier_email not in recipients:
        recipients.insert(0, payload.supplier_email.strip())

    side_convo = SideConversation(
        ticket_id=ticket.id,
        subject=payload.subject.strip(),
        supplier_name=payload.supplier_name.strip(),
        supplier_email=payload.supplier_email.strip(),
        recipient_emails=recipients,
        status="OPEN",
        created_by_agent_id=creator_id,
    )
    db.add(side_convo)
    db.flush()

    # Initial message
    first_msg = SideConversationMessage(
        side_conversation_id=side_convo.id,
        sender_email=ticket.assigned_agent.email if ticket.assigned_agent else "ops@tbo.com",
        is_supplier_incoming=False,
        body=payload.initial_message,
    )
    db.add(first_msg)

    # Audit log
    audit = AuditLog(
        ticket_id=ticket.id,
        actor_id=creator_id,
        actor_name="Agent",
        actor_role="AGENT",
        action_type="SIDE_CONVO_CREATED",
        new_state=f"Thread: {side_convo.subject}",
        reason=f"Started supplier side-convo with {payload.supplier_name} ({payload.supplier_email}). Explicit recipients: {', '.join(recipients)}",
    )
    db.add(audit)

    # Ticket status updated to PENDING_SUPPLIER if currently OPEN
    if ticket.status == "OPEN":
        ticket.status = "PENDING_SUPPLIER"

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(side_convo)

    await event_broadcaster.broadcast("SIDE_CONVO_UPDATED", {
        "ticket_id": ticket.id,
        "side_conversation_id": side_convo.id,
        "supplier_name": side_convo.supplier_name,
        "status": side_convo.status,
    })

    return side_convo


@router.post("/side-conversations/{side_convo_id}/messages", response_model=SideConversationMessageOut)
async def add_side_conversation_message(
    side_convo_id: str,
    payload: SideConversationMessageCreate,
    db: Session = Depends(get_db),
):
    side_convo = db.query(SideConversation).filter(SideConversation.id == side_convo_id).first()
    if not side_convo:
        raise HTTPException(status_code=404, detail="Side conversation not found")

    sender_email = payload.sender_email or (side_convo.supplier_email if payload.is_supplier_incoming else "ops@tbo.com")

    msg = SideConversationMessage(
        side_conversation_id=side_convo.id,
        sender_email=sender_email,
        is_supplier_incoming=payload.is_supplier_incoming,
        body=payload.body,
    )
    db.add(msg)

    side_convo.updated_at = datetime.utcnow()
    if payload.is_supplier_incoming:
        side_convo.status = "OPEN"
        # If ticket was waiting on supplier, nudge it back to OPEN
        if side_convo.ticket and side_convo.ticket.status == "PENDING_SUPPLIER":
            side_convo.ticket.status = "OPEN"
    else:
        side_convo.status = "WAITING_ON_SUPPLIER"

    # Audit entry for supplier incoming replies
    if payload.is_supplier_incoming:
        audit = AuditLog(
            ticket_id=side_convo.ticket_id,
            actor_name=side_convo.supplier_name,
            actor_role="SUPPLIER",
            action_type="SIDE_CONVO_REPLY",
            new_state=side_convo.ticket.status if side_convo.ticket else "OPEN",
            reason=f"Supplier reply received from {sender_email}",
        )
        db.add(audit)

    db.commit()
    db.refresh(msg)

    await event_broadcaster.broadcast("SIDE_CONVO_UPDATED", {
        "ticket_id": side_convo.ticket_id,
        "side_conversation_id": side_convo.id,
        "is_supplier_incoming": payload.is_supplier_incoming,
    })

    return msg
