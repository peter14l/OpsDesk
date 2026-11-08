"use client";

import React, { useState, useEffect } from "react";
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
  Moon,
  Sun,
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
  isLiveSync?: boolean;
  onSimulateInbound?: () => void;
  simulating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  onTabChange,
  isLiveSync = true,
  onSimulateInbound,
  simulating = false,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkStored = localStorage.getItem("opsdesk_theme") === "dark";
    if (
      isDarkStored ||
      (!("opsdesk_theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("opsdesk_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("opsdesk_theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-5 py-2.5 flex items-center justify-between transition-colors">
      {/* Brand & Workspace Mode Switcher */}
      <div className="flex items-center gap-7">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs font-semibold">
            <Plane className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Ops<span className="text-blue-600">Desk</span>
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono">
                TBO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">B2B Travel Operations</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => onTabChange("workspace")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "workspace"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Operations Desk
          </button>
          <button
            onClick={() => onTabChange("insights")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "insights"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Ops Insights
          </button>
        </nav>
      </div>

      {/* Right Controls: Real-Time Sync, Dark Toggle, Simulation Trigger, Role Switcher, New Incident */}
      <div className="flex items-center gap-3">
        {/* Real-Time Live Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isLiveSync ? "bg-emerald-500" : "bg-amber-500"}`}></span>
          <span className="font-medium hidden sm:inline">
            {isLiveSync ? "Live" : "Polling"}
          </span>
        </div>

        {/* Dark Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Live Simulation Trigger (Discreet Demo Trigger) */}
        {onSimulateInbound && (
          <button
            onClick={onSimulateInbound}
            disabled={simulating}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700"
            title="Inject simulated emergency hotel check-in walk to test live queue updates"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>{simulating ? "Simulating..." : "Simulate"}</span>
          </button>
        )}

        {/* Demo Persona Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg px-2 py-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = PRESET_USERS.find((u) => u.id === e.target.value);
              if (selected) onUserChange(selected);
            }}
            className="text-xs font-medium bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            {PRESET_USERS.map((user) => (
              <option key={user.id} value={user.id} className="dark:bg-slate-900 dark:text-slate-200">
                {user.role === "ESCALATION_MANAGER" ? "[Escalation Mgr] " : `[${user.role}] `}
                {user.name} ({user.region})
              </option>
            ))}
          </select>
        </div>

        {/* New Ticket CTA */}
        <Link
          href="/new-ticket"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Incident</span>
        </Link>
      </div>
    </header>
  );
};
