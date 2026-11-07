import {
  TicketSummary,
  TicketDetail,
  ContextLinks,
  InsightsDashboard,
  Agency,
  User,
  SideConversation,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {}
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }

  return res.json();
}

export const api = {
  // Tickets
  async getTickets(params?: {
    status?: string;
    priority?: string;
    region?: string;
    assigned_to?: string;
    sla_status?: string;
    category?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: TicketSummary[]; total: number; page: number; page_size: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
          query.append(key, String(val));
        }
      });
    }
    return fetchJson(`/tickets?${query.toString()}`);
  },

  async getTicket(id: string): Promise<TicketDetail> {
    return fetchJson(`/tickets/${id}`);
  },

  async createTicket(payload: {
    tboh_hash: string;
    agency_id: string;
    requester_email: string;
    subject: string;
    description: string;
    category: string;
    priority?: string;
    check_in_date: string;
    last_cancellation_date?: string;
    region?: string;
    theme_tags?: string[];
  }): Promise<{ ticket: TicketSummary; routed_to: any; routing_reason: string }> {
    return fetchJson("/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTicket(
    id: string,
    payload: {
      status?: string;
      priority?: string;
      category?: string;
      assigned_agent_id?: string;
      theme_tags?: string[];
    }
  ): Promise<TicketSummary> {
    return fetchJson(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async addMessage(
    ticketId: string,
    payload: {
      sender_id?: string;
      sender_email: string;
      sender_role: string;
      message_type: "PUBLIC" | "INTERNAL_NOTE";
      body: string;
    }
  ) {
    return fetchJson(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Context Linkage
  async getContextLinks(ticketId: string): Promise<ContextLinks> {
    return fetchJson(`/tickets/${ticketId}/context-links`);
  },

  // Escalation & Transfer
  async escalateTicket(
    ticketId: string,
    payload: {
      reason: string;
      escalation_notes?: string;
      actor_name?: string;
      actor_role?: string;
    }
  ) {
    return fetchJson(`/tickets/${ticketId}/escalate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async transferTicket(
    ticketId: string,
    payload: {
      target_agent_id: string;
      reason: string;
      actor_name?: string;
      actor_role?: string;
    }
  ) {
    return fetchJson(`/tickets/${ticketId}/transfer`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Side-Conversations
  async getSideConversations(ticketId: string): Promise<SideConversation[]> {
    return fetchJson(`/tickets/${ticketId}/side-conversations`);
  },

  async createSideConversation(
    ticketId: string,
    payload: {
      subject: string;
      supplier_name: string;
      supplier_email: string;
      recipient_emails: string[];
      initial_message: string;
      created_by_agent_id?: string;
    }
  ): Promise<SideConversation> {
    return fetchJson(`/tickets/${ticketId}/side-conversations`, {
      method: "POST",
      body: JSON.stringify({ ticket_id: ticketId, ...payload }),
    });
  },

  async addSideConversationMessage(
    sideConvoId: string,
    payload: {
      sender_email?: string;
      is_supplier_incoming: boolean;
      body: string;
    }
  ) {
    return fetchJson(`/side-conversations/${sideConvoId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Routing evaluation
  async evaluateRouting(ticketId: string, apply = false) {
    return fetchJson(`/routing/evaluate/${ticketId}?apply=${apply}`, {
      method: "POST",
    });
  },

  // Insights
  async getInsightsClusters(): Promise<InsightsDashboard> {
    return fetchJson("/insights/clusters");
  },

  // Users & Agencies
  async getUsers(): Promise<User[]> {
    return fetchJson("/users");
  },

  async getAgencies(): Promise<Agency[]> {
    return fetchJson("/agencies");
  },

  // Export URLs
  getExportUrl(format: "csv" | "json", status?: string, region?: string) {
    const params = new URLSearchParams({ format });
    if (status && status !== "ALL") params.append("status", status);
    if (region && region !== "ALL") params.append("region", region);
    return `${API_BASE}/export/tickets?${params.toString()}`;
  },
};
