"use client";

import React from "react";
import { TicketSummary, ContextLinks } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SlaBadge } from "@/components/SlaBadge";
import {
  Link2,
  Building,
  AlertCircle,
  ExternalLink,
  Layers,
  ChevronRight,
} from "lucide-react";

interface ContextLinkagePaneProps {
  currentTicket: TicketSummary;
  contextLinks: ContextLinks | null;
  loading: boolean;
  onSelectTicket: (ticketId: string) => void;
}

export const ContextLinkagePane: React.FC<ContextLinkagePaneProps> = ({
  currentTicket,
  contextLinks,
  loading,
  onSelectTicket,
}) => {
  const sameBooking = contextLinks?.same_booking_tickets || [];
  const sameAgency = contextLinks?.same_agency_tickets || [];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Link2 className="w-4 h-4 text-sky-600" />
          <span>Real-Time Context Linkage Engine</span>
        </div>
        <span className="font-mono text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">
          {currentTicket.tboh_hash}
        </span>
      </div>

      {loading ? (
        <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
          Correlating booking hash & agency context...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Section 1: Same Booking Hash (TBOH) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>Identical Booking Incidents</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  sameBooking.length > 0
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {sameBooking.length} Linked
              </span>
            </div>

            {sameBooking.length > 0 ? (
              <div className="space-y-2">
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-[11px] text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <span className="font-bold">Duplicate Investigation Alert!</span> Another ticket exists for booking <span className="font-mono font-bold">{currentTicket.tboh_hash}</span>. Coordinate with assigned agents before contacting supplier.
                  </p>
                </div>

                <div className="space-y-1.5">
                  {sameBooking.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-sky-400 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-sky-700 group-hover:underline flex items-center gap-1">
                          {t.ticket_number}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <SlaBadge deadline={t.sla_deadline} status={t.sla_status} compact />
                      </div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-1 mb-1">
                        {t.subject}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Requester: {t.requester_email.split("@")[0]}</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {t.assigned_agent_name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-[11px] text-slate-500">
                No duplicate tickets found for this booking reference.
              </div>
            )}
          </div>

          {/* Section 2: Same B2B Agency History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recent Agency Activity</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                {sameAgency.length} Recent
              </span>
            </div>

            <div className="space-y-1.5">
              {sameAgency.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-xs transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span>{t.ticket_number}</span>
                      <span>•</span>
                      <span>{formatDate(t.created_at)}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 truncate group-hover:text-slate-900">
                      {t.subject}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
