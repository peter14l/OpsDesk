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
  const handleExport = (format: "csv" | "json") => {
    const url = api.getExportUrl(format, currentFilter, selectedRegion);
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-3 select-none">
      <div className="space-y-5">
        {/* Main Queues */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
            <span>Operational Views</span>
            <Filter className="w-3 h-3" />
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
                      ? "bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== null && item.count > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        item.highlight
                          ? "bg-rose-100 text-rose-700 animate-pulse"
                          : isActive
                          ? "bg-sky-200/80 text-sky-900"
                          : "bg-slate-100 text-slate-600"
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

        {/* Region Filters */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>Region</span>
          </div>
          <div className="grid grid-cols-2 gap-1 px-1">
            {["ALL", "EMEA", "APAC", "AMER"].map((reg) => (
              <button
                key={reg}
                onClick={() => onRegionChange(reg)}
                className={`py-1 text-xs font-medium rounded-md border text-center transition-all ${
                  selectedRegion === reg
                    ? "bg-slate-900 text-white border-slate-900 font-bold shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {reg === "ALL" ? "All Regions" : reg}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Issue Category</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

      {/* Uncapped Enterprise Export */}
      <div className="pt-4 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold mb-1">
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Uncapped Stream Export</span>
          </div>
          <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
            RFC-4180 compliant raw data stream for operations audits and BI ingest.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleExport("csv")}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[11px] font-bold py-1 px-2 rounded text-center shadow-xs transition-colors"
            >
              CSV Stream
            </button>
            <button
              onClick={() => handleExport("json")}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[11px] font-bold py-1 px-2 rounded text-center shadow-xs transition-colors"
            >
              JSON Stream
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
