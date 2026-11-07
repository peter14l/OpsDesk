"use client";

import React from "react";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import {
  ShieldAlert,
  Plane,
  LayoutDashboard,
  BarChart3,
  UserCheck,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region: string;
}

export const PRESET_USERS: CurrentUserSession[] = [
  {
    id: "usr_agent_sarah",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@tbo.com",
    role: "AGENT",
    region: "EMEA",
  },
  {
    id: "usr_agent_rajesh",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@tbo.com",
    role: "AGENT",
    region: "APAC",
  },
  {
    id: "usr_mgr_priya",
    name: "Priya Nair",
    email: "priya.nair@tbo.com",
    role: "ESCALATION_MANAGER",
    region: "GLOBAL",
  },
  {
    id: "usr_lead_alex",
    name: "Alex Mercer",
    email: "alex.mercer@tbo.com",
    role: "LEAD",
    region: "GLOBAL",
  },
  {
    id: "usr_req_ahmed",
    name: "Ahmed Al-Khatib (Emirates Horizon)",
    email: "requester.dxb@emirateshorizon.com",
    role: "REQUESTER",
    region: "EMEA",
  },
];

interface HeaderProps {
  currentUser: CurrentUserSession;
  onUserChange: (user: CurrentUserSession) => void;
  activeTab: "workspace" | "insights";
  onTabChange: (tab: "workspace" | "insights") => void;
  stats?: {
    active: number;
    atRisk: number;
    escalated: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  onTabChange,
  stats,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm flex items-center justify-between">
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm font-bold tracking-tight">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Ops<span className="text-sky-600">Desk</span>
              </span>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                TBO 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">B2B Travel Operations Engine</p>
          </div>
        </div>

        {/* View Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => onTabChange("workspace")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "workspace"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
            Operations Workspace
          </button>
          <button
            onClick={() => onTabChange("insights")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "insights"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            Ops Insights & Clusters
          </button>
        </nav>
      </div>

      {/* Right Controls: Live Stats, New Ticket, & Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Live Triage Counters */}
        {stats && (
          <div className="hidden lg:flex items-center gap-3 text-xs font-medium border-r border-slate-200 pr-4">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Active:</span>
              <span className="font-bold text-slate-900">{stats.active}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>SLA At-Risk:</span>
              <span className="font-bold">{stats.atRisk}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Escalated:</span>
              <span className="font-bold">{stats.escalated}</span>
            </div>
          </div>
        )}

        {/* Demo Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <div className="flex items-center gap-1.5 pl-2 text-slate-500 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-medium hidden sm:inline">Role Switcher:</span>
          </div>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = PRESET_USERS.find((u) => u.id === e.target.value);
              if (selected) onUserChange(selected);
            }}
            className="text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            {PRESET_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.role === "ESCALATION_MANAGER" ? "⚡ " : ""}
                {user.role}: {user.name} ({user.region})
              </option>
            ))}
          </select>
        </div>

        {/* Create Ticket Trigger */}
        <Link
          href="/new-ticket"
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </Link>
      </div>
    </header>
  );
};
