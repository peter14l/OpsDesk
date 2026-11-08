"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, PRESET_USERS, CurrentUserSession } from "@/components/Header";
import { InsightsDashboard, ThemeCluster } from "@/lib/types";
import { api } from "@/lib/api";
import { InsightsSkeleton } from "@/components/Skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Building2,
  CheckCircle2,
  ExternalLink,
  Tag,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";

export default function InsightsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUserSession>(PRESET_USERS[3]); // Alex Mercer (Lead)
  const [data, setData] = useState<InsightsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInsightsClusters()
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to load insights", err))
      .finally(() => setLoading(false));
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "SUPPLIER_TECH":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "COMMERCIAL":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "OPERATIONS":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "EMERGENCY":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        activeTab="insights"
        onTabChange={(tab) => {
          if (tab === "workspace") router.push("/");
        }}
        stats={
          data
            ? {
                active: data.total_active_tickets,
                atRisk: data.total_sla_at_risk_or_breached,
                escalated: data.total_escalated,
              }
            : undefined
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Title & Description */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Defect Clustering Engine
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">TBO Operations Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Ops Insights & Upstream Defect Clusters
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Dynamically groups operational tickets across hotel bedbanks, airlines, and B2B agencies into systemic themes. Surfaces chronic supplier CRS errors and rate mismatches before they trigger multi-million dollar penalties.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-colors"
          >
            <span>Print Executive Summary</span>
          </button>
        </div>

        {loading ? (
          <InsightsSkeleton />
        ) : !data ? (
          <div className="p-12 text-center bg-white rounded-xl border border-rose-200 text-xs text-rose-600 space-y-2">
            <p className="font-bold">Failed to load Ops Insights clusters.</p>
            <p className="text-slate-500">Ensure the backend API is reachable at http://localhost:8000.</p>
          </div>
        ) : (
          <>
            {/* Executive AI Briefing Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-indigo-800/50 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Executive Operations Briefing & Root Cause Synthesis
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Weekly Automated Defect Clustering • Real-time TBO Network Ingestion
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-indigo-950/80 text-indigo-200 border border-indigo-700/50 px-2.5 py-1 rounded-md">
                    Analyzed Volume: <strong>{data.total_weekly_tickets} tickets</strong>
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {data.executive_weekly_briefing}
              </p>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-medium">Active Incidents</span>
                  <Layers className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {data.total_active_tickets}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across 4 global distribution regions</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs">
                <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 mb-2 font-semibold">
                  <span>SLA At-Risk / Breached</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
                  {data.total_sla_at_risk_or_breached}
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Driven by imminent check-in proximity</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/20 shadow-xs">
                <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-400 mb-2 font-semibold">
                  <span>Escalated to Managers</span>
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-300 font-mono">
                  {data.total_escalated}
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-1">Requiring supervisor financial waiver</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-medium">Avg Resolution Target</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {data.average_resolution_hours}h
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  Travel-aware safety threshold
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Theme Clusters */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Active Theme Clusters & Root Cause Analysis</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {data.theme_clusters.length} Identified Clusters
                  </span>
                </div>

                <div className="space-y-4">
                  {data.theme_clusters.map((cluster) => (
                    <div
                      key={cluster.tag}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(
                                cluster.category
                              )}`}
                            >
                              {cluster.category}
                            </span>
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{cluster.tag}</span>
                            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                              {cluster.share_percentage}% of Volume
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cluster.label}</h3>
                        </div>

                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <span className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 block">
                              {cluster.ticket_count}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">Tickets</span>
                          </div>

                          <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-md text-right">
                            <span className="text-xs font-bold font-mono text-amber-800 dark:text-amber-300 block">
                              ${cluster.estimated_dispute_value.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Exposure</span>
                          </div>

                          {cluster.sla_breached_count > 0 && (
                            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded-md">
                              <span className="text-xs font-bold font-mono text-rose-700 dark:text-rose-300 block">
                                {cluster.sla_breached_count}
                              </span>
                              <span className="text-[9px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Breached</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Share of Volume Visual Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(cluster.share_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {cluster.share_percentage}%
                        </span>
                      </div>

                      {/* Root Cause & Recommendation */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">Root Cause: </span>
                          <span className="text-slate-600 dark:text-slate-400">{cluster.root_cause_summary}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400">Actionable Remediation: </span>
                          <span className="text-emerald-950 dark:text-emerald-300 font-medium">
                            {cluster.actionable_recommendation}
                          </span>
                        </div>
                      </div>

                      {/* Affected Agencies & Sample Linked Tickets */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Affected Partners:</span>
                          {cluster.top_agencies.length > 0 ? (
                            cluster.top_agencies.map((ag) => (
                              <span key={ag} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                                {ag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Network-wide</span>
                          )}
                        </div>

                        {/* Direct Deep-Links to Sample Tickets */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sample Tickets:</span>
                          {cluster.sample_tickets && cluster.sample_tickets.length > 0 ? (
                            cluster.sample_tickets.slice(0, 3).map((st) => (
                              <button
                                key={st.id}
                                onClick={() => router.push(`/?ticket=${st.id}`)}
                                title={`${st.subject} (${st.status})`}
                                className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                              >
                                <span>{st.ticket_number}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">No active sample tickets</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Supplier Incident Leaderboard */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Top Degraded Suppliers / Chains</span>
                </h2>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Third-party hotel suppliers with the highest volume of operational inquiries and CRS failures in active side-conversations:
                  </p>

                  <div className="space-y-2.5">
                    {data.top_problematic_suppliers.map((sup, idx) => (
                      <div
                        key={sup.name}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{sup.name}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded text-[11px]">
                          {sup.incident_count} Threads
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Jump to Operations Desk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
