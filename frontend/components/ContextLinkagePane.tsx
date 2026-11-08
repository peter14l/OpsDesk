"use client";

import React from "react";
import { TicketSummary, ContextLinks } from "@/lib/types";
import { SlaBadge } from "@/components/SlaBadge";
import { ContextSkeleton } from "@/components/Skeletons";
import {
  Link2,
  Building2,
  AlertTriangle,
  ExternalLink,
  Layers,
  User,
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
    <div className="space-y-4 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Pane Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Context Linkage
          </h3>
        </div>
        <span className="font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          {currentTicket.tboh_hash}
        </span>
      </div>

      {loading ? (
        <ContextSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Duplicate Investigation Alert Banner */}
          {sameBooking.length > 0 && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Shared Booking Reference</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-950/80 dark:text-amber-200/80">
                Found <strong>{sameBooking.length} other ticket{sameBooking.length > 1 ? "s" : ""}</strong> sharing <span className="font-mono">{currentTicket.tboh_hash}</span>. Check open threads to prevent duplicate supplier contacts.
              </p>
            </div>
          )}

          {/* Section 1: Same Booking Incidents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Linked Booking Cases</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {sameBooking.length} found
              </span>
            </div>

            {sameBooking.length > 0 ? (
              <div className="space-y-1.5">
                {sameBooking.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                        {t.ticket_number}
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                      </span>
                      <SlaBadge deadline={t.sla_deadline} status={t.sla_status} compact />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1 mb-1.5">
                      {t.subject}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>{t.requester_email.split("@")[0]}</span>
                      <span className="text-slate-600 dark:text-slate-300 font-sans font-medium">
                        {t.assigned_agent_name ? t.assigned_agent_name.split(" ")[0] : "Unassigned"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                No duplicate booking inquiries found.
              </p>
            )}
          </div>

          {/* Section 2: Partner Agency Incidents */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Agency Recent Cases</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {sameAgency.length} active
              </span>
            </div>

            {sameAgency.length > 0 ? (
              <div className="space-y-1.5">
                {sameAgency.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{t.ticket_number}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{t.tboh_hash}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{t.subject}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                No recent partner incidents.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
