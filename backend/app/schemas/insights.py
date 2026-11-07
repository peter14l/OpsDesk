from pydantic import BaseModel
from typing import List, Optional


class ThemeCluster(BaseModel):
    tag: str
    label: str
    category: str
    ticket_count: int
    sla_breached_count: int
    escalated_count: int
    top_agencies: List[str]
    root_cause_summary: str
    actionable_recommendation: str
    sample_ticket_ids: List[str]
    sample_tickets: List[dict] = []


class InsightsDashboardResponse(BaseModel):
    total_active_tickets: int
    total_sla_at_risk_or_breached: int
    total_escalated: int
    average_resolution_hours: float
    theme_clusters: List[ThemeCluster]
    top_problematic_suppliers: List[dict]
