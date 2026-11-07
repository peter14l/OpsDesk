# OpsDesk - Phase 2: Context Linkage & Multi-Dimensional Routing Engine

## 1. Context Linkage Specification

### 1.1 The Operational Problem at TBO.com
In high-volume B2B travel operations, when a hotel CRS fails or a flight is canceled, multiple departments or agents from the same travel agency (or multiple travelers) reach out concurrently:
- Agency front desk files a complaint: "Guest stranded at check-in".
- Agency finance desk files a ticket: "Refund request duplicate voucher".
- Agency account manager sends an inquiry: "Emergency room re-allocation".

Without contextual linkage, three separate ops agents perform duplicate manual outreach to the hotel supplier, often giving conflicting promises and burning precious minutes before check-in.

### 1.2 Linkage Algorithm
Whenever a ticket is created or accessed in OpsDesk:
1. **Primary Link Key (`tboh_hash`)**: 
   The service queries all non-closed tickets matching the identical `tboh_hash` (TBO Hotel/Flight Booking Hash). 
   - Tickets are sorted by creation date descending.
   - Any active supplier side-conversations across linked tickets are flagged.
2. **Secondary Link Key (`agency_id`)**:
   The service queries the latest tickets from the same agency to reveal chronic failure patterns (e.g. repeated payment or voucher rejections with a specific property).
3. **Frontend Side-Pane Context Delivery**:
   The linkage service exposes an endpoint `GET /api/v1/tickets/{id}/context-links` returning structured arrays for immediate rendering in the left/right auxiliary context pane.

---

## 2. Multi-Dimensional Routing Engine Specification

### 2.1 Routing Criteria & Scoring Function
Incoming tickets are evaluated across 4 weighted dimensions to select the optimal operations agent:

```
Total Score = W_region * S_region 
            + W_urgency * S_urgency 
            + W_skill * S_skill 
            + W_load * S_load 
            + W_agency_tier * S_agency_tier
```

#### Dimension 1: Region & Country Alignment (Weight: 30%)
- Exact match between Agent Region and Ticket/Agency Region (`EMEA`, `APAC`, `AMER`): **Score = 1.0**
- Agent with `GLOBAL` jurisdiction: **Score = 0.6**
- Mismatched region: **Score = 0.1**

#### Dimension 2: Travel Urgency & Check-in Proximity (Weight: 35%)
- Check-in in `< 6 hours`: **Urgency Multiplier = 1.5** (Forces ticket to high-priority triage desk)
- Check-in in `< 24 hours`: **Urgency Multiplier = 1.25**
- Check-in in `< 72 hours`: **Urgency Multiplier = 1.0**
- Check-in `> 72 hours`: **Urgency Multiplier = 0.75**

#### Dimension 3: Skill & Category Specialization (Weight: 20%)
- Agent possesses category tag (`HOTEL`, `REFUND`, `AMENDMENT`, `OVERBOOKING`): **Score = 1.0**
- Generalist agent without tag: **Score = 0.4**

#### Dimension 4: Agent Availability & Concurrency Load (Weight: 15%)
- Agent status:
  - `AVAILABLE`: Multiplier = 1.0
  - `BUSY`: Multiplier = 0.4
  - `OFFLINE`: Multiplier = 0.0 (Disqualified)
- Load factor: `1.0 - (current_active_tickets / max_concurrency)`
- If `current_active_tickets >= max_concurrency`, agent is disqualified unless all agents are at capacity.

#### Dimension 5: VIP Agency Tier Boost
- `PLATINUM` agency: routed to senior agents or escalation managers with priority SLA.

### 2.2 Routing Output & Audit Reason String
Every routing decision generates a human-readable explanation stored in `ticket.routing_reason` and logged to `audit_logs`:
> *"Assigned to Rajesh Sharma (Score: 88.5/100). Criteria: Exact Region match (APAC), Category skill match (HOTEL, AMENDMENT), Available capacity (2/6 active), Urgency boost (<14h to check-in)."*

If no agent meets minimum thresholds, the ticket is routed to the Operations Lead with status `NEW` and flagged for manual triage.
