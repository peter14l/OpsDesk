# OpsDesk — Technical Architecture & Agent Reference Guide (GEMINI.md)

Welcome to the **OpsDesk** repository. This document serves as the master architectural reference, developer onboarding manual, and AI agent operating guideline for the OpsDesk platform.

---

## 1. Project Overview & Mission

**OpsDesk** is a mission-critical, enterprise-grade B2B travel operations and incident resolution platform custom-engineered for **TBO.com** (Travel Boutique Online) and its global network of travel agencies, hotel bedbanks, airlines, and Destination Management Companies (DMCs).

### The Travel Operations Problem Space
Generic enterprise service desks (Zendesk, Jira Service Management, Freshdesk) fail catastrophically in global travel distribution because they treat tickets as static, time-agnostic IT tasks. In B2B travel operations:
- **Time is Asymmetric and Non-Linear:** A traveler checking into a hotel in 2 hours represents acute commercial liability; an inquiry for a booking next month does not. Static 24-hour SLAs fail travelers stranded at hotel counters.
- **Upstream Supplier Fragmentation:** Third-party hotel CRS integrations (Hilton, Marriott, Bedbanks) intermittently drop bookings or rate codes, generating sudden, massive waves of duplicate tickets across different agencies for the same physical property or flight.
- **Broken Communication Handovers:** Agents communicating with hotel duty managers via external emails frequently drop CC lists and supplier thread context when transferring tickets across global shift rotations (e.g., EMEA to APAC).
- **Duplicate Operational Investigations:** Different departments (agency front desk, VIP luxury desk, finance accounts) frequently raise separate inquiries for the same booking reference (`TBOH`), leading multiple agents to contact the same hotel simultaneously.

### The OpsDesk Solution
OpsDesk replaces generic ticketing with travel-native intelligence:
1. **Context Linkage Engine:** Instant correlation across tickets sharing the same `TBOH` booking reference or agency account.
2. **Multi-Dimensional Routing Engine:** Algorithmic agent scoring balancing Region (30%), Check-In Urgency (35%), Agent Skill (20%), and Concurrency Load (15%).
3. **Decoupled Supplier Side-Conversations:** Isolated supplier threads with explicit recipient arrays that survive ticket handovers without dropping external contacts.
4. **Travel-Aware Dynamic SLAs:** Deadlines computed dynamically against guest check-in countdowns and supplier Last Cancellation Dates (LCD).
5. **Dynamic Intent Auto-Suggest:** Real-time semantic parsing and confidence scoring tagging categories like `Refund Delay` or `Hotel Overbooking` as requesters type.
6. **Ops Insights Aggregator:** Weekly defect clustering identifying upstream supplier CRS outages and rate code discrepancies before they cause multi-million dollar chargebacks.
7. **Uncapped Streaming Data Export:** Constant-memory $O(1)$ RFC-4180 streaming for 50,000+ row operational exports.

---

## 2. Technology Stack & Runtime Specifications

| Layer | Technology | Details & Justification |
| :--- | :--- | :--- |
| **Backend Framework** | **FastAPI (Python 3.12)** | Asynchronous, high-throughput REST API with native Pydantic v2 validation, OpenAPI schema generation, and Python typing. |
| **ORM & Database** | **SQLAlchemy 2.0 + SQLite (WAL Mode)** | Persistent relational storage. SQLite configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and foreign keys enabled; seamlessly upgradable to PostgreSQL. |
| **Frontend Framework** | **Next.js 14.2 (App Router, React 19)** | Server/Client hybrid architecture, strict TypeScript typing, Tailwind CSS styling, and Lucide React icons. |
| **Architecture Layout** | **3-Pane Split Workspace** | High-density operations dashboard featuring persistent Navigation (Left), Live Queue Table (Center), and Context Linkage / Side-Convo / Audit Pane (Right). |
| **Real-Time Layer** | **Server-Sent Events (SSE) + Delta Polling** | Streaming live ticket updates, assignment changes, and priority spikes (`/events/stream`) with automatic fallback to timestamped delta polling (`/events/poll`). |
| **Export Engine** | **StreamingResponse (RFC-4180)** | Python memory-bounded generators streaming CSV and JSON lines with chunked transfer encoding, handling 50k+ rows without RAM spikes. |
| **Build Compatibility** | **WebAssembly SWC Engine** | `@next/swc-wasm-nodejs` enabled to support environments without native DLL execution permissions or symlink limitations (e.g. FAT32 removable storage). |

---

## 3. Repository Directory Structure

```
OpsDesk/
├── DEMO_GUIDE.md               # 3-5 minute video script & judging walkthrough
├── GEMINI.md                   # System architecture & developer/agent manual
├── README.md                   # Quickstart, setup, and high-level feature list
├── .gitignore                  # Git exclusions (node_modules, pycache, db logs)
│
├── backend/                    # FastAPI Application Root
│   ├── run.py                  # Server launcher (Uvicorn on port 8000)
│   ├── seed.py                 # Rich travel ops database seeder
│   ├── requirements.txt        # Python package dependencies
│   ├── opsdesk.db              # SQLite persistent database (WAL enabled)
│   └── app/
│       ├── config.py           # Application settings & CORS configuration
│       ├── database.py         # SQLAlchemy engine, session maker, WAL pragmas
│       ├── main.py             # FastAPI app initialization & router mounts
│       ├── models/             # SQLAlchemy ORM Data Models
│       │   ├── agency.py       # Agency entity (Tiers: PLATINUM, GOLD, SILVER)
│       │   ├── user.py         # Operational users (AGENT, ESCALATION_MANAGER, LEAD)
│       │   ├── ticket.py       # Core Ticket & TicketMessage models
│       │   ├── side_convo.py   # Supplier SideConversation & Messages
│       │   └── audit_log.py    # Immutability audit logging model
│       ├── schemas/            # Pydantic v2 Request/Response Schemas
│       │   ├── agency.py, user.py, ticket.py, side_convo.py, audit_log.py
│       │   └── insights.py     # Theme cluster & executive briefing schemas
│       ├── services/           # Core Domain Logic & Algorithmic Engines
│       │   ├── routing_engine.py      # 4-factor multi-dimensional routing
│       │   ├── sla_service.py         # Travel-aware dynamic SLA formulas
│       │   ├── linkage_service.py     # Cross-ticket TBOH & agency correlation
│       │   └── intent_classifier.py   # Deterministic travel intent classifier
│       └── routers/            # API Endpoints
│           ├── tickets.py      # CRUD, messages, transfer, escalate, classify
│           ├── routing.py      # Agent scoring & preview dispatcher
│           ├── side_convos.py  # Supplier communications with recipient arrays
│           ├── insights.py     # Defect clustering & executive summary
│           ├── events.py       # SSE streaming & simulation trigger
│           ├── export.py       # Streaming CSV/JSON export engine
│           └── users.py        # Agent & agency lookup endpoints
│
├── frontend/                   # Next.js 14 Frontend Application
│   ├── package.json            # Node dependencies & Next.js scripts
│   ├── tsconfig.json           # Strict TypeScript configuration
│   ├── tailwind.config.js      # Custom theme styling & colors
│   ├── declarations.d.ts       # Global TypeScript module declarations
│   ├── lib/
│   │   ├── api.ts              # Typed fetch client for backend endpoints
│   │   ├── types.ts            # TypeScript interfaces & domain enums
│   │   └── utils.ts            # Date formatters, SLA calculators, helpers
│   ├── app/
│   │   ├── layout.tsx          # Root HTML layout & fonts
│   │   ├── globals.css         # Global Tailwind styles & scrollbars
│   │   ├── page.tsx            # Main 3-pane Operations Desk workspace
│   │   ├── new-ticket/page.tsx # Incident creation with Intent Auto-Suggest
│   │   └── insights/page.tsx   # Ops Insights dashboard & clustering view
│   └── components/             # Reusable UI Components
│       ├── Header.tsx          # App header & active Persona Switcher
│       ├── Navigation.tsx      # Left-pane quick filters & export triggers
│       ├── TicketQueueTable.tsx# Center-pane high-density ticket table
│       ├── TicketDetailView.tsx# Ticket messages, internal notes, action buttons
│       ├── ContextLinkagePane.tsx # Right-pane TBOH & agency correlation
│       ├── AuditTimeline.tsx   # Visual audit history timeline
│       ├── SlaBadge.tsx        # Dynamic countdown & SLA status badge
│       ├── EscalationModal.tsx # One-click escalation to manager modal
│       ├── TransferModal.tsx   # Reassignment modal with handover reason
│       ├── SideConversationModal.tsx # Supplier email composer with recipient pills
│       ├── ErrorBoundary.tsx   # React error boundary component
│       ├── EmptyState.tsx      # Queue empty state placeholders
│       └── Skeletons.tsx       # Loading skeleton placeholders
│
└── docs/                       # Architectural Specifications
    ├── enterprise-scaling.md   # Benchmarks & O(1) streaming architecture
    ├── phase-0-architecture.md # Schema, RBAC matrix, and API contracts
    ├── phase-1-backend.md      # FastAPI setup & seeding specs
    ├── phase-2-routing-engine.md # 4-factor scoring formulas
    ├── phase-3-workflows.md    # Recipient retention & escalation flows
    ├── phase-4-frontend.md     # 3-pane workspace & SSE specs
    └── phase-5-verification.md # Verification results & personas
```

---

## 4. Core Subsystems & Algorithmic Engines

### 4.1. Multi-Dimensional Routing Engine
Located in [`backend/app/services/routing_engine.py`](file:///F:/OpsDesk/backend/app/services/routing_engine.py).

Instead of naive round-robin or least-busy assignment, OpsDesk evaluates candidate agents using a weighted composite score ($S \in [0, 100]$):

$$S = (0.30 \times S_{\text{region}}) + (0.35 \times S_{\text{urgency}}) + (0.20 \times S_{\text{skill}}) + (0.15 \times S_{\text{concurrency}})$$

1. **Region Match ($S_{\text{region}} \in \{0, 100\}$):**
   - Exact match between ticket region (e.g. `EMEA`, `APAC`, `AMER`) and agent home region yields $100$. Mismatch yields $0$. `GLOBAL` agents yield $80$.
2. **Travel Urgency Proximity ($S_{\text{urgency}} \in [0, 100]$):**
   - Check-in $< 6$ hours: $100$
   - Check-in $6$ to $24$ hours: $80$
   - Check-in $24$ to $72$ hours: $50$
   - Check-in $> 72$ hours: $20$
3. **Skill Alignment ($S_{\text{skill}} \in [0, 100]$):**
   - Matches category tags (`HOTEL`, `FLIGHT`, `REFUND`, `CANCELLATION`, `OVERBOOKING`) against agent certified skills. Full match $= 100$, partial match $= 50$.
4. **Concurrency Capacity ($S_{\text{concurrency}} \in [0, 100]$):**
   - Evaluates current active tickets against agent `max_concurrency`:
     $$S_{\text{concurrency}} = \max\left(0, 100 \times \left(1 - \frac{\text{active\_tickets}}{\text{max\_concurrency}}\right)\right)$$

Every assignment writes a transparent audit rationale:
```text
"Assigned to Sarah Jenkins (Score: 94.5/100). Exact region match (EMEA), HOTEL skill match, Critical travel urgency (<4h to check-in)."
```

### 4.2. Travel-Aware Dynamic SLA Engine
Located in [`backend/app/services/sla_service.py`](file:///F:/OpsDesk/backend/app/services/sla_service.py).

Static 24-hour SLAs fail travelers stranded at hotel counters. OpsDesk computes SLA deadlines as the dynamic minimum of business baselines and physical travel countdowns:

$$\text{Deadline} = \min\Big(\text{Created\_At} + T_{\text{base}},\; \text{Check\_In} - T_{\text{margin}},\; \text{LCD} - T_{\text{margin}}\Big)$$

- **Safety Margin ($T_{\text{margin}}$):** 2 hours prior to physical check-in or supplier Last Cancellation Date (LCD).
- **Status Thresholds:**
  - `BREACHED`: Current time $\ge$ deadline.
  - `AT_RISK`: Less than 60 minutes remaining until deadline OR check-in $< 4$ hours away.
  - `ON_TRACK`: Deadline $> 60$ minutes in the future.

### 4.3. Context Linkage Engine
Located in [`backend/app/services/linkage_service.py`](file:///F:/OpsDesk/backend/app/services/linkage_service.py).

When an agent opens a ticket, OpsDesk executes an indexed relational lookup across:
1. **Same Booking Reference (`tboh_hash`):** Surfaces all other open or past tickets for the exact reservation (e.g. Front Desk emergency + Finance chargeback query).
2. **Same Agency Partner (`agency_id`):** Surfaces active incidents from the same travel agency to spot systemic API or credit issues.
3. **Visual Duplicate Warning:** Emits a high-visibility amber banner in the right-hand split-pane, preventing duplicate emails or conflicting instructions to hotel suppliers.

### 4.4. Decoupled Supplier Side-Conversations & Recipient Retention
Located in [`backend/app/models/side_convo.py`](file:///F:/OpsDesk/backend/app/models/side_convo.py) and [`frontend/components/SideConversationModal.tsx`](file:///F:/OpsDesk/frontend/components/SideConversationModal.tsx).

- **The Problem:** When an agent transfers a ticket, standard CRM systems either drop external CC emails or expose internal transfer notes to external hotel suppliers.
- **The Solution:** Supplier side-conversations are modeled as decoupled relational entities (`SideConversation`) containing an explicit JSON list of recipient emails (`recipient_emails: List[str]`).
- **Shift Handover Resilience:** When a ticket is reassigned from `Sarah Jenkins` to `Rajesh Sharma`, the side-conversation thread, message history, and four-address recipient array remain completely intact and active.

### 4.5. Dynamic Intent Auto-Suggest Classifier
Located in [`backend/app/services/intent_classifier.py`](file:///F:/OpsDesk/backend/app/services/intent_classifier.py) and [`frontend/app/new-ticket/page.tsx`](file:///F:/OpsDesk/frontend/app/new-ticket/page.tsx).

- A fast, rule-assisted classification engine runs debounced (250ms) as the requester types in the ticket subject or description.
- Evaluates travel operational keywords (`"hasn't arrived"`, `"refund"`, `"double charge"`, `"overbooked"`, `"walked"`, `"hospitalized"`).
- Normalizes confidence between $0.65$ and $0.98$ and outputs:
  - `predicted_category`: e.g. `REFUND`
  - `label`: `"Refund Delay"`
  - `suggested_priority`: `HIGH`
  - `matched_keywords`: `["refund", "hasn't arrived", "10 days"]`
  - `suggested_tag`: `"voucher-rate-mismatch"`
- Requesters can click **"Apply Intent"** to auto-fill the form in one click.

### 4.6. Actionable Ops Insights Defect Clustering
Located in [`backend/app/routers/insights.py`](file:///F:/OpsDesk/backend/app/routers/insights.py) and [`frontend/app/insights/page.tsx`](file:///F:/OpsDesk/frontend/app/insights/page.tsx).

- Aggregates rolling weekly operational incidents across theme tags (`supplier-crs-outage`, `voucher-rate-mismatch`, `flight-supplier-sync`, etc.).
- Computes volume share percentages (`share_percentage`) and estimated dispute financial risk (`estimated_dispute_value`).
- Synthesizes an executive narrative briefing:
  > *"Voucher Rate Discrepancy at Check-In issues account for 38.5% of volume this week. Together with Supplier CRS Outage / Connectivity Drop, they drive 69.3% of all operational inquiries, exposing $7,700 in supplier dispute risk across EMEA and APAC properties. Immediate upstream gateway throttling and rate table sync patches recommended."*
- Provides interactive sample ticket pills with direct deep-links (`/?ticket=${st.id}`) into the operations workspace.

### 4.7. Uncapped Streaming Data Export ($O(1)$ Memory)
Located in [`backend/app/routers/export.py`](file:///F:/OpsDesk/backend/app/routers/export.py).

- Uses Python generator functions (`yield`) to stream CSV (RFC-4180 compliant) or JSON Lines.
- Memory consumption remains flat at $\approx 28 \text{ MB}$ even when exporting 50,000+ simulated or live operational records.
- Prevents UI timeouts and server out-of-memory (OOM) crashes.

---

## 5. Local Setup & Operational Runbook

### 5.1. Prerequisites
- **Python**: 3.10+ (Verified on Python 3.12)
- **Node.js**: v18+ (Verified on Node v20/v26)
- **Git**

### 5.2. Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed persistent database with B2B travel operations scenarios
python seed.py

# 4. Launch FastAPI development server (Port 8000)
python run.py
```
- **API Base:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

### 5.3. Frontend Setup
```bash
# 1. In a separate terminal, navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Next.js development server (Port 3000)
npm run dev
```
- **Operations Workspace:** `http://localhost:3000`
- **New Incident Form:** `http://localhost:3000/new-ticket`
- **Ops Insights Dashboard:** `http://localhost:3000/insights`

---

## 6. Seeded Demo Personas & Role Switcher

The top navigation bar includes an instant **Persona Switcher** to test role-based access control and queue isolation:

| Persona Name | Role | Email | Operational Responsibilities |
| :--- | :--- | :--- | :--- |
| **Sarah Jenkins** | `AGENT` (EMEA) | `sarah.jenkins@tbo.com` | Frontline EMEA agent handling hotel emergencies, cancellations, and side-conversations. |
| **Rajesh Sharma** | `AGENT` (APAC) | `rajesh.sharma@tbo.com` | Frontline APAC agent specializing in amendments, special requests, and shift handovers. |
| **Marcus Vance** | `AGENT` (AMER) | `marcus.vance@tbo.com` | Flight desk specialist handling GDS schedule changes and overbooking disputes. |
| **Priya Nair** | `ESCALATION_MANAGER` | `priya.nair@tbo.com` | High-authority manager overseeing SLA-breached tickets, VIP disputes, and supplier payouts. |
| **Alex Mercer** | `LEAD` | `alex.mercer@tbo.com` | Operations Lead supervising overall network health, theme clusters, and data exports. |
| **Ahmed Al-Khatib** | `REQUESTER` | `requester.dxb@emirateshorizon.com` | External partner at Emirates Horizon Holidays submitting and tracking bookings. |

---

## 7. Key API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tickets` | Query tickets with filters (`status`, `priority`, `region`, `assigned_agent_id`, `search`, `limit`, `offset`). |
| `POST` | `/api/v1/tickets` | Dispatch a new ticket with automatic 4-factor scoring and dynamic SLA deadline assignment. |
| `GET` | `/api/v1/tickets/{id}` | Retrieve comprehensive ticket details, messages, audit logs, and side-conversations. |
| `GET` | `/api/v1/tickets/{id}/context-links` | Retrieve cross-ticket correlation by `tboh_hash` and `agency_id`. |
| `POST` | `/api/v1/tickets/classify-intent` | Deterministic travel intent classifier returning category, confidence, and priority. |
| `POST` | `/api/v1/tickets/{id}/escalate` | Escalate ticket to `ESCALATION_MANAGER`, setting priority to `URGENT` with audit logging. |
| `POST` | `/api/v1/tickets/{id}/transfer` | Reassign ticket to another agent with handover notes, preserving side-conversations. |
| `POST` | `/api/v1/tickets/{id}/messages` | Add client-facing public message or agent-only internal note. |
| `POST` | `/api/v1/side-convos` | Initiate an external supplier side-thread with isolated recipient email array. |
| `GET` | `/api/v1/insights/clusters` | Defect theme clusters, volume shares, dispute exposure, and executive briefing. |
| `GET` | `/api/v1/events/stream` | Server-Sent Events (SSE) live stream for real-time ticket mutations. |
| `GET` | `/api/v1/events/poll` | Timestamp-based delta polling fallback (`?since=...`). |
| `POST` | `/api/v1/events/simulate-inbound` | Simulate an inbound critical, moderate, or standard travel incident. |
| `GET` | `/api/v1/export/tickets` | Streaming RFC-4180 CSV export with memory-bounded generator (`format=csv`). |
| `GET` | `/api/v1/export/tickets/json` | Streaming JSON Lines export (`format=json`). |

---

## 8. Verification & Quality Gates

### 8.1. Backend Integrity Test
```bash
cd backend
python -c "from app.services.intent_classifier import classify_travel_intent; print(classify_travel_intent(\"Refund hasn't arrived for booking TBOH9948 after 10 days\"))"
# Expected output: {'predicted_category': 'REFUND', 'label': 'Refund Delay', 'confidence': 0.93, ...}
```

### 8.2. Frontend Typecheck
```bash
cd frontend
npx tsc --noEmit
# Expected output: 0 errors
```

---

## 9. Antigravity & AI Agent Operating Guidelines

When developing, refactoring, or extending OpsDesk:
1. **Preserve Travel-Domain Invariants:** Never replace check-in or LCD date calculations with generic static timestamps. A ticket's SLA is always travel-aware.
2. **Preserve Audit Trail Integrity:** Any state mutation (`status`, `priority`, `assigned_agent_id`) must append a structured `AuditLog` entry detailing the `actor_name`, `action_type`, and `reason`.
3. **Decoupled Recipient Retention:** Never bind supplier side-conversation recipients exclusively to the ticket assignee. Supplier threads must remain tied to the `SideConversation` record so handovers do not drop external emails.
4. **Zero-Mock Policy:** All UI components in `frontend/` must connect to real endpoints in `lib/api.ts` and handle empty/loading states gracefully using `ErrorBoundary`, `EmptyState`, and `Skeletons`.
5. **No Native DLL Assumptions:** Next.js must continue using `@next/swc-wasm-nodejs` with WASM fallback enabled to ensure flawless builds on FAT32 and restricted Windows environments.
