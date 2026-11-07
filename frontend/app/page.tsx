"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header, PRESET_USERS, CurrentUserSession } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { TicketQueueTable } from "@/components/TicketQueueTable";
import { TicketDetailView } from "@/components/TicketDetailView";
import { ContextLinkagePane } from "@/components/ContextLinkagePane";
import { EscalationModal } from "@/components/EscalationModal";
import { TransferModal } from "@/components/TransferModal";
import { SideConversationModal } from "@/components/SideConversationModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DetailSkeleton } from "@/components/Skeletons";
import { TicketSummary, TicketDetail, ContextLinks } from "@/lib/types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Bell, Sparkles, X } from "lucide-react";

export default function WorkspacePage() {
  const router = useRouter();

  // Active Persona / Role
  const [currentUser, setCurrentUser] = useState<CurrentUserSession>(PRESET_USERS[0]);

  // Queue Filters
  const [currentFilter, setCurrentFilter] = useState("ALL");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [contextLinks, setContextLinks] = useState<ContextLinks | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Real-Time Sync & Live Notification states
  const [isLiveSync, setIsLiveSync] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);
  const lastEventTimestamp = useRef<string>(new Date().toISOString());

  // Modals
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSideConvoModal, setShowSideConvoModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({ active: 0, atRisk: 0, escalated: 0 });

  // Load ticket list
  const loadTickets = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoadingList(true);
      const params: any = {
        search: searchQuery,
      };

      if (currentFilter === "MY_TICKETS") {
        params.assigned_to = currentUser.id;
      } else if (currentFilter === "SLA_RISK") {
        params.sla_status = "AT_RISK";
      } else if (currentFilter === "ESCALATED") {
        params.status = "ESCALATED";
      } else if (currentFilter === "PENDING_SUPPLIER") {
        params.status = "PENDING_SUPPLIER";
      } else if (currentFilter === "RESOLVED") {
        params.status = "RESOLVED";
      }

      if (selectedRegion !== "ALL") params.region = selectedRegion;
      if (selectedCategory !== "ALL") params.category = selectedCategory;

      const res = await api.getTickets(params);
      setTickets(res.items);

      // Select first if none selected
      if (!selectedTicketId && res.items.length > 0) {
        setSelectedTicketId(res.items[0].id);
      } else if (selectedTicketId && !res.items.find((t) => t.id === selectedTicketId) && res.items.length > 0) {
        setSelectedTicketId(res.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      if (showLoadingSpinner) setLoadingList(false);
    }
  };

  // Compute live queue stats
  const loadStats = async () => {
    try {
      const res = await api.getTickets({ page_size: 100 });
      const items = res.items;
      const active = items.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status)).length;
      const atRisk = items.filter(
        (t) => !["RESOLVED", "CLOSED"].includes(t.status) && (t.sla_status === "AT_RISK" || t.sla_status === "BREACHED")
      ).length;
      const escalated = items.filter((t) => t.status === "ESCALATED").length;
      setStats({ active, atRisk, escalated });
    } catch (err) {}
  };

  useEffect(() => {
    loadTickets(true);
  }, [currentFilter, selectedRegion, selectedCategory, searchQuery, currentUser]);

  useEffect(() => {
    loadStats();
  }, []);

  // Real-Time Event Subscription Engine (SSE with adaptive Delta Polling Fallback)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      const streamUrl = api.getEventStreamUrl();
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setIsLiveSync(true);
      };

      const handleEvent = (eventPayload: any, titlePrefix: string) => {
        loadTickets(false);
        loadStats();
        if (selectedTicketId) {
          handleRefreshActive(false);
        }
        setLiveNotification(`${titlePrefix}: ${eventPayload.subject || eventPayload.ticket?.subject || 'Queue updated'}`);
        setTimeout(() => setLiveNotification(null), 6000);
      };

      eventSource.addEventListener("TICKET_CREATED", (e: any) => {
        const data = JSON.parse(e.data);
        handleEvent(data.data, "⚡ New Incident Arrived");
      });

      eventSource.addEventListener("TICKET_UPDATED", (e: any) => {
        const data = JSON.parse(e.data);
        handleEvent(data.data, "🔄 Ticket State Updated");
      });

      eventSource.addEventListener("TICKET_ESCALATED", (e: any) => {
        const data = JSON.parse(e.data);
        handleEvent(data.data, "🚨 Escalated to Manager");
      });

      eventSource.addEventListener("TICKET_TRANSFERRED", (e: any) => {
        const data = JSON.parse(e.data);
        handleEvent(data.data, "⇄ Ownership Transferred");
      });

      eventSource.addEventListener("SIDE_CONVO_UPDATED", (e: any) => {
        const data = JSON.parse(e.data);
        handleEvent(data.data, "✉️ Supplier Reply Received");
      });

      eventSource.onerror = () => {
        setIsLiveSync(false);
        eventSource?.close();

        // Fallback to lightweight 4s delta polling
        pollInterval = setInterval(async () => {
          try {
            const updates = await api.pollEvents(lastEventTimestamp.current);
            if (updates.events && updates.events.length > 0) {
              lastEventTimestamp.current = updates.timestamp;
              loadTickets(false);
              loadStats();
              if (selectedTicketId) handleRefreshActive(false);
            }
          } catch {}
        }, 4000);
      };
    } catch (e) {
      setIsLiveSync(false);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedTicketId]);

  // Load ticket details and context linkage
  useEffect(() => {
    if (!selectedTicketId) {
      setActiveTicket(null);
      setContextLinks(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setLoadingLinks(true);
      try {
        const [detail, links] = await Promise.all([
          api.getTicket(selectedTicketId),
          api.getContextLinks(selectedTicketId),
        ]);
        setActiveTicket(detail);
        setContextLinks(links);
      } catch (err) {
        console.error("Failed to load ticket details", err);
      } finally {
        setLoadingDetail(false);
        setLoadingLinks(false);
      }
    };

    fetchDetail();
  }, [selectedTicketId]);

  const handleRefreshActive = async (showLoading = false) => {
    if (selectedTicketId) {
      if (showLoading) setLoadingDetail(true);
      try {
        const [detail, links] = await Promise.all([
          api.getTicket(selectedTicketId),
          api.getContextLinks(selectedTicketId),
        ]);
        setActiveTicket(detail);
        setContextLinks(links);
        loadTickets(false);
        loadStats();
      } finally {
        if (showLoading) setLoadingDetail(false);
      }
    }
  };

  const handleSimulateInbound = async () => {
    setSimulating(true);
    try {
      const res = await api.simulateInboundTicket("critical");
      if (res.simulated_ticket) {
        setSelectedTicketId(res.simulated_ticket.id);
        setLiveNotification(`⚡ Live Inbound Simulated: ${res.simulated_ticket.ticket_number} (${res.simulated_ticket.tboh_hash})`);
        setTimeout(() => setLiveNotification(null), 7000);
      }
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        activeTab="workspace"
        onTabChange={(tab) => {
          if (tab === "insights") router.push("/insights");
        }}
        stats={stats}
        isLiveSync={isLiveSync}
        onSimulateInbound={handleSimulateInbound}
        simulating={simulating}
      />

      {/* Floating Real-Time Event Toast Notification */}
      {liveNotification && (
        <div className="fixed top-14 right-6 z-50 bg-slate-900 text-white border border-slate-700 shadow-xl rounded-xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 animate-ping">
            ⚡
          </div>
          <p className="text-xs font-medium max-w-sm truncate">{liveNotification}</p>
          <button
            onClick={() => setLiveNotification(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Navigation
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          counts={{
            all: stats.active,
            myTickets: tickets.filter((t) => t.assigned_agent_id === currentUser.id).length,
            atRisk: stats.atRisk,
            escalated: stats.escalated,
            pendingSupplier: tickets.filter((t) => t.status === "PENDING_SUPPLIER").length,
          }}
        />

        {/* Center Triage Queue Table */}
        <div className="w-[480px] xl:w-[540px] flex flex-col shrink-0">
          <ErrorBoundary fallbackTitle="Error loading operational triage queue">
            <TicketQueueTable
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              loading={loadingList}
              currentFilter={currentFilter}
              onResetFilters={() => {
                setCurrentFilter("ALL");
                setSelectedRegion("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Right Split Workspace: Ticket Detail View + Auxiliary Context Engine */}
        <div className="flex-1 flex min-w-0 bg-white">
          {loadingDetail && !activeTicket ? (
            <DetailSkeleton />
          ) : activeTicket ? (
            <>
              {/* Central Detail / Messages */}
              <ErrorBoundary fallbackTitle="Error rendering ticket operational view">
                <TicketDetailView
                  ticket={activeTicket}
                  currentUser={currentUser}
                  onRefresh={() => handleRefreshActive(false)}
                  onOpenEscalate={() => setShowEscalateModal(true)}
                  onOpenTransfer={() => setShowTransferModal(true)}
                  onOpenSideConvo={() => setShowSideConvoModal(true)}
                />
              </ErrorBoundary>

              {/* Auxiliary Context Linkage Right Pane */}
              <div className="w-80 lg:w-96 border-l border-slate-200 bg-slate-50/70 p-3.5 overflow-y-auto shrink-0">
                <ErrorBoundary fallbackTitle="Context linkage engine error">
                  <ContextLinkagePane
                    currentTicket={activeTicket}
                    contextLinks={contextLinks}
                    loading={loadingLinks}
                    onSelectTicket={setSelectedTicketId}
                  />
                </ErrorBoundary>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a ticket from the queue to view full context.
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      {activeTicket && (
        <>
          <EscalationModal
            ticketId={activeTicket.id}
            ticketNumber={activeTicket.ticket_number}
            actorName={currentUser.name}
            actorRole={currentUser.role}
            isOpen={showEscalateModal}
            onClose={() => setShowEscalateModal(false)}
            onSuccess={() => handleRefreshActive(false)}
          />

          <TransferModal
            ticketId={activeTicket.id}
            ticketNumber={activeTicket.ticket_number}
            currentAgentId={activeTicket.assigned_agent_id}
            actorName={currentUser.name}
            actorRole={currentUser.role}
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            onSuccess={() => handleRefreshActive(false)}
          />

          <SideConversationModal
            ticketId={activeTicket.id}
            ticketNumber={activeTicket.ticket_number}
            defaultSubject={activeTicket.subject}
            creatorAgentId={currentUser.id}
            isOpen={showSideConvoModal}
            onClose={() => setShowSideConvoModal(false)}
            onSuccess={() => handleRefreshActive(false)}
          />
        </>
      )}
    </div>
  );
}
