"use client";

import React from "react";
import {
  Inbox,
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  Send,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type: "queue" | "search" | "escalated" | "at_risk" | "side_convo" | "resolved";
  query?: string;
  onResetFilters?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  query,
  onResetFilters,
}) => {
  switch (type) {
    case "search":
      return (
        <div className="p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              No matching tickets found
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              No operational tickets match the search query <span className="font-semibold text-slate-700">"{query}"</span>.
            </p>
          </div>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Search Query</span>
            </button>
          )}
        </div>
      );

    case "escalated":
      return (
        <div className="p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Escalation Queue is Clear
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              No tickets are currently escalated to managers. All operations are progressing within standard SLA parameters.
            </p>
          </div>
        </div>
      );

    case "at_risk":
      return (
        <div className="p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              All Travel SLAs On Track
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Zero bookings are at risk of check-in breach or LCD penalty.
            </p>
          </div>
        </div>
      );

    case "side_convo":
      return (
        <div className="p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              No Pending Supplier Side-Conversations
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              No tickets are currently blocked awaiting external third-party hotel or airline response.
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              No tickets in this operational queue
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              There are no active operational records matching the selected filter criteria.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            {onResetFilters && (
              <button
                onClick={onResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
            <Link
              href="/new-ticket"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Create New Ticket</span>
            </Link>
          </div>
        </div>
      );
  }
};
