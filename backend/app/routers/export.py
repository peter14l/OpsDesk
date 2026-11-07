import csv
import io
import json
import random
from datetime import datetime, timedelta
from typing import AsyncGenerator, Generator, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.ticket import Ticket
from app.models.agency import Agency

router = APIRouter(prefix="/export", tags=["Data Export"])


def generate_synthetic_travel_row(index: int, base_time: datetime) -> list:
    """Generates synthetic realistic B2B travel operations rows for high-volume benchmark testing."""
    categories = ["OVERBOOKING", "REFUND", "CANCELLATION", "AMENDMENT", "VOUCHER_ISSUE", "SPECIAL_REQUEST"]
    priorities = ["URGENT", "HIGH", "MEDIUM", "LOW"]
    statuses = ["OPEN", "PENDING_SUPPLIER", "ESCALATED", "RESOLVED", "CLOSED"]
    agencies = ["Emirates Horizon Holidays", "Bharat Gateway Travels", "Nordic Explorer Desk", "Silverline Corporate Travel UK"]
    regions = ["EMEA", "APAC", "AMER"]
    hotels = ["Hilton Dubai Al Habtoor", "Atlantis The Palm", "JW Marriott Mumbai", "Radisson Blu Tromso", "The Langham London"]

    tboh = f"TBOH-{8492000 + (index % 1500)}-{'M' if index % 2 == 0 else 'K'}"
    checkin = base_time + timedelta(hours=(index % 120) - 24)
    lcd = checkin - timedelta(days=2)
    created = base_time - timedelta(minutes=(index * 3) % 20000)

    category = categories[index % len(categories)]
    priority = priorities[index % len(priorities)]
    status = statuses[index % len(statuses)]
    agency = agencies[index % len(agencies)]
    region = regions[index % len(regions)]
    hotel = hotels[index % len(hotels)]

    return [
        f"TBO-EXP-{100000 + index}",
        tboh,
        agency,
        "PLATINUM" if index % 3 == 0 else "GOLD",
        f"agent.{index % 80}@agency.com",
        f"{hotel}: Operational issue with guest check-in / booking {tboh}",
        category,
        priority,
        status,
        region,
        checkin.strftime("%Y-%m-%d %H:%M:%S"),
        lcd.strftime("%Y-%m-%d %H:%M:%S"),
        f"Agent {(index % 12) + 1}",
        round(70.0 + (index % 30), 1),
        "BREACHED" if index % 7 == 0 else ("AT_RISK" if index % 4 == 0 else "ON_TRACK"),
        (created + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S"),
        f"supplier-crs-outage;voucher-rate-mismatch",
        created.strftime("%Y-%m-%d %H:%M:%S"),
    ]


@router.get("/tickets")
def export_tickets(
    format: str = Query("csv", pattern="^(csv|json)$"),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50000, ge=1, le=100000),
    simulate_volume: Optional[int] = Query(None, ge=1, le=100000),
    db: Session = Depends(get_db),
):
    """
    High-volume chunked generator streaming export for B2B travel operations data.
    Streams 50,000+ rows with constant O(1) memory footprint.
    Supports CSV and JSON streaming formats for enterprise data lakes and BI pipelines.
    """
    now = datetime.utcnow()

    # High-volume synthetic benchmark stream
    if simulate_volume:
        total_rows = simulate_volume

        if format == "csv":
            def stream_synthetic_csv() -> Generator[str, None, None]:
                buffer = io.StringIO()
                writer = csv.writer(buffer)
                writer.writerow([
                    "Ticket Number", "TBOH Booking Hash", "Agency Name", "Agency Tier",
                    "Requester Email", "Subject", "Category", "Priority", "Status",
                    "Region", "Check-In Date", "Last Cancellation Date (LCD)",
                    "Assigned Agent", "Routing Score", "SLA Status", "SLA Deadline",
                    "Theme Tags", "Created At",
                ])
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

                batch_size = 500
                for i in range(total_rows):
                    row = generate_synthetic_travel_row(i, now)
                    writer.writerow(row)
                    if (i + 1) % batch_size == 0 or i == total_rows - 1:
                        yield buffer.getvalue()
                        buffer.seek(0)
                        buffer.truncate(0)

            return StreamingResponse(
                stream_synthetic_csv(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=opsdesk_export_{total_rows}_records.csv",
                    "X-Total-Rows": str(total_rows),
                    "X-Stream-Mode": "Chunked-Generator-O1",
                },
            )

        else:  # JSON stream
            def stream_synthetic_json() -> Generator[str, None, None]:
                yield "[\n"
                headers = [
                    "ticket_number", "tboh_hash", "agency_name", "agency_tier",
                    "requester_email", "subject", "category", "priority", "status",
                    "region", "check_in_date", "last_cancellation_date",
                    "assigned_agent", "routing_score", "sla_status", "sla_deadline",
                    "theme_tags", "created_at",
                ]
                for i in range(total_rows):
                    row_vals = generate_synthetic_travel_row(i, now)
                    record = dict(zip(headers, row_vals))
                    chunk = json.dumps(record)
                    if i < total_rows - 1:
                        yield f"  {chunk},\n"
                    else:
                        yield f"  {chunk}\n"
                yield "]\n"

            return StreamingResponse(
                stream_synthetic_json(),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=opsdesk_export_{total_rows}_records.json",
                    "X-Total-Rows": str(total_rows),
                    "X-Stream-Mode": "Chunked-Generator-O1",
                },
            )

    # Standard Database Stream using SQLAlchemy .yield_per() for O(1) memory
    query = db.query(Ticket)
    if status and status != "ALL":
        query = query.filter(Ticket.status == status.upper())
    if region and region != "ALL":
        query = query.filter(Ticket.region == region.upper())
    if priority and priority != "ALL":
        query = query.filter(Ticket.priority == priority.upper())

    query = query.order_by(desc(Ticket.created_at)).limit(limit)

    if format == "csv":
        def stream_db_csv() -> Generator[str, None, None]:
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow([
                "Ticket Number", "TBOH Booking Hash", "Agency Name", "Agency Tier",
                "Requester Email", "Subject", "Category", "Priority", "Status",
                "Region", "Check-In Date", "Last Cancellation Date (LCD)",
                "Assigned Agent", "Routing Score", "SLA Status", "SLA Deadline",
                "Theme Tags", "Created At",
            ])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

            # yield_per(500) executes chunked fetch from SQLite/PostgreSQL cursor
            for idx, t in enumerate(query.yield_per(500)):
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
                if (idx + 1) % 50 == 0:
                    yield buffer.getvalue()
                    buffer.seek(0)
                    buffer.truncate(0)

            if buffer.tell() > 0:
                yield buffer.getvalue()

        return StreamingResponse(
            stream_db_csv(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=opsdesk_tickets_export.csv"},
        )

    else:  # JSON format
        def stream_db_json() -> Generator[str, None, None]:
            yield "[\n"
            first = True
            for t in query.yield_per(500):
                record = {
                    "ticket_number": t.ticket_number,
                    "tboh_hash": t.tboh_hash,
                    "agency_name": t.agency.name if t.agency else None,
                    "agency_tier": t.agency.tier if t.agency else None,
                    "requester_email": t.requester_email,
                    "subject": t.subject,
                    "category": t.category,
                    "priority": t.priority,
                    "status": t.status,
                    "region": t.region,
                    "check_in_date": t.check_in_date.isoformat() if t.check_in_date else None,
                    "last_cancellation_date": t.last_cancellation_date.isoformat() if t.last_cancellation_date else None,
                    "assigned_agent": t.assigned_agent.full_name if t.assigned_agent else None,
                    "routing_score": t.routing_score,
                    "sla_status": t.sla_status,
                    "sla_deadline": t.sla_deadline.isoformat() if t.sla_deadline else None,
                    "theme_tags": t.theme_tags,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                }
                serialized = json.dumps(record)
                if not first:
                    yield f",\n  {serialized}"
                else:
                    yield f"  {serialized}"
                    first = False
            yield "\n]\n"

        return StreamingResponse(
            stream_db_json(),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=opsdesk_tickets_export.json"},
        )
