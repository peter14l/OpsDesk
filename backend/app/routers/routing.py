from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ticket import Ticket
from app.models.audit_log import AuditLog
from app.services.routing_engine import evaluate_ticket_routing

router = APIRouter(prefix="/routing", tags=["Routing Engine"])


@router.post("/evaluate/{ticket_id}")
def run_routing_evaluation(ticket_id: str, apply: bool = False, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    best_agent, score, reason = evaluate_ticket_routing(db, ticket, ticket.agency)

    if apply and best_agent:
        old_agent_name = ticket.assigned_agent.full_name if ticket.assigned_agent else "Unassigned"
        if ticket.assigned_agent and ticket.assigned_agent.active_ticket_count > 0:
            ticket.assigned_agent.active_ticket_count -= 1

        ticket.assigned_agent_id = best_agent.id
        best_agent.active_ticket_count += 1
        ticket.routing_score = score
        ticket.routing_reason = reason

        audit = AuditLog(
            ticket_id=ticket.id,
            actor_name="Routing Engine",
            actor_role="SYSTEM",
            action_type="ROUTED",
            previous_state=f"Assigned: {old_agent_name}",
            new_state=f"Assigned: {best_agent.full_name}",
            reason=reason,
        )
        db.add(audit)
        db.commit()
        db.refresh(ticket)

    return {
        "ticket_id": ticket.id,
        "evaluated_agent_id": best_agent.id if best_agent else None,
        "evaluated_agent_name": best_agent.full_name if best_agent else "None",
        "routing_score": score,
        "routing_reason": reason,
        "applied": apply,
    }
