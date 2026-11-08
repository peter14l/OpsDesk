"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";

interface SlaBadgeProps {
  deadline: string;
  status?: string;
  compact?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ deadline, status, compact = false }) => {
  const [slaInfo, setSlaInfo] = useState(() => formatTimeRemaining(deadline));

  useEffect(() => {
    setSlaInfo(formatTimeRemaining(deadline));
    const interval = setInterval(() => {
      setSlaInfo(formatTimeRemaining(deadline));
    }, 10000); // 10s live countdown tick
    return () => clearInterval(interval);
  }, [deadline]);

  if (slaInfo.isBreached || status === "BREACHED") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-semibold rounded-md px-2 py-0.5 text-[11px] bg-rose-50 text-rose-700 border border-rose-200 ${
          compact ? "text-[10px] px-1.5 py-0" : ""
        }`}
        title={`SLA Breached! Overdue: ${slaInfo.text}`}
      >
        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
        <span>Breached {slaInfo.text}</span>
      </span>
    );
  }

  if (slaInfo.isAtRisk || status === "AT_RISK") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-semibold rounded-md px-2 py-0.5 text-[11px] bg-amber-50 text-amber-800 border border-amber-200 ${
          compact ? "text-[10px] px-1.5 py-0" : ""
        }`}
        title={`SLA At Risk! Check-in/LCD approaching: ${slaInfo.text} left`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
        <span>{slaInfo.text} left</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded-md px-2 py-0.5 text-[11px] bg-slate-50 text-slate-700 border border-slate-200 ${
        compact ? "text-[10px] px-1.5 py-0" : ""
      }`}
      title={`SLA On Track: ${slaInfo.text} remaining`}
    >
      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
      <span>{slaInfo.text}</span>
    </span>
  );
};
