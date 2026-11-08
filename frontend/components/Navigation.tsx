"use client";

import React from "react";
import {
  Inbox,
  User,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Globe,
  Tag,
  Download,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";

interface NavigationProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  counts: {
    all: number;
    myTickets: number;
    atRisk: number;
    escalated: number;
    pendingSupplier: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({
  currentFilter,
  onFilterChange,
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
  counts,
}) => {
  const handleExport = (format: "csv" | "json", simulate50k = false) => {
    const url = api.getExportUrl(format, currentFilter, selectedRegion, simulate50k ? 50000 : undefined);
    window.open(url, "_blank");
  };

  const navItems = [
    { id: "ALL", label: "All Triage Queue", icon: Inbox, count: counts.all, color: "text-slate-600" },
    { id: "MY_TICKETS", label: "Assigned to Me", icon: User, count: counts.myTickets, color: "text-sky-600" },
    {
      id: "SLA_RISK",
      label: "SLA At-Risk / Breached",
      icon: AlertTriangle,
      count: counts.atRisk,
      color: "text-amber-600",
      highlight: counts.atRisk > 0,
    },
    {
      id: "ESCALATED",
      label: "Escalated Manager Queue",
      icon: ShieldAlert,
      count: counts.escalated,
      color: "text-rose-600",
      highlight: counts.escalated > 0,
    },
    { id: "PENDING_SUPPLIER", label: "Pending Supplier Convo", icon: Send, count: counts.pendingSupplier, color: "text-indigo-600" },
    { id: "RESOLVED", label: "Resolved & Closed", icon: CheckCircle2, count: null, color: "text-emerald-600" },
  ];

  return (
    <aside className="w-56 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between p-3 select-none shrink-0 transition-colors">
      <div className="space-y-5">
        {/* Main Queues */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
            <span>Operational Views</span>
            <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onFilterChange(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== null && item.count > 0 && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                        item.highlight
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : isActive
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Filters (Sleek Segmented Pill) */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>Region</span>
          </div>
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
            {["ALL", "EMEA", "APAC", "AMER"].map((reg) => (
              <button
                key={reg}
                onClick={() => onRegionChange(reg)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md text-center transition-all ${
                  selectedRegion === reg
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {reg === "ALL" ? "All" : reg}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>Category</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="OVERBOOKING">Hotel Overbooking / Walk</option>
            <option value="REFUND">Refund & Pre-Auth</option>
            <option value="CANCELLATION">Cancellation Waiver</option>
            <option value="AMENDMENT">Name / Date Amendment</option>
            <option value="VOUCHER_ISSUE">Voucher Rate Discrepancy</option>
            <option value="SPECIAL_REQUEST">Special Request / Meal</option>
          </select>
        </div>
      </div>

      {/* Streamlined Data Export Section */}
      <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Download className="w-3 h-3 text-slate-400" />
            Export Queue
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport("csv")}
              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Stream RFC-4180 CSV"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Stream JSON Lines"
            >
              JSON
            </button>
          </div>
        </div>
        <button
          onClick={() => handleExport("csv", true)}
          className="w-full text-left text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1 transition-colors"
          title="Chunked streaming of 50,000 synthetic operations rows with constant memory"
        >
          • Run 50k Streaming Benchmark
        </button>
      </div>
    </aside>
  );
};
