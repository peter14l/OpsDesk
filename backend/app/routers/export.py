import csv
import io
import json
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.ticket import Ticket

router = APIRouter(prefix="/export", tags=["Data Export"])


@router.get("/tickets")
def export_tickets(
    format: str = Query("csv", pattern="^(csv|json)$"),
    status: str = Query(None),
    region: str = Query(None),
    priority: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Un-capped streaming export of B2B operational tickets in CSV or JSON format.
    Designed for enterprise reporting and BI pipeline ingestion.
    """
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status.upper())
    if region:
        query = query.filter(Ticket.region == region.upper())
    if priority:
        query = query.filter(Ticket.priority == priority.upper())

    tickets = query.order_by(desc(Ticket.created_at)).all()

    if format == "json":
        data = []
        for t in tickets:
            data.append({
                "ticket_number": t.ticket_number,
                "tboh_hash": t.tboh_hash,
                "agency_code": t.agency.code if t.agency else None,
                "agency_name": t.agency.name if t.agency else None,
                "agency_tier": t.agency.tier if t.agency else None,
                "requester_email": t.requester_email,
                "subject": t.subject,
                "description": t.description,
                "category": t.category,
                "priority": t.priority,
                "status": t.status,
                "region": t.region,
                "check_in_date": t.check_in_date.isoformat() if t.check_in_date else None,
                "last_cancellation_date": t.last_cancellation_date.isoformat() if t.last_cancellation_date else None,
                "assigned_agent": t.assigned_agent.full_name if t.assigned_agent else None,
                "routing_score": t.routing_score,
                "routing_reason": t.routing_reason,
                "sla_status": t.sla_status,
                "sla_deadline": t.sla_deadline.isoformat() if t.sla_deadline else None,
                "theme_tags": t.theme_tags,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            })
        json_str = json.dumps(data, indent=2)
        return Response(
            content=json_str,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=opsdesk_tickets_export.json"},
        )

    # CSV Format
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Ticket Number",
        "TBOH Booking Hash",
        "Agency Name",
        "Agency Tier",
        "Requester Email",
        "Subject",
        "Category",
        "Priority",
        "Status",
        "Region",
        "Check-In Date",
        "Last Cancellation Date (LCD)",
        "Assigned Agent",
        "Routing Score",
        "SLA Status",
        "SLA Deadline",
        "Theme Tags",
        "Created At",
    ])

    for t in tickets:
        writer.writerow([
            t.ticket_number,
            t.tboh_hash,
            t.agency.name if t.agency else "Unknown",
            t.agency.tier if t.agency else "STANDARD",
            t.requester_email,
            t.subject,
            t.category,
            t.priority,
            t.status,
            t.region,
            t.check_in_date.isoformat() if t.check_in_date else "",
            t.last_cancellation_date.isoformat() if t.last_cancellation_date else "",
            t.assigned_agent.full_name if t.assigned_agent else "Unassigned",
            t.routing_score,
            t.sla_status,
            t.sla_deadline.isoformat() if t.sla_deadline else "",
            ";".join(t.theme_tags),
            t.created_at.isoformat() if t.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=opsdesk_tickets_export.csv"},
    )
