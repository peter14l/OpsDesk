"use client";

import React from "react";
import { TicketSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SlaBadge } from "@/components/SlaBadge";
import { TableSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import {
  Clock,
  Search,
  Building,
  User,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface TicketQueueTableProps {
  tickets: TicketSummary[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  currentFilter?: string;
  onResetFilters?: () => void;
}

export const TicketQueueTable: React.FC<TicketQueueTableProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  searchQuery,
  onSearchChange,
  loading,
}) => {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  const handleCopyHash = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-1.5 py-0.5 rounded text-[10px]">URGENT</span>;
      case "HIGH":
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 font-semibold px-1.5 py-0.5 rounded text-[10px]">HIGH</span>;
      case "MEDIUM":
        return <span className="bg-sky-50 text-sky-800 border border-sky-200 font-medium px-1.5 py-0.5 rounded text-[10px]">MEDIUM</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded text-[10px]">LOW</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "ESCALATED":
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">ESCALATED</span>;
      case "PENDING_SUPPLIER":
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">PENDING SUPPLIER</span>;
      case "OPEN":
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 font-medium px-2 py-0.5 rounded-full text-[10px]">OPEN</span>;
      case "RESOLVED":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium px-2 py-0.5 rounded-full text-[10px]">RESOLVED</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full text-[10px]">{s}</span>;
    }
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return null;
    const styles: Record<string, string> = {
      PLATINUM: "bg-purple-50 text-purple-700 border-purple-300 font-bold",
      GOLD: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
      SILVER: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
    };
    return (
      <span className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded border ${styles[tier] || "bg-slate-50 text-slate-500"}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-200">
      {/* Search & Stats Bar */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, TBOH booking hash, subject, or requester..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{tickets.length}</span> tickets
        </div>
      </div>

      {/* Dense Table View */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-2">
            <TableSkeleton rows={7} />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            type={
              searchQuery
                ? "search"
                : currentFilter === "ESCALATED"
                ? "escalated"
                : currentFilter === "SLA_RISK"
                ? "at_risk"
                : currentFilter === "PENDING_SUPPLIER"
                ? "side_convo"
                : "queue"
            }
            query={searchQuery}
            onResetFilters={() => {
              if (searchQuery) onSearchChange("");
              else if (onResetFilters) onResetFilters();
            }}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 z-10 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Ticket / TBOH</th>
                <th className="py-2.5 px-3">Agency Partner</th>
                <th className="py-2.5 px-3">Operational Subject</th>
                <th className="py-2.5 px-3">Check-In Urgency</th>
                <th className="py-2.5 px-3">Assigned Agent</th>
                <th className="py-2.5 px-3">Dynamic SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-sky-50/90 font-medium text-slate-900 border-l-4 border-l-sky-600"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {/* Ticket & TBOH */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono font-bold text-sky-700">{t.ticket_number}</span>
                        {getPriorityBadge(t.priority)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <span className="font-semibold text-slate-700">{t.tboh_hash}</span>
                        <button
                          onClick={(e) => handleCopyHash(e, t.tboh_hash)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Copy Booking Hash"
                        >
                          {copiedHash === t.tboh_hash ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Agency */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-slate-900 truncate max-w-[130px] block" title={t.agency_name}>
                          {t.agency_name || "Agency"}
                        </span>
                        {getTierBadge(t.agency_tier)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{t.region}</span>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-2 px-3 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {getStatusBadge(t.status)}
                        <span className="text-[10px] font-mono text-slate-500 uppercase px-1 py-0.2 bg-slate-100 rounded">
                          {t.category}
                        </span>
                      </div>
                      <p className="truncate text-slate-800 font-medium text-xs" title={t.subject}>
                        {t.subject}
                      </p>
                    </td>

                    {/* Check-In Urgency */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(t.check_in_date)}</span>
                      </div>
                      {t.last_cancellation_date && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          LCD: {formatDate(t.last_cancellation_date)}
                        </div>
                      )}
                    </td>

                    {/* Agent & Routing Score */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[100px]">{t.assigned_agent_name || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        <span>Score: {t.routing_score.toFixed(0)}</span>
                      </div>
                    </td>

                    {/* SLA Badge */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <SlaBadge deadline={t.sla_deadline} status={t.sla_status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
