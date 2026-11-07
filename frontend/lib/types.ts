export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "NEW" | "OPEN" | "PENDING_SUPPLIER" | "ESCALATED" | "RESOLVED" | "CLOSED";
export type SlaStatus = "ON_TRACK" | "AT_RISK" | "BREACHED";
export type UserRole = "REQUESTER" | "AGENT" | "ESCALATION_MANAGER" | "LEAD";

export interface Agency {
  id: string;
  code: string;
  name: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "STANDARD";
  region: string;
  country_code: string;
  account_manager?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  region: string;
  skills: string[];
  availability_status: "AVAILABLE" | "BUSY" | "OFFLINE";
  max_concurrency: number;
  active_ticket_count: number;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id?: string;
  sender_email: string;
  sender_role: string;
  message_type: "PUBLIC" | "INTERNAL_NOTE";
  body: string;
  created_at: string;
}

export interface SideConversationMessage {
  id: string;
  side_conversation_id: string;
  sender_email: string;
  is_supplier_incoming: boolean;
  body: string;
  created_at: string;
}

export interface SideConversation {
  id: string;
  ticket_id: string;
  subject: string;
  supplier_name: string;
  supplier_email: string;
  recipient_emails: string[];
  status: "OPEN" | "WAITING_ON_SUPPLIER" | "RESOLVED";
  created_by_agent_id: string;
  created_at: string;
  updated_at: string;
  messages: SideConversationMessage[];
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action_type: string;
  previous_state?: string;
  new_state?: string;
  reason?: string;
  created_at: string;
}

export interface TicketSummary {
  id: string;
  ticket_number: string;
  tboh_hash: string;
  agency_id: string;
  agency_name?: string;
  agency_tier?: "PLATINUM" | "GOLD" | "SILVER" | "STANDARD";
  requester_email: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  region: string;
  check_in_date: string;
  last_cancellation_date?: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  routing_score: number;
  routing_reason?: string;
  sla_status: SlaStatus;
  sla_deadline: string;
  theme_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  agency?: Agency;
  assigned_agent?: User;
  messages: TicketMessage[];
  side_conversations: SideConversation[];
  audit_logs: AuditLog[];
}

export interface ContextLinks {
  current_ticket_id: string;
  tboh_hash: string;
  agency_id: string;
  same_booking_tickets: TicketSummary[];
  same_agency_tickets: TicketSummary[];
}

export interface ThemeCluster {
  tag: string;
  label: string;
  category: string;
  ticket_count: number;
  share_percentage: number;
  sla_breached_count: number;
  escalated_count: number;
  estimated_dispute_value: number;
  top_agencies: string[];
  root_cause_summary: string;
  actionable_recommendation: string;
  sample_ticket_ids: string[];
  sample_tickets: Array<{
    id: string;
    ticket_number: string;
    tboh_hash: string;
    subject: string;
    status: string;
    priority: string;
  }>;
}

export interface InsightsDashboard {
  total_active_tickets: number;
  total_weekly_tickets: number;
  total_sla_at_risk_or_breached: number;
  total_escalated: number;
  average_resolution_hours: number;
  executive_weekly_briefing: string;
  theme_clusters: ThemeCluster[];
  top_problematic_suppliers: Array<{
    name: string;
    incident_count: number;
  }>;
}
