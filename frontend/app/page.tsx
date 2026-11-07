"use client";

import React, { useState, useEffect } from "react";
import { Header, PRESET_USERS, CurrentUserSession } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { TicketQueueTable } from "@/components/TicketQueueTable";
import { TicketDetailView } from "@/components/TicketDetailView";
import { ContextLinkagePane } from "@/components/ContextLinkagePane";
import { EscalationModal } from "@/components/EscalationModal";
import { TransferModal } from "@/components/TransferModal";
import { SideConversationModal } from "@/components/SideConversationModal";
import { TicketSummary, TicketDetail, ContextLinks } from "@/lib/types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

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

  // Modals
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSideConvoModal, setShowSideConvoModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({ active: 0, atRisk: 0, escalated: 0 });

  // Load ticket list
  const loadTickets = async () => {
    try {
      setLoadingList(true);
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
      setLoadingList(false);
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
    loadTickets();
  }, [currentFilter, selectedRegion, selectedCategory, searchQuery, currentUser]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const handleRefreshActive = async () => {
    if (selectedTicketId) {
      const detail = await api.getTicket(selectedTicketId);
      setActiveTicket(detail);
      loadTickets();
      loadStats();
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
      />

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
          <TicketQueueTable
            tickets={tickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={loadingList}
          />
        </div>

        {/* Right Split Workspace: Ticket Detail View + Auxiliary Context Engine */}
        <div className="flex-1 flex min-w-0 bg-white">
          {activeTicket ? (
            <>
              {/* Central Detail / Messages */}
              <TicketDetailView
                ticket={activeTicket}
                currentUser={currentUser}
                onRefresh={handleRefreshActive}
                onOpenEscalate={() => setShowEscalateModal(true)}
                onOpenTransfer={() => setShowTransferModal(true)}
                onOpenSideConvo={() => setShowSideConvoModal(true)}
              />

              {/* Auxiliary Context Linkage Right Pane */}
              <div className="w-80 lg:w-96 border-l border-slate-200 bg-slate-50/70 p-3.5 overflow-y-auto shrink-0">
                <ContextLinkagePane
                  currentTicket={activeTicket}
                  contextLinks={contextLinks}
                  loading={loadingLinks}
                  onSelectTicket={setSelectedTicketId}
                />
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
            onSuccess={handleRefreshActive}
          />

          <TransferModal
            ticketId={activeTicket.id}
            ticketNumber={activeTicket.ticket_number}
            currentAgentId={activeTicket.assigned_agent_id}
            actorName={currentUser.name}
            actorRole={currentUser.role}
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            onSuccess={handleRefreshActive}
          />

          <SideConversationModal
            ticketId={activeTicket.id}
            ticketNumber={activeTicket.ticket_number}
            defaultSubject={activeTicket.subject}
            creatorAgentId={currentUser.id}
            isOpen={showSideConvoModal}
            onClose={() => setShowSideConvoModal(false)}
            onSuccess={handleRefreshActive}
          />
        </>
      )}
    </div>
  );
}
