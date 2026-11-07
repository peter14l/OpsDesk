# OpsDesk - Next-Gen B2B Travel Operations Platform for TBO.com

OpsDesk is an enterprise-grade, high-velocity operational ticketing platform architected specifically for global B2B travel distribution aggregators like TBO.com. 

Generic IT ticketing systems fail in travel operations because hotel check-in deadlines, flight departures, and hotel bedbank CRS outages operate under severe time constraints. OpsDesk solves these challenges with:
- **Real-Time Context Linkage**: Correlates identical hotel/flight booking hashes (`TBOH`) and agency accounts to eradicate duplicate investigations.
- **Multi-Dimensional Routing Engine**: Scores agents dynamically across region, check-in urgency, agent skills, and concurrency load.
- **Supplier Side-Conversations with Recipient Retention**: Isolated supplier threads where explicit recipient lists survive ticket handovers and reassignments without breaking.
- **Dynamic Travel-Aware SLAs**: SLA timers driven by traveler check-in countdowns and supplier Last Cancellation Dates (LCD).
- **First-Class Escalation Matrix**: One-click escalation to Escalation Managers with visual audit timeline logging.
- **Ops Insights Clustering Engine**: Weekly thematic grouping of supplier outages and defect tags to inform commercial and engineering interventions.
- **Uncapped Enterprise Export**: RFC-4180 streaming CSV and JSON exports for BI pipelines.

---

## Architecture & Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons** | Dense 3-pane responsive workspace, instant role switcher, live dynamic SLA countdown tickers, contextual split-pane. |
| **Backend** | **FastAPI (Python 3.12), Pydantic v2, SQLAlchemy ORM** | Multi-dimensional routing engine, dynamic SLA calculations, context correlation algorithms, RFC-4180 streaming exports. |
| **Database** | **SQLite (with WAL mode & foreign keys enabled) / PostgreSQL-ready** | Persistent relational storage, indexed search keys, serialized recipient JSON arrays. |

---

## Quickstart & Run Instructions

### 1. Prerequisites
- **Python**: 3.10+ (Verified on Python 3.12)
- **Node.js**: v18+ (Verified on Node v20/v26)
- **npm**: 9+

### 2. Backend Setup & Seeding

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run rich B2B travel database seed script
python seed.py

# Launch FastAPI backend server (Runs on http://localhost:8000)
python run.py
```
* Interactive API Documentation (Swagger / OpenAPI): **http://localhost:8000/docs**
* API Health Check: **http://localhost:8000/health**

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server (Runs on http://localhost:3000)
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## Demo Personas & Role Switcher

OpsDesk includes an interactive Role Switcher in the top navigation bar. Switch between personas seamlessly to experience how different roles interact with the platform:

| Role | Name | Email | Purpose & Permissions |
| :--- | :--- | :--- | :--- |
| **Desk Agent (EMEA)** | Sarah Jenkins | `sarah.jenkins@tbo.com` | Frontline EMEA agent handling hotel bookings, check-in emergencies, and cancellations. |
| **Desk Agent (APAC)** | Rajesh Sharma | `rajesh.sharma@tbo.com` | Frontline APAC agent handling special requests, amendments, and group travel. |
| **Escalation Manager** | Priya Nair | `priya.nair@tbo.com` | High-authority manager overseeing SLA-breached cases, VIP Platinum agency disputes, and supplier overrides. |
| **Operations Lead** | Alex Mercer | `alex.mercer@tbo.com` | Executive lead monitoring Ops Insights clusters, supplier degradation rates, and data exports. |
| **B2B Agency Rep** | Ahmed Al-Khatib | `requester.dxb@emirateshorizon.com` | Agency requester from Emirates Horizon Holidays submitting and tracking bookings. |

---

## Feature Checklist: Mapping to TBO Operations Problems 1–6

| TBO Problem | Problem Description | OpsDesk Solution & Implementation | Code References |
| :---: | :--- | :--- | :--- |
| **1** | **Duplicate Investigations on Same Booking** | **Context Linkage Engine**: Instant correlation across tickets sharing the same `TBOH` hash or Agency ID. Surfaces duplicate alerts in the side-pane before agents start contacting suppliers. | [`backend/app/services/linkage_service.py`](file:///F:/OpsDesk/backend/app/services/linkage_service.py)<br>[`frontend/components/ContextLinkagePane.tsx`](file:///F:/OpsDesk/frontend/components/ContextLinkagePane.tsx) |
| **2** | **Static SLAs Failing Travel Deadlines** | **Travel-Aware Dynamic SLA**: Deadlines dynamically calculated based on `MIN(Created_At + Base, Check_In - Margin, LCD - Margin)`. Imminent check-ins (<6h) trigger immediate `AT_RISK` and `BREACHED` alerts. | [`backend/app/services/sla_service.py`](file:///F:/OpsDesk/backend/app/services/sla_service.py)<br>[`frontend/components/SlaBadge.tsx`](file:///F:/OpsDesk/frontend/components/SlaBadge.tsx) |
| **3** | **Supplier Side-Convos Breaking on Transfer** | **Decoupled Recipient Retention**: External supplier threads bind recipient arrays directly to the thread object. Shift handovers or ticket transfers preserve the complete recipient distribution. | [`backend/app/models/side_convo.py`](file:///F:/OpsDesk/backend/app/models/side_convo.py)<br>[`frontend/components/SideConversationModal.tsx`](file:///F:/OpsDesk/frontend/components/SideConversationModal.tsx) |
| **4** | **Inefficient / Arbitrary Ticket Assignment** | **Multi-Dimensional Routing Engine**: 4-factor scoring algorithm evaluating Region Match (30%), Urgency Proximity (35%), Skill Match (20%), and Agent Concurrency Load (15%) with audit reasons. | [`backend/app/services/routing_engine.py`](file:///F:/OpsDesk/backend/app/services/routing_engine.py)<br>[`backend/app/routers/routing.py`](file:///F:/OpsDesk/backend/app/routers/routing.py) |
| **5** | **Lack of Escalation Visibility & Accountability** | **First-Class Escalation Matrix**: One-click escalation to Escalation Managers, state mutation to `ESCALATED`, priority boost to `URGENT`, and full visual audit logging. | [`backend/app/routers/tickets.py`](file:///F:/OpsDesk/backend/app/routers/tickets.py)<br>[`frontend/components/EscalationModal.tsx`](file:///F:/OpsDesk/frontend/components/EscalationModal.tsx) |
| **6** | **Chronic Supplier Degradation Hidden in Silos** | **Ops Insights Theme Clusters**: Weekly tagging aggregates defect patterns (`supplier-crs-outage`, `voucher-rate-mismatch`) with actionable commercial recommendations and deep links. | [`backend/app/routers/insights.py`](file:///F:/OpsDesk/backend/app/routers/insights.py)<br>[`frontend/app/insights/page.tsx`](file:///F:/OpsDesk/frontend/app/insights/page.tsx) |

---

## 3 to 5-Minute Hackathon Demo Script

Follow this script to demonstrate all key workflows during judging:

### Journey A: Real-Time Context Linkage (Eradicating Duplicate Work)
1. Open the OpsDesk Workspace (`http://localhost:3000`).
2. In the triage queue, click ticket `TBO-2026-1002` (*"Pre-authorization billing discrepancy on TBOH-7849102-M"*).
3. Direct judges' attention to the right-hand **Context Linkage Engine** pane.
4. Show the alert banner: **"Duplicate Investigation Alert! Another ticket exists for booking TBOH-7849102-M"**.
5. Click on `TBO-2026-1001` in the linked tickets list to jump directly to the primary stranded-guest emergency, proving how OpsDesk eliminates redundant supplier outreach.

### Journey B: Multi-Dimensional Routing Engine
1. Click **"New Ticket"** in the top navigation bar.
2. Select **Emirates Horizon Holidays** (Platinum tier), enter Booking Hash `TBOH-7849102-M`, category `OVERBOOKING`, and set check-in to 4 hours from now.
3. Click **"Dispatch Ticket"**.
4. Observe the instant routing result: OpsDesk scores candidate agents and assigns the ticket to EMEA specialist Sarah Jenkins with full rationale:
   *"Assigned to Sarah Jenkins (Score: 94.5/100). Exact region match (EMEA), HOTEL skill match, Critical travel urgency (<4h to check-in)."*

### Journey C: Supplier Side-Conversations & Recipient Retention
1. Open ticket `TBO-2026-1003` (*"Atlantis The Palm - Royal Suite Renovation Relocation Dispute"*).
2. Click the **"Supplier Side-Conversations"** tab.
3. View the active thread with Atlantis The Palm duty desk. Highlight the preserved recipient array:
   `['duty.manager@atlantisdubai.com', 'reservations@atlantisdubai.com', 'tbo-contracts-dubai@tbo.com', 'vip-desk@tbo.com']`.
4. Click **"Transfer"** in the top action toolbar and reassign the ticket to Rajesh Sharma.
5. Confirm the transfer: the audit log registers the handover while all supplier messages and explicit recipient emails remain intact.

### Journey D: First-Class One-Click Escalation
1. Select an urgent ticket with imminent check-in (e.g. `TBO-2026-1001`).
2. Click the red **"Escalate to Manager"** button.
3. Select trigger: *"Supplier CRS unresponsive / Check-in deadline imminent (<2h)"* and click **"Confirm Escalation"**.
4. Show that the ticket status immediately mutates to `ESCALATED`, priority becomes `URGENT`, and assignee switches to Escalation Manager Priya Nair.
5. In the top role switcher, switch to **Priya Nair (Escalation Manager)** and filter queue by **"Escalated Manager Queue"** to demonstrate manager queue prioritization.

### Journey E: Ops Insights Clustering Engine & Data Export
1. Click **"Ops Insights & Clusters"** in the top navigation bar.
2. Walk judges through the theme clusters:
   - `supplier-crs-outage`: Uncovers third-party hotel bedbank CRS integration drops.
   - `voucher-rate-mismatch`: Identifies missing city taxes on client vouchers.
   - `breakfast-inclusion-dispute`: Highlights meal plan mapping code errors on DMC adapters.
3. Click a sample case deep link to immediately jump back into that ticket in the Operations Workspace.
4. On the left navigation bar in Workspace, click **"CSV Stream"** or **"JSON Stream"** to demonstrate un-capped enterprise data export.
