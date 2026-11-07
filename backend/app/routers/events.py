import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ticket import Ticket, TicketMessage
from app.models.agency import Agency
from app.models.audit_log import AuditLog
from app.services.sla_service import calculate_travel_aware_sla
from app.services.routing_engine import evaluate_ticket_routing

router = APIRouter(prefix="/events", tags=["Real-Time Simulation & Events"])


class EventBroadcaster:
    """
    Lightweight in-memory event bus supporting SSE subscriptions and delta polling.
    Thread-safe and decoupled for enterprise event propagation.
    """
    def __init__(self):
        self.listeners: List[asyncio.Queue] = []
        self.history: List[Dict] = []
        self.max_history = 100

    async def broadcast(self, event_type: str, data: Dict):
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
        }
        self.history.append(event)
        if len(self.history) > self.max_history:
            self.history.pop(0)

        # Notify active SSE subscribers
        dead_queues = []
        for queue in self.listeners:
            try:
                queue.put_nowait(event)
            except Exception:
                dead_queues.append(queue)
        for q in dead_queues:
            if q in self.listeners:
                self.listeners.remove(q)

    def get_since(self, since_iso: Optional[str]) -> List[Dict]:
        if not since_iso:
            return self.history[-10:] if self.history else []
        try:
            since_dt = datetime.fromisoformat(since_iso)
            return [e for e in self.history if datetime.fromisoformat(e["timestamp"]) > since_dt]
        except Exception:
            return self.history[-10:]


event_broadcaster = EventBroadcaster()


@router.get("/stream")
async def sse_event_stream(request: Request):
    """
    Server-Sent Events (SSE) endpoint providing real-time updates for tickets,
    escalations, and agent transfers without manual polling.
    """
    queue = asyncio.Queue(maxsize=50)
    event_broadcaster.listeners.append(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Send initial keep-alive ping
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"

            while True:
                # Disconnect check
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat comment to keep connection alive through enterprise proxies
                    yield ": ping\n\n"
        finally:
            if queue in event_broadcaster.listeners:
                event_broadcaster.listeners.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/poll")
def poll_updates(since: Optional[str] = Query(None)):
    """
    Lightweight delta polling fallback for clients unable to maintain persistent SSE connections.
    """
    events = event_broadcaster.get_since(since)
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "events": events,
    }


@router.post("/simulate-inbound")
async def simulate_inbound_ticket(
    urgency: str = Query("critical", pattern="^(critical|moderate|standard)$"),
    db: Session = Depends(get_db),
):
    """
    Demo Trigger: Simulates an inbound critical operational incident occurring in real-time
    (e.g., flight cancellation or hotel CRS walk) and broadcasts live SSE event.
    """
    agencies = db.query(Agency).all()
    agency = agencies[0] if agencies else None
    if not agency:
        return {"status": "error", "detail": "No agencies available"}

    now = datetime.utcnow()
    hours_ahead = 2 if urgency == "critical" else (18 if urgency == "moderate" else 72)
    checkin = now + timedelta(hours=hours_ahead)
    lcd = checkin - timedelta(hours=12)

    count = db.query(Ticket).count() + 1001
    ticket_num = f"TBO-2026-{count}"
    tboh = f"TBOH-LIVE-{count}"

    deadline, sla_status = calculate_travel_aware_sla(now, checkin, lcd, "URGENT" if urgency == "critical" else "MEDIUM")

    ticket = Ticket(
        ticket_number=ticket_num,
        tboh_hash=tboh,
        agency_id=agency.id,
        requester_email=f"emergency.desk@{agency.code.lower()}.com",
        subject=f"[LIVE SIMULATION] Emergency Guest Walk at {agency.name} (Check-in in {hours_ahead}h)",
        description=f"Simulated live inbound disruption received from hotel duty desk. Traveler arrived but room blocked due to emergency maintenance. Immediate relocation required.",
        category="OVERBOOKING",
        priority="URGENT" if urgency == "critical" else "MEDIUM",
        status="NEW",
        check_in_date=checkin,
        last_cancellation_date=lcd,
        region=agency.region,
        sla_deadline=deadline,
        sla_status=sla_status,
        theme_tags=["overbooking-walk-relocation", "supplier-crs-outage"],
    )

    best_agent, score, reason = evaluate_ticket_routing(db, ticket, agency)
    if best_agent:
        ticket.assigned_agent_id = best_agent.id
        ticket.routing_score = score
        ticket.routing_reason = reason
        ticket.status = "OPEN"
        best_agent.active_ticket_count += 1

    db.add(ticket)
    db.flush()

    audit = AuditLog(
        ticket_id=ticket.id,
        actor_name="Live Simulator",
        actor_role="SYSTEM",
        action_type="CREATED",
        new_state=ticket.status,
        reason=f"Live inbound simulation triggered. {reason}",
    )
    db.add(audit)

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_email=ticket.requester_email,
        sender_role="REQUESTER",
        message_type="PUBLIC",
        body=ticket.description,
    )
    db.add(msg)

    db.commit()
    db.refresh(ticket)

    ticket_summary = {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "tboh_hash": ticket.tboh_hash,
        "agency_name": agency.name,
        "agency_tier": agency.tier,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "region": ticket.region,
        "check_in_date": ticket.check_in_date.isoformat(),
        "assigned_agent_name": best_agent.full_name if best_agent else "Unassigned",
        "routing_score": ticket.routing_score,
        "sla_status": ticket.sla_status,
        "sla_deadline": ticket.sla_deadline.isoformat(),
        "created_at": ticket.created_at.isoformat(),
    }

    # Broadcast real-time event to all connected Next.js frontends
    await event_broadcaster.broadcast("TICKET_CREATED", ticket_summary)

    return {
        "status": "success",
        "simulated_ticket": ticket_summary,
        "broadcasted": True,
    }
