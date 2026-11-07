# OpsDesk — Hackathon Video Walkthrough Demo Guide (3 to 5 Minutes)

This guide provides the complete, step-by-step script and visual roadmap for recording our **3 to 5-minute hackathon demo video** of **OpsDesk** (the next-generation B2B travel operations ticketing platform for TBO.com).

Every journey maps directly to TBO's core operational pain points: duplicate investigation prevention, travel-aware dynamic SLAs, multi-dimensional routing, resilient supplier communications, and first-class escalation workflows.

---

## ⏱️ Video Timing Roadmap (Total Duration: 4m 15s)

| Section | Duration | Target Screen / URL | Core Demonstration |
| :--- | :---: | :--- | :--- |
| **0. Hook & Architecture** | 0:00 – 0:35 | `http://localhost:3000` | Travel ops context, 3-pane high-density split workspace, role switcher. |
| **1. Journey A: Context & Linkage** | 0:35 – 1:30 | `/new-ticket` ➔ Workspace | Intent classification (`Refund Delay`, 93% confidence) + 3 prior threads surfacing via `TBOH-7849102-M`. |
| **2. Journey B: Multi-Dimensional Routing** | 1:30 – 2:25 | `/new-ticket` ➔ Dispatch View | Urgent check-in (<4h) queue priority, 4-factor scoring (94.5/100), and transparent audit trail. |
| **3. Journey C: Resilient Side Conversations** | 2:25 – 3:15 | Ticket `TBO-2026-1003` | Atlantis Dubai side-thread, preserved recipient array, transferring agent without losing supplier state. |
| **4. Journey D: Travel SLA & Escalation** | 3:15 – 4:05 | Ticket `TBO-2026-1001` ➔ Manager Queue | Imminent check-in SLA countdown, 1-click Escalation to Priya Nair, and supervisor resolution. |
| **5. Bonus & Executive Close** | 4:05 – 4:30 | `/insights` | Weekly thematic defect clusters, supplier degradation leaderboard, and 50k+ data export streaming. |

---

## 🛠️ Pre-Demo Setup & Verification Checklist

Before hitting record, ensure the environment is primed:

1. **FastAPI Backend is running on Port 8000**:
   ```bash
   cd F:\OpsDesk\backend
   python run.py
   # Health check: http://localhost:8000/health returns {"status": "ok"}
   ```
2. **Next.js Frontend is running on Port 3000**:
   ```bash
   cd F:\OpsDesk\frontend
   npm run dev
   # Workspace: http://localhost:3000
   ```
3. **Database Seeded**: Run `python seed.py` from `backend/` if the database was reset.
4. **Browser Setup**:
   - Use Google Chrome or Microsoft Edge at **100% zoom** or **90% zoom** for maximum split-pane density.
   - Open two tabs:
     - **Tab 1**: `http://localhost:3000` (Main OpsDesk Workspace)
     - **Tab 2**: `http://localhost:3000/insights` (Ops Insights Dashboard)

---

## 🎬 Step-by-Step Spoken Script & Screen Actions

---

### Segment 0: Hook & Platform Overview (0:00 – 0:35)

#### 🖥️ Screen Action:
- Open `http://localhost:3000`.
- Mouse hovers smoothly over the 3-pane layout: **Left** (Navigation & Quick Filters), **Center** (High-Density Triage Queue with live SLA badges), **Right** (Context Linkage & Audit Timeline).
- Click the top right **Persona Switcher** dropdown to show the roles: *Sarah Jenkins (EMEA Agent)*, *Rajesh Sharma (APAC Agent)*, *Priya Nair (Escalation Manager)*, *Ahmed Al-Khatib (Agency Rep)*.

#### 🎙️ Spoken Script:
> *"Welcome to OpsDesk — the purpose-built B2B travel operations platform designed specifically for global aggregators like TBO.com.*
>
> *Traditional helpdesks fail in travel because generic ticketing has no concept of flight takeoffs, hotel check-in deadlines, or hotel bedbank CRS outages. In travel operations, an inquiry isn't just a ticket — it's an imminent guest check-in with severe commercial risk.*
>
> *Notice our high-density three-pane workspace: agents see real-time queues, live travel-aware SLA timers, and our proprietary Context Linkage Engine, with zero page reloads."*

---

### Journey A: Real-Time Context & Intent Linkage (0:35 – 1:30)
**TBO Problem Solved:** Eliminates duplicate investigations across front-desk emergencies, agency emails, and finance refund queries on the same booking.

#### 🖥️ Screen Action:
1. Click the **"+ New Incident"** button in the top navigation bar.
2. In the ticket creation screen, click the demo scenario button: **"💸 Refund Delay Prompt"** (or type in the description: *"Refund hasn't arrived for booking TBOH-7849102-M after 10 days. Pre-authorization deduction disputed by client bank."*).
3. **Point to the Dynamic Intent Box**: Show the real-time AI intent suggestion card lighting up with:
   - **Suggested Category:** `Refund Delay`
   - **Confidence Meter:** `93%`
   - **Matched Signal Words:** `"refund"`, `"hasn't arrived"`, `"10 days"`
4. Click **"Apply Intent"** — show category automatically switching to `Refund Delay` and priority setting to `HIGH`.
5. Enter Booking Hash: `TBOH-7849102-M` and click **"Dispatch Ticket"**.
6. Click **"View Ticket in Workspace"** (or return to `http://localhost:3000` and select `TBO-2026-1002`).
7. **Direct the viewer's gaze to the Right Pane (Context Linkage Engine)**:
   - Point out the red warning alert: **"⚠️ Duplicate Investigation Alert: 2 other open tickets share booking TBOH-7849102-M"**.
   - Show the 3 correlated contact threads:
     - `TBO-2026-1001` (Frontdesk emergency: Guest stranded at Hilton Dubai)
     - `TBO-2026-1002` (Finance desk: Pre-authorization charge dispute)
     - Agency Partner thread from Emirates Horizon Holidays.
   - Click `TBO-2026-1001` directly from the linked list to demonstrate seamless context-switching without losing state.

#### 🎙️ Spoken Script:
> *"Let's look at Journey A: Context and Linkage.*
>
> *When an agency or desk agent reports an issue — for example, 'Refund hasn't arrived for booking TBOH-7849102-M after 10 days' — OpsDesk's lightweight intent classifier automatically detects the travel intent as 'Refund Delay' with a 93% confidence score, extracting operational signals in real time.*
>
> *Even more powerful is what happens once dispatched: rather than treating this as an isolated case, the OpsDesk Context Linkage Engine instantly correlates the booking hash across our entire network.*
>
> *Look at the right pane: OpsDesk immediately flags a duplicate investigation warning! It surfaces three prior contact threads sharing the exact same booking reference — revealing that while the finance team was asking about a refund, the guest was stranded in the lobby due to a Hilton CRS outage.*
>
> *With one click, the agent sees the full story, completely preventing double work and conflicting responses to the hotel."*

---

### Journey B: Multi-Dimensional Routing Engine (1:30 – 2:25)
**TBO Problem Solved:** Replaces blind round-robin with multi-factor scoring evaluating check-in urgency, region, skill, and agent load.

#### 🖥️ Screen Action:
1. From `TBO-2026-1001`, click the **"Routing & Audit Trail"** tab in the center detail pane.
2. Highlight the **Routing Score Badge (94.5 / 100)** and the system explanation box:
   - **Region Match (30% weight):** Exact match for EMEA.
   - **Travel Urgency Proximity (35% weight):** Critical check-in < 4 hours from now (multiplier active).
   - **Skill Alignment (20% weight):** Agent holds `HOTEL` & `OVERBOOKING` certifications.
   - **Concurrency Load (15% weight):** Active capacity 2/6.
3. Show the transparent audit record:
   - *"Assigned to Sarah Jenkins (Score: 94.5/100). Exact region match (EMEA), HOTEL skill match, Critical travel urgency (<4h to check-in)."*
4. Show how this ticket jumped above older non-urgent tickets to the very top of the triage table with a flashing **"URGENT / AT_RISK"** status.

#### 🎙️ Spoken Script:
> *"Journey B addresses intelligent routing. Standard ticketing engines assign tickets round-robin, meaning an urgent guest check-in gets stuck behind an invoice question.*
>
> *OpsDesk uses a 4-dimensional scoring algorithm: 30% Region, 35% Travel Urgency Proximity, 20% Skill Certification, and 15% Agent Concurrency.*
>
> *Notice ticket TBO-2026-1001: because the check-in is less than 4 hours away, the travel urgency multiplier jumped its score to 94.5 out of 100. It dynamically bypassed standard queues and was dispatched directly to EMEA hotel specialist Sarah Jenkins.*
>
> *Every single assignment includes a transparent audit string, so team leads always know exactly why a ticket was routed to a specific agent."*

---

### Journey C: Resilient Supplier Side-Conversations (2:25 – 3:15)
**TBO Problem Solved:** Ticket handovers and shift rotations frequently drop CC'd supplier emails and external threads.

#### 🖥️ Screen Action:
1. In the central queue table, click ticket `TBO-2026-1003` (*"Atlantis The Palm - Royal Suite Renovation Relocation Dispute"*).
2. Click the **"Supplier Side-Conversations"** tab in the center pane.
3. Point out the active thread with Atlantis The Palm Reservations:
   - Highlight the **Preserved Recipient Pill List**:
     - `duty.manager@atlantisdubai.com`
     - `reservations@atlantisdubai.com`
     - `tbo-contracts-dubai@tbo.com`
     - `vip-desk@tbo.com`
   - Show the previous message exchange between Sarah Jenkins and the Atlantis Duty Manager.
4. In the top action bar, click **"Transfer Ticket"**.
5. Select **Rajesh Sharma (APAC Desk Agent)**, enter reason: *"Shift handover to APAC coverage"*, and click **"Confirm Transfer"**.
6. Point out that the ticket assignee immediately updates to Rajesh Sharma, while:
   - The supplier side-conversation remains **100% active**.
   - The entire 4-member recipient distribution list is **completely preserved**.
   - An audit log entry is written: *"Transferred to Rajesh Sharma. Supplier side-convo active and recipient list intact."*

#### 🎙️ Spoken Script:
> *"Now for Journey C: Resilient Supplier Side-Conversations.*
>
> *When dealing with airlines or hotel bedbanks, agents must communicate externally with duty managers without exposing those internal notes to the B2B client.*
>
> *In generic CRMs, reassigning a ticket wipes external thread context or breaks CC lists. In OpsDesk, supplier side-conversations are decoupled first-class entities.*
>
> *Watch this: Ticket 1003 has an active dispute thread with Atlantis The Palm, retaining four explicit hotel duty emails. When Sarah transfers this ticket to Rajesh during a shift rotation...*
>
> *The entire conversation, message history, and four-address recipient distribution list survive intact. Rajesh can reply immediately to the hotel duty manager without re-gathering contact emails or dropping contract leads."*

---

### Journey D: Travel-Aware SLA & Manager Escalation (3:15 – 4:05)
**TBO Problem Solved:** Static SLAs breach when check-ins arrive; lack of high-authority manager escalation pathways.

#### 🖥️ Screen Action:
1. Select ticket `TBO-2026-1001` (Hilton Dubai Overbooking).
2. Point out the **Live SLA Countdown Badge**:
   - Travel-aware formula: `MIN(Created_At + Base, Check_In - 2h Margin, LCD - Margin)`.
   - Show the ticking countdown: `BREACHED` or `AT_RISK (<2h to check-in)`.
3. Click the prominent red **"Escalate to Manager"** button in the detail view toolbar.
4. In the Escalation Modal:
   - Trigger Reason: *"Supplier CRS unresponsive / Check-in deadline imminent (<2h)"*.
   - Escalation Notes: *"Hotel desk refuses to honor voucher. Authorize emergency direct-bill relocation."*
   - Click **"Confirm Escalation"**.
5. Observe the instant transition:
   - Ticket status mutates to **`ESCALATED`**.
   - Priority locks to **`URGENT`**.
   - Ticket auto-assigns to **Priya Nair (Escalation Manager)**.
6. Use the top **Persona Switcher** to switch to **Priya Nair (Escalation Manager)**.
7. Click the **"Escalated Manager Queue"** tab on the left navigation:
   - Show the ticket prioritized in Priya's dedicated escalation queue.
   - Click **"Resolve Ticket"** (or approve credit override) to close the dispute.

#### 🎙️ Spoken Script:
> *"Journey D demonstrates our Travel-Aware SLA Engine and First-Class Escalation Matrix.*
>
> *Notice our SLA badge: instead of an arbitrary 24-hour business clock, OpsDesk calculates deadlines dynamically against the guest's physical check-in and supplier Last Cancellation Dates.*
>
> *When a hotel CRS drops a reservation with check-in only two hours away, the ticket is flagged as critical. With one click on 'Escalate to Manager', the agent submits the override request.*
>
> *The ticket immediately mutates to 'ESCALATED', priority jumps to URGENT, and it auto-assigns to Escalation Manager Priya Nair.*
>
> *Switching to Priya's persona, she sees this case highlighted in her dedicated Manager Queue, where she has the financial authority to approve a supplier re-accommodation payout immediately, protecting TBO's reputation."*

---

### Segment 5: Ops Insights Clusters & Scaling Demo (4:05 – 4:30)

#### 🖥️ Screen Action:
1. Click **"Ops Insights & Clusters"** in the top navigation bar to switch to `/insights`.
2. Point to the top **Executive Operations Briefing Banner**:
   - Highlight the narrative: *"Voucher Rate Discrepancy at Check-In and Supplier CRS Outage represent 69.3% of total operational volume this week, exposing $7,700 in dispute risk..."*
3. Show the **Theme Clusters**:
   - `supplier-crs-outage`: 30.8% share, root cause and actionable remediation.
   - Click on one of the **Sample Ticket Pills** (e.g. `TBO-2026-1002`) to show that it deep-links right back to the ticket in the workspace.
4. Back in the workspace, click the **"Export CSV"** button on the left sidebar:
   - Point out that it triggers an uncapped RFC-4180 streaming export capable of streaming 50,000+ records with zero memory spikes.

#### 🎙️ Spoken Script:
> *"Finally, OpsDesk turns daily operational firefighting into systemic intelligence.*
>
> *Our Ops Insights dashboard clusters tickets by underlying defect tags — surfacing that supplier CRS sync failures and voucher rate discrepancies account for over 69% of this week's volume, exposing thousands of dollars in dispute liability.*
>
> *Executives get actionable remediation recommendations and direct links to sample cases, while our streaming export engine streams over 50,000 records for BI analytics with zero memory bloat.*
>
> *OpsDesk brings enterprise velocity, travel intelligence, and contextual precision to TBO's global travel network. Thank you!"*

---

## 💡 Pro Tips for a Flawless Video Recording

1. **Clean Screen Recording Resolution**: Set screen resolution to **1920x1080 (16:9)**.
2. **Smooth Cursor Movements**: Avoid erratic mouse jerks. Hover deliberately over badges and buttons 1 second before clicking.
3. **Audio Clarity**: Record in a quiet room with a dedicated headset/mic. Keep an energetic, confident, and professional tone.
4. **Browser State**: Keep developer console closed unless showing the live SSE stream or export benchmark.
5. **Rehearsal Run**: Do one dry run through all 4 journeys before recording the final take. The entire sequence runs smoothly in **under 4 minutes and 30 seconds**.
