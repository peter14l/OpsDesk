# OpsDesk - Phase 1: Backend Core, Database Setup & Robust Seed Data

## 1. Objective
Establish the production-ready FastAPI backend foundation, relational database models using SQLAlchemy with SQLite persistent storage, clean separation of concerns (models, schemas, database session management, routers), and a realistic B2B travel operations seed dataset (`seed.py`).

---

## 2. Directory & Package Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization, CORS, global error handlers
│   ├── config.py            # App settings (DB URI, CORS origins, API prefix)
│   ├── database.py          # SQLAlchemy engine, session maker, base model
│   ├── models/              # SQLAlchemy relational models
│   │   ├── __init__.py
│   │   ├── agency.py
│   │   ├── user.py
│   │   ├── ticket.py
│   │   ├── side_convo.py
│   │   └── audit_log.py
│   ├── schemas/             # Pydantic v2 validation & response schemas
│   │   ├── __init__.py
│   │   ├── agency.py
│   │   ├── user.py
│   │   ├── ticket.py
│   │   ├── side_convo.py
│   │   └── audit_log.py
│   ├── routers/             # API route controllers
│   │   ├── __init__.py
│   │   ├── tickets.py
│   │   ├── side_convos.py
│   │   ├── routing.py
│   │   ├── insights.py
│   │   ├── export.py
│   │   └── users.py
│   └── services/            # Business logic
│       ├── __init__.py
│       ├── routing_engine.py
│       ├── sla_service.py
│       └── linkage_service.py
├── seed.py                  # Rich B2B travel operations seed data generator
├── requirements.txt         # Pinned backend dependencies
└── run.py                   # Uvicorn entrypoint script
```

---

## 3. Database Engine & Migration Strategy
- **Engine**: SQLite with foreign keys explicitly enabled via SQLAlchemy event listeners (`PRAGMA foreign_keys=ON;`).
- **File Location**: `./opsdesk.db` in persistent storage.
- **Initialization**: Tables generated deterministically via `Base.metadata.create_all(bind=engine)` upon application startup or seed execution.
- **Extensibility**: Schema types map 1:1 to PostgreSQL if swapped via `DATABASE_URL` environment variable.

---

## 4. Realistic B2B Travel Operations Seed Strategy (`seed.py`)
To replicate real-world TBO operations, the seed script provisions:

### 4.1 Agencies
1. **Emirates Horizon Holidays** (`AGY-DXB-902`): Platinum tier, EMEA / Dubai, VIP high-volume agency.
2. **Bharat Gateway Travels** (`AGY-BOM-441`): Gold tier, APAC / Mumbai, handles large wedding groups and pilgrimage packages.
3. **Nordic Explorer Desk** (`AGY-OSL-112`): Silver tier, EMEA / Oslo, boutique ski and northern lights bookings.
4. **Silverline Corporate Travel** (`AGY-LHR-305`): Gold tier, EMEA / London, corporate business travel desk.

### 4.2 Personas / Users
- **Agent EMEA**: Sarah Jenkins (`sarah.jenkins@tbo.com`, Agent, EMEA, Hotel/Refund specialist)
- **Agent APAC**: Rajesh Sharma (`rajesh.sharma@tbo.com`, Agent, APAC, Hotel/Amendment specialist)
- **Agent AMER**: Marcus Vance (`marcus.vance@tbo.com`, Agent, AMER, Flight/Overbooking specialist)
- **Escalation Manager**: Priya Nair (`priya.nair@tbo.com`, Escalation Manager, Global)
- **Operations Lead**: Alex Mercer (`alex.mercer@tbo.com`, Lead, Global)
- **Agency Requesters**: Requesters from Emirates Horizon and Bharat Gateway.

### 4.3 Ticket Scenarios (12+ Tickets)
1. **Booking Cluster 1 (`TBOH-7849102-M`)**:
   - Ticket A: "Urgent: Guest stranded at Hilton Dubai Al Habtoor, booking not found in hotel CRS" (Check-in TODAY - Urgent SLA Breached/At-Risk).
   - Ticket B: "Refund request for TBOH-7849102-M duplicate voucher" from finance desk at same agency.
   - Demonstrates instant context linkage across multiple contacts for the identical hotel booking hash.
2. **Booking Cluster 2 (`TBOH-9923810-K`)**:
   - Ticket C: "Marriott Mumbai - Breakfast inclusion missing on voucher" (Check-in in 14 hours - Urgent SLA).
   - Ticket D: "Same reservation: Request late checkout confirmation from supplier".
3. **Transferred Ticket with Active Supplier Thread (`TBOH-3301928-E`)**:
   - "Atlantis The Palm - Deluxe Suite Renovation Relocation Dispute".
   - Shows a ticket transferred from Sarah to Rajesh, where the supplier side-conversation with `reservations@atlantisthepalm.com` retains its full recipient distribution (`["reservations@atlantisthepalm.com", "duty.manager@atlantisthepalm.com", "ops-dubai@tbo.com"]`).
4. **SLA At-Risk / Breached Tickets**:
   - Tickets with check-in in <6 hours or past Last Cancellation Date (LCD) triggering dynamic SLA alert badges.
5. **Insights Theme Tags**:
   - Tickets tagged with `["supplier-crs-outage", "voucher-rate-mismatch", "breakfast-inclusion-dispute", "non-refundable-waiver-request", "overbooking-walk-relocation"]`.

---

## 5. Verification Checklist
- [x] Pydantic models validate ISO-8601 timestamps and enum bounds.
- [x] Seed script executes cleanly, reporting generated record counts.
- [x] Relationships (Agency -> Tickets, Ticket -> Side-Convos, Ticket -> Audit Logs) navigate bidirectionally with zero circular reference errors.
