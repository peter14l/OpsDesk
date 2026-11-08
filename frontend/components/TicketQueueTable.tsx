"use client";

import React, { useState } from "react";
import { TicketSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SlaBadge } from "@/components/SlaBadge";
import { TableSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import {
  Search,
  Copy,
  Check,
  Clock,
  User,
  LayoutList,
  Table as TableIcon,
  Building2,
  AlertCircle,
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
  currentFilter,
  onResetFilters,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"feed" | "table">("feed");

  const handleCopyHash = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getPriorityDot = (p: string) => {
    switch (p) {
      case "URGENT":
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Urgent Priority" />;
      case "HIGH":
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="High Priority" />;
      case "MEDIUM":
        return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Medium Priority" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" title="Low Priority" />;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "ESCALATED":
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            ESCALATED
          </span>
        );
      case "PENDING_SUPPLIER":
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            SUPPLIER
          </span>
        );
      case "OPEN":
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            OPEN
          </span>
        );
      case "RESOLVED":
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 h-full transition-colors">
      {/* Search & Layout View Bar */}
      <div className="p-3 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-slate-900/90">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets, TBOH, subject, partner..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800 dark:text-slate-100 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden xl:inline">
            {tickets.length} incidents
          </span>
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-0.5">
            <button
              onClick={() => setViewMode("feed")}
              className={`p-1 rounded transition-colors ${
                viewMode === "feed"
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Feed View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Queue Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3">
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
        ) : viewMode === "feed" ? (
          /* High-Density Incident Feed (Clean, Spacious, Uncluttered) */
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {tickets.map((t) => {
              const isSelected = selectedTicketId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className={`p-3.5 cursor-pointer transition-all border-l-2 ${
                    isSelected
                      ? "bg-blue-50/40 dark:bg-blue-950/30 border-l-blue-600 shadow-2xs"
                      : "border-l-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {/* Top Line: Ticket ID, TBOH, and SLA Badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {getPriorityDot(t.priority)}
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {t.ticket_number}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{t.tboh_hash}</span>
                        <button
                          onClick={(e) => handleCopyHash(e, t.tboh_hash)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded"
                          title="Copy Booking Hash"
                        >
                          {copiedHash === t.tboh_hash ? (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <SlaBadge deadline={t.sla_deadline} status={t.sla_status} compact />
                  </div>

                  {/* Middle Line: Subject */}
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-2 leading-snug">
                    {t.subject}
                  </p>

                  {/* Bottom Line: Metadata Chips */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                        {t.agency_name || "Agency"}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">{t.region}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(t.status)}
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="truncate max-w-[90px]">
                          {t.assigned_agent_name ? t.assigned_agent_name.split(" ")[0] : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Ticket</th>
                  <th className="py-2.5 px-3">Partner</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/60 dark:bg-blue-950/40 font-medium text-slate-900 dark:text-slate-100 border-l-2 border-l-blue-600"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{t.ticket_number}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{t.tboh_hash}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[110px]">{t.agency_name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{t.region}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{t.subject}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(t.check_in_date)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        {t.assigned_agent_name || "Unassigned"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <SlaBadge deadline={t.sla_deadline} status={t.sla_status} compact />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
