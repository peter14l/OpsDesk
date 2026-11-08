"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Sparkles, X } from "lucide-react";

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTicketParam = searchParams.get("ticket");

  // Active Persona / Role
  const [currentUser, setCurrentUser] = useState<CurrentUserSession>(PRESET_USERS[0]);

  // Queue Filters
  const [currentFilter, setCurrentFilter] = useState("ALL");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(urlTicketParam || null);
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
  const [showContextPane, setShowContextPane] = useState(true);

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

      // Select from URL param if available, otherwise first item or maintain selection
      if (urlTicketParam && res.items.some((t) => t.id === urlTicketParam || t.ticket_number === urlTicketParam)) {
        const found = res.items.find((t) => t.id === urlTicketParam || t.ticket_number === urlTicketParam);
        if (found) setSelectedTicketId(found.id);
      } else if (!selectedTicketId && res.items.length > 0) {
        setSelectedTicketId(res.items[0].id);
      } else if (selectedTicketId && !res.items.some((t) => t.id === selectedTicketId) && res.items.length > 0) {
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

      const handleEvent = async (eventPayload: any, titlePrefix: string) => {
        try {
          await loadTickets(false);
          await loadStats();
          if (selectedTicketId) {
            await handleRefreshActive(false);
          }
        } catch (e) {
          console.warn("Event update warning", e);
        }
        setLiveNotification(`${titlePrefix}: ${eventPayload.subject || eventPayload.ticket?.subject || 'Queue updated'}`);
        setTimeout(() => setLiveNotification(null), 6000);
      };

      eventSource.addEventListener("TICKET_CREATED", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent(data.data, "⚡ New Incident Arrived");
        } catch {}
      });

      eventSource.addEventListener("TICKET_UPDATED", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent(data.data, "🔄 Ticket State Updated");
        } catch {}
      });

      eventSource.addEventListener("TICKET_ESCALATED", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent(data.data, "🚨 Escalated to Manager");
        } catch {}
      });

      eventSource.addEventListener("TICKET_TRANSFERRED", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent(data.data, "⇄ Ownership Transferred");
        } catch {}
      });

      eventSource.addEventListener("SIDE_CONVO_UPDATED", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent(data.data, "✉️ Supplier Reply Received");
        } catch {}
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
              await loadTickets(false);
              await loadStats();
              if (selectedTicketId) await handleRefreshActive(false);
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

    let isMounted = true;
    const fetchDetail = async () => {
      setLoadingDetail(true);
      setLoadingLinks(true);
      try {
        const [detail, links] = await Promise.all([
          api.getTicket(selectedTicketId),
          api.getContextLinks(selectedTicketId),
        ]);
        if (isMounted) {
          setActiveTicket(detail);
          setContextLinks(links);
        }
      } catch (err: any) {
        console.warn("Failed to load ticket details", err);
        if (isMounted) {
          setActiveTicket(null);
          setContextLinks(null);
          // If ticket was not found (404), reset selection and select next available
          if (err?.message && (err.message.includes("404") || err.message.includes("not found"))) {
            setSelectedTicketId(null);
            loadTickets(false);
          }
        }
      } finally {
        if (isMounted) {
          setLoadingDetail(false);
          setLoadingLinks(false);
        }
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedTicketId]);

  const handleRefreshActive = async (showLoading = false) => {
    if (!selectedTicketId) return;
    if (showLoading) setLoadingDetail(true);
    try {
      const [detail, links] = await Promise.all([
        api.getTicket(selectedTicketId),
        api.getContextLinks(selectedTicketId),
      ]);
      setActiveTicket(detail);
      setContextLinks(links);
      await loadTickets(false);
      await loadStats();
    } catch (err: any) {
      console.warn("Failed to refresh active ticket", err);
      // Graceful 404 recovery
      if (err?.message && (err.message.includes("404") || err.message.includes("not found"))) {
        setActiveTicket(null);
        setContextLinks(null);
        setSelectedTicketId(null);
        await loadTickets(false);
      }
    } finally {
      if (showLoading) setLoadingDetail(false);
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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors">
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
        <div className="fixed top-14 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-xl rounded-xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
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
        <div className="w-[360px] lg:w-[400px] flex flex-col shrink-0">
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
        <div className="flex-1 flex min-w-0 bg-white dark:bg-slate-900 transition-colors">
          {loadingDetail && !activeTicket ? (
            <DetailSkeleton />
          ) : activeTicket ? (
            <>
              {/* Central Detail / Messages */}
              <div className="flex-1 flex flex-col min-w-0">
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
              </div>

              {/* Auxiliary Context Linkage Right Pane */}
              {showContextPane && (
                <div className="w-72 xl:w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 overflow-y-auto shrink-0 transition-colors">
                  <div className="flex items-center justify-between pb-1">
                    <button
                      onClick={() => setShowContextPane(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-auto"
                      title="Hide Context Panel"
                    >
                      Hide ✕
                    </button>
                  </div>
                  <ErrorBoundary fallbackTitle="Context linkage engine error">
                    <ContextLinkagePane
                      currentTicket={activeTicket}
                      contextLinks={contextLinks}
                      loading={loadingLinks}
                      onSelectTicket={setSelectedTicketId}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {!showContextPane && (
                <button
                  onClick={() => setShowContextPane(true)}
                  className="w-7 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-mono write-vertical"
                  title="Show Context Linkage Panel"
                >
                  <span className="rotate-90 whitespace-nowrap text-[11px] font-semibold tracking-wider uppercase">
                    Context
                  </span>
                </button>
              )}
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

export default function WorkspacePage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <WorkspaceContent />
    </Suspense>
  );
}
