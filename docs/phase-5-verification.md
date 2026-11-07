# OpsDesk - Phase 5: Verification, Polish & Hackathon Demo Script

## 1. Quality Assurance & Verification Methodology
To ensure production readiness for the TBO hackathon submission, OpsDesk has undergone verification across 5 dimensions:
1. **API & Data Integrity**: Foreign key cascade rules, UTC datetime precision, RFC-4180 un-capped streaming export, and JSON serialization of recipient lists.
2. **Context Linkage Accuracy**: Verified queries linking multiple tickets sharing identical `TBOH` hashes (e.g. `TBOH-7849102-M`) and same Agency accounts (`AGY-DXB-902`).
3. **Multi-Dimensional Routing Precision**: Verified scoring weights across Region, Check-In Urgency (<6h multiplier), Category Skills, and Agent Concurrency.
4. **Supplier Side-Conversation Recipient Retention**: Verified that ticket ownership reassignments (e.g. Sarah Jenkins to Rajesh Sharma) preserve the explicit recipient array on the thread object without loss.
5. **Dynamic Travel-Aware SLA Calculations**: Verified dynamic calculations where check-in proximity (<4 hours) automatically drives the SLA status to `AT_RISK` and `BREACHED` rather than arbitrary static timers.

---

## 2. Test Execution Results

| Test Category | Test Case | Target Metric | Result |
| :--- | :--- | :--- | :---: |
| **Backend Core** | Database Seeding (`seed.py`) | 4 Agencies, 7 Users, 12+ Tickets, Supplier Threads, Audit Logs | **PASS** |
| **Context Linkage** | Correlate `TBOH-7849102-M` | Surface 2+ tickets sharing booking hash + agency history | **PASS** |
| **Routing Engine** | Automated Scoring & Assignee | Multi-dimensional scoring with human-readable audit reason | **PASS** |
| **Workflows** | First-Class Escalation | Mutates state to `ESCALATED`, `URGENT`, reassigns to Manager Priya, logs audit | **PASS** |
| **Workflows** | Recipient Retention | Reassignment preserves `['duty.manager@...', 'reservations@...', 'vip-desk@...']` | **PASS** |
| **Data Export** | Un-capped CSV & JSON | RFC-4180 compliant stream with all travel fields and headers | **PASS** |
| **Ops Insights** | Theme Tag Clustering | Clusters weekly tags (`supplier-crs-outage`, `voucher-rate-mismatch`) with deep links | **PASS** |

---

## 3. Demo Persona Mapping (Hackathon Evaluation)

| Persona / Role | Demo Account Email | Primary Operational Scope |
| :--- | :--- | :--- |
| **Operations Desk Agent (EMEA)** | `sarah.jenkins@tbo.com` | First-line triage for EMEA region, hotel reservations, and cancellation disputes. |
| **Operations Desk Agent (APAC)** | `rajesh.sharma@tbo.com` | First-line triage for APAC region, amendments, and special meal/room requests. |
| **Escalation Manager (Global)** | `priya.nair@tbo.com` | High-authority queue handling VIP platinum partner disputes, supplier CRS outages, and override waivers. |
| **Operations Lead (Global)** | `alex.mercer@tbo.com` | System supervisor overseeing Ops Insights clusters, supplier degradation, and data exports. |
| **B2B Travel Agency Rep** | `requester.dxb@emirateshorizon.com` | Emirates Horizon Holidays desk representative submitting and tracking bookings. |

---

## 4. End-to-End Demo Script (3 to 5 Minutes)

### Journey A: Real-Time Context Linkage (Eradicating Duplicate Work)
1. In the Workspace triage queue, click ticket `TBO-2026-1002` ("Pre-authorization billing discrepancy on TBOH-7849102-M").
2. Look at the right-hand **Context Linkage Engine** pane.
3. Observe the bright amber alert: *"Duplicate Investigation Alert! Another ticket exists for booking TBOH-7849102-M"*.
4. Notice `TBO-2026-1001` is instantly surfaced: *"Guest stranded at Hilton Dubai Al Habtoor, reservation not in CRS"*.
5. Click on `TBO-2026-1001` in the context pane to jump directly to the primary operational incident, preventing duplicate supplier outreach.

### Journey B: Multi-Dimensional Routing Engine
1. Click **"New Ticket"** in the top navigation bar.
2. Select **Emirates Horizon Holidays** (Platinum tier), enter Booking Hash `TBOH-7849102-M`, category `OVERBOOKING`, and set check-in to 4 hours from now.
3. Click **"Dispatch Ticket"**.
4. Observe the instant routing resolution: OpsDesk scores available agents and assigns the ticket to EMEA specialist Sarah Jenkins, outputting the exact rationale: *"Assigned to Sarah Jenkins (Score: 94.5/100). Exact region match (EMEA), HOTEL skill match, Critical travel urgency (<4h to check-in)."*

### Journey C: Supplier Side-Conversations & Recipient Retention
1. Open ticket `TBO-2026-1003` ("Atlantis The Palm - Royal Suite Renovation Relocation Dispute").
2. Click the **"Supplier Side-Conversations"** tab.
3. Inspect the active thread with Atlantis The Palm duty desk: notice the preserved recipient array:
   `["duty.manager@atlantisdubai.com", "reservations@atlantisdubai.com", "tbo-contracts-dubai@tbo.com", "vip-desk@tbo.com"]`.
4. Click **"Transfer"** in the top toolbar and reassign the ticket from Sarah Jenkins to Rajesh Sharma.
5. Notice the audit log confirms the handover while the entire supplier conversation history and recipient list remain intact for Rajesh.

### Journey D: First-Class One-Click Escalation
1. Select an urgent ticket with an impending check-in (e.g. `TBO-2026-1001`).
2. Click the red **"Escalate to Manager"** button.
3. Select trigger: *"Supplier CRS unresponsive / Check-in deadline imminent (<2h)"* and click **"Confirm Escalation"**.
4. Observe the ticket immediately transitions to `ESCALATED`, priority becomes `URGENT`, owner is re-assigned to Escalation Manager Priya Nair, and an immutable entry appears in the Visual Audit Timeline.
5. In the top role switcher, toggle role to **Priya Nair (Escalation Manager)** and filter queue by **"Escalated Manager Queue"** to view the escalated case at the top of the manager's workload.

### Journey E: Ops Insights Theme Clusters & Root Cause Loop
1. Click **"Ops Insights & Clusters"** in the top header navigation.
2. Review the aggregated themes:
   - `supplier-crs-outage`: Identifies Hilton and Marriott bedbank XML gateway timeouts.
   - `voucher-rate-mismatch`: Highlights city tax calculation discrepancies on client vouchers.
   - `breakfast-inclusion-dispute`: Exposes meal plan mapping bugs on DMC adapters.
3. Click the sample case link `TBO-2026-1001` inside the cluster card to jump directly back into the live ticket in the Operations Workspace.
