from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.ticket import Ticket
from app.models.agency import Agency
from app.models.user import User


def get_ticket_context_links(db: Session, ticket_id: str) -> Dict[str, Any]:
    """
    Finds historical and active tickets sharing the same TBOH booking hash or Agency ID.
    Enables instant side-pane correlation to eradicate duplicate investigations.
    """
    current_ticket = db.query(Ticket).filter((Ticket.id == ticket_id) | (Ticket.ticket_number == ticket_id)).first()
    if not current_ticket:
        return {
            "current_ticket_id": ticket_id,
            "tboh_hash": "",
            "agency_id": "",
            "same_booking_tickets": [],
            "same_agency_tickets": [],
        }

    # 1. Linked by same TBOH (excluding current ticket)
    same_booking_query = db.query(Ticket).filter(
        Ticket.tboh_hash == current_ticket.tboh_hash,
        Ticket.id != current_ticket.id,
    ).order_by(Ticket.created_at.desc()).all()

    # 2. Linked by same Agency (excluding current ticket and those in same_booking)
    same_booking_ids = {t.id for t in same_booking_query}
    same_agency_query = db.query(Ticket).filter(
        Ticket.agency_id == current_ticket.agency_id,
        Ticket.id != current_ticket.id,
        ~Ticket.id.in_(same_booking_ids) if same_booking_ids else True,
    ).order_by(Ticket.created_at.desc()).limit(10).all()

    def serialize_ticket(t: Ticket) -> Dict[str, Any]:
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
            "check_in_date": t.check_in_date.isoformat() if t.check_in_date else None,
            "last_cancellation_date": t.last_cancellation_date.isoformat() if t.last_cancellation_date else None,
            "assigned_agent_id": t.assigned_agent_id,
            "assigned_agent_name": t.assigned_agent.full_name if t.assigned_agent else "Unassigned",
            "routing_score": t.routing_score,
            "routing_reason": t.routing_reason,
            "sla_status": t.sla_status,
            "sla_deadline": t.sla_deadline.isoformat() if t.sla_deadline else None,
            "theme_tags": t.theme_tags,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }

    return {
        "current_ticket_id": current_ticket.id,
        "tboh_hash": current_ticket.tboh_hash,
        "agency_id": current_ticket.agency_id,
        "same_booking_tickets": [serialize_ticket(t) for t in same_booking_query],
        "same_agency_tickets": [serialize_ticket(t) for t in same_agency_query],
    }
