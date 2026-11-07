# OpsDesk - Phase 4: Frontend Workspace, Insights Loop & Data Export

## 1. UX Design & Architectural Philosophy
OpsDesk is built as a high-density, low-latency, mission-critical workspace for B2B travel operations teams. In peak travel disruptions (e.g. airport snowstorms or hotel CRS outages), agents cannot afford multiple page transitions, slow navigation, or hidden booking context.

The UI architecture adheres to:
1. **Dense 3-Pane Responsive Layout**:
   - **Left Pane / Sidebar**: Navigation, Quick Filters (All, Assigned to Me, Escalated, SLA At-Risk, Pending Supplier), and Global Role Switcher.
   - **Center / Workspace Pane**: 
     - **Triage Queue View**: High-density virtualized/paginated table with live SLA countdown badges, booking hashes (`TBOH`), agency badges, urgency indicators, and bulk actions.
     - **Split-Pane Ticket Detail View**: Conversation thread, customer messages, internal notes editor, and supplier side-conversations tabs.
   - **Right Auxiliary Pane (Context Engine)**:
     - Real-time Context Linkage: Live query of historical and active tickets sharing identical `TBOH` booking hash or Agency ID.
     - Dynamic Travel-Aware SLA monitor with visual countdown bar and check-in timeline.
     - One-click **"Escalate to Escalation Manager"** action and Agent Transfer modal.
     - Visual Audit Timeline showing every state change, routing score, and supplier message.
2. **Ops Insights Dashboard**:
   - Executive & Lead view aggregating theme clusters (`supplier-crs-outage`, `voucher-rate-mismatch`, etc.).
   - Impact metrics: Affected ticket counts, SLA breach rates, and top problematic suppliers.
   - Actionable recommendations with direct deep-linking to sample tickets.
3. **Data Stream Export**:
   - One-click streaming CSV and JSON exports for enterprise reporting and data warehouses.
4. **Interactive Persona Switcher**:
   - Seamless switching between:
     - **Agent** (Sarah Jenkins / Rajesh Sharma)
     - **Escalation Manager** (Priya Nair)
     - **Operations Lead** (Alex Mercer)
     - **Requester** (Emirates Horizon Holidays)

---

## 2. Component Hierarchy

```
frontend/
├── app/
│   ├── layout.tsx                # Global theme, font, and metadata provider
│   ├── globals.css               # Dense Tailwind design tokens, badges, animations
│   ├── page.tsx                  # Main Workspace (Triage Queue + Split-Pane Workspace)
│   ├── insights/
│   │   └── page.tsx              # Ops Insights Clustering Dashboard
│   └── new-ticket/
│       └── page.tsx              # Travel Agency Ticket Submission Form
├── components/
│   ├── Header.tsx                # App bar, live stats, Persona / Role Switcher
│   ├── Navigation.tsx            # Left sidebar with quick filters & views
│   ├── TicketQueueTable.tsx      # High-density triage table with SLA indicators & export
│   ├── TicketDetailView.tsx      # Split-pane detail view (Chat + Internal Notes + Side Convo)
│   ├── ContextLinkagePane.tsx    # Right pane: TBOH context links & Agency history
│   ├── SideConversationModal.tsx # Supplier side-conversation composer with recipient retention
│   ├── EscalationModal.tsx       # First-class escalation to Escalation Manager dialog
│   ├── TransferModal.tsx         # Agent transfer dialog
│   ├── AuditTimeline.tsx         # Visual audit timeline of actions & state transitions
│   └── SlaBadge.tsx              # Color-coded dynamic travel-aware SLA badge
└── lib/
    ├── api.ts                    # Typed API client with auto-fallback and retry
    ├── types.ts                  # TypeScript interfaces matching backend Pydantic models
    └── utils.ts                  # Date formatting, SLA calculations, CSS helpers
```

---

## 3. State Management & Real-Time Interaction
- **Client State**: Light, fast React state hooks with URL sync for search and active filters.
- **Optimistic UI Updates**: Instant local state mutation on status changes, internal notes, side-conversations, and escalations, synchronized asynchronously with FastAPI.
- **Live SLA Ticker**: `useEffect` interval ticking every 5 seconds, recalculating SLA countdown badges to highlight approaching check-in deadlines.
