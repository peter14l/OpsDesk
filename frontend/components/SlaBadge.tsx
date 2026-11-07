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
        className={`inline-flex items-center gap-1 font-mono font-bold tracking-tight rounded-full px-2 py-0.5 text-xs bg-rose-100 text-rose-800 border border-rose-300 animate-pulse ${
          compact ? "text-[11px]" : ""
        }`}
        title={`SLA Breached! Overdue: ${slaInfo.text}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>BREACHED {slaInfo.text}</span>
      </span>
    );
  }

  if (slaInfo.isAtRisk || status === "AT_RISK") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-semibold rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-900 border border-amber-300 ${
          compact ? "text-[11px]" : ""
        }`}
        title={`SLA At Risk! Check-in/LCD approaching: ${slaInfo.text} left`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
        <span>AT RISK ({slaInfo.text})</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded-full px-2 py-0.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 ${
        compact ? "text-[11px]" : ""
      }`}
      title={`SLA On Track: ${slaInfo.text} remaining`}
    >
      <Clock className="w-3.5 h-3.5 text-emerald-600" />
      <span>{slaInfo.text}</span>
    </span>
  );
};
