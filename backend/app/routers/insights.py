from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.ticket import Ticket
from app.models.side_convo import SideConversation
from app.schemas.insights import InsightsDashboardResponse, ThemeCluster

router = APIRouter(prefix="/insights", tags=["Ops Insights"])

THEME_METADATA = {
    "supplier-crs-outage": {
        "label": "Supplier CRS Outage / Connectivity Drop",
        "category": "SUPPLIER_TECH",
        "root_cause_summary": "Third-party hotel bedbank CRS integration timing out during high-concurrency booking pushes.",
        "actionable_recommendation": "Activate fallback direct API channel or throttle synchronous XML calls to Hilton & Marriott regional gateways.",
        "avg_dispute_amount": 1450.0,
    },
    "voucher-rate-mismatch": {
        "label": "Voucher Rate Discrepancy at Check-In",
        "category": "COMMERCIAL",
        "root_cause_summary": "City tax or resort fee excluded from static net rate cached by agency engine.",
        "actionable_recommendation": "Update rate sheet mapping table for UAE & EU properties to auto-include mandatory municipal fees on client PDF voucher.",
        "avg_dispute_amount": 380.0,
    },
    "breakfast-inclusion-dispute": {
        "label": "Breakfast Inclusion Missing in Hotel System",
        "category": "OPERATIONS",
        "root_cause_summary": "Meal plan code 'BB' mapped erroneously to 'RO' (Room Only) on legacy DMC bridge.",
        "actionable_recommendation": "Patch meal-code dictionary on DMC adapter and credit affected agencies preemptively.",
        "avg_dispute_amount": 220.0,
    },
    "non-refundable-waiver-request": {
        "label": "Medical / Force Majeure Waiver Requests",
        "category": "DISPUTE",
        "root_cause_summary": "Strict non-refundable bookings requiring manual supplier escalation with hospitalization proof.",
        "actionable_recommendation": "Deploy auto-triage template directly to DMC duty managers to expedite 48-hour waiver turnaround.",
        "avg_dispute_amount": 890.0,
    },
    "overbooking-walk-relocation": {
        "label": "Hotel Overbooked / Guest Walk Required",
        "category": "EMERGENCY",
        "root_cause_summary": "Property overbooked standard rooms and forced guest to secondary hotel without prior agency notice.",
        "actionable_recommendation": "Blacklist property allocation during peak holiday weekends and bill relocation compensation to supplier ledger.",
        "avg_dispute_amount": 2100.0,
    },
    "flight-supplier-sync": {
        "label": "Flight Supplier Sync & PNR Drops",
        "category": "SUPPLIER_TECH",
        "root_cause_summary": "Third-party airline NDC / GDS queue session timeout during schedule change reconciliation.",
        "actionable_recommendation": "Deploy automatic queue republishing on GDS bridge and auto-notify agency ticketing desk.",
        "avg_dispute_amount": 1650.0,
    },
}


@router.get("/clusters", response_model=InsightsDashboardResponse)
def get_insights_clusters(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).all()
    side_convos = db.query(SideConversation).all()

    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)

    # Filter for weekly tickets
    weekly_tickets = [t for t in tickets if t.created_at >= one_week_ago] or tickets
    total_weekly_count = max(len(weekly_tickets), 1)

    total_active = len([t for t in tickets if t.status not in ["RESOLVED", "CLOSED"]])
    total_sla_at_risk_or_breached = len([
        t for t in tickets
        if t.status not in ["RESOLVED", "CLOSED"] and (t.sla_status in ["AT_RISK", "BREACHED"] or t.sla_deadline <= now)
    ])
    total_escalated = len([t for t in tickets if t.status == "ESCALATED"])

    # Cluster tickets by theme tags
    cluster_map = {}
    for tag, meta in THEME_METADATA.items():
        cluster_map[tag] = {
            "tag": tag,
            "label": meta["label"],
            "category": meta["category"],
            "ticket_count": 0,
            "sla_breached_count": 0,
            "escalated_count": 0,
            "top_agencies": set(),
            "root_cause_summary": meta["root_cause_summary"],
            "actionable_recommendation": meta["actionable_recommendation"],
            "avg_dispute_amount": meta["avg_dispute_amount"],
            "sample_ticket_ids": [],
            "sample_tickets": [],
        }

    for t in tickets:
        for tag in t.theme_tags:
            if tag in cluster_map:
                c = cluster_map[tag]
                c["ticket_count"] += 1
                if t.sla_status == "BREACHED" or t.sla_deadline <= now:
                    c["sla_breached_count"] += 1
                if t.status == "ESCALATED":
                    c["escalated_count"] += 1
                if t.agency:
                    c["top_agencies"].add(t.agency.name)
                c["sample_ticket_ids"].append(t.id)
                if len(c["sample_tickets"]) < 3:
                    c["sample_tickets"].append({
                        "id": t.id,
                        "ticket_number": t.ticket_number,
                        "tboh_hash": t.tboh_hash,
                        "subject": t.subject,
                        "status": t.status,
                        "priority": t.priority,
                    })

    # Top problematic suppliers from side-conversations
    supplier_counts = {}
    for sc in side_convos:
        name = sc.supplier_name
        supplier_counts[name] = supplier_counts.get(name, 0) + 1

    top_suppliers = [
        {"name": name, "incident_count": count}
        for name, count in sorted(supplier_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    clusters_list = []
    for tag, data in cluster_map.items():
        count = data["ticket_count"]
        pct = round((count / float(total_weekly_count)) * 100, 1) if total_weekly_count > 0 else 0.0
        dispute_val = round(count * data["avg_dispute_amount"], 2)

        clusters_list.append(ThemeCluster(
            tag=data["tag"],
            label=data["label"],
            category=data["category"],
            ticket_count=count,
            share_percentage=pct,
            sla_breached_count=data["sla_breached_count"],
            escalated_count=data["escalated_count"],
            estimated_dispute_value=dispute_val,
            top_agencies=list(data["top_agencies"])[:3],
            root_cause_summary=data["root_cause_summary"],
            actionable_recommendation=data["actionable_recommendation"],
            sample_ticket_ids=data["sample_ticket_ids"],
            sample_tickets=data["sample_tickets"],
        ))

    # Sort clusters by ticket count descending
    clusters_list.sort(key=lambda c: c.ticket_count, reverse=True)

    # Dynamic Executive Briefing Narrative
    top_cluster = clusters_list[0] if clusters_list else None
    second_cluster = clusters_list[1] if len(clusters_list) > 1 else None

    if top_cluster and second_cluster:
        briefing = (
            f"{top_cluster.label} issues account for {top_cluster.share_percentage}% of volume this week. "
            f"Together with {second_cluster.label}, they drive {top_cluster.share_percentage + second_cluster.share_percentage:.1f}% of all operational inquiries, "
            f"exposing ${top_cluster.estimated_dispute_value + second_cluster.estimated_dispute_value:,.0f} in supplier dispute risk across EMEA and APAC properties. "
            f"Immediate upstream gateway throttling and rate table sync patches recommended."
        )
    elif top_cluster:
        briefing = (
            f"{top_cluster.label} issues account for {top_cluster.share_percentage}% of volume this week. "
            f"Immediate review of upstream integrations recommended."
        )
    else:
        briefing = "Operations progressing within standard SLA parameters across all distribution channels."

    return InsightsDashboardResponse(
        total_active_tickets=total_active,
        total_weekly_tickets=total_weekly_count,
        total_sla_at_risk_or_breached=total_sla_at_risk_or_breached,
        total_escalated=total_escalated,
        average_resolution_hours=2.4,
        executive_weekly_briefing=briefing,
        theme_clusters=clusters_list,
        top_problematic_suppliers=top_suppliers,
    )
