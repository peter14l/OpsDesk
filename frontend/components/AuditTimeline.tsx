"use client";

import React from "react";
import { AuditLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  History,
  ShieldAlert,
  ArrowRightLeft,
  Mail,
  CheckCircle,
  FileText,
  Cpu,
} from "lucide-react";

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No audit log history recorded yet.
      </div>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ESCALATED":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case "TRANSFERRED":
        return <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />;
      case "SIDE_CONVO_CREATED":
      case "SIDE_CONVO_REPLY":
        return <Mail className="w-3.5 h-3.5 text-amber-600" />;
      case "STATUS_CHANGED":
      case "RESOLVED":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "CREATED":
      case "ROUTED":
        return <Cpu className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
        <History className="w-3.5 h-3.5 text-slate-500" />
        <span>Audit Timeline & State Transitions</span>
      </div>
      <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
        {logs.map((log) => (
          <div key={log.id} className="relative group">
            {/* Dot/Icon */}
            <div className="absolute -left-[19px] top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
              {getActionIcon(log.action_type)}
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span>{log.actor_name}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-200 text-slate-700 rounded uppercase">
                    {log.actor_role}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(log.created_at)}
                </span>
              </div>

              <div className="text-xs font-medium text-slate-700">
                <span className="font-semibold text-slate-900">{log.action_type}</span>
                {log.previous_state && log.new_state && (
                  <span className="text-slate-500 text-[11px] block mt-0.5 font-mono">
                    {log.previous_state} → <span className="text-sky-700 font-bold">{log.new_state}</span>
                  </span>
                )}
              </div>

              {log.reason && (
                <p className="text-[11px] text-slate-600 bg-white/70 p-1.5 rounded border border-slate-200/60 leading-relaxed font-sans">
                  {log.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
