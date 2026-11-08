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

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "SUPPLIER_TECH":
        return <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">TECH</span>;
      case "COMMERCIAL":
        return <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">COMMERCIAL</span>;
      case "OPERATIONS":
        return <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">OPS</span>;
      case "EMERGENCY":
        return <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">EMERGENCY</span>;
      default:
        return <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{cat}</span>;
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
        {/* Clean Page Title */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Ops Insights & Upstream Defect Clusters</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated systemic clustering across hotel bedbanks, airlines, and CRS integrations.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <span>Print Report</span>
          </button>
        </div>

        {loading ? (
          <InsightsSkeleton />
        ) : !data ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-600 space-y-2">
            <p className="font-bold">Failed to load Ops Insights clusters.</p>
            <p className="text-slate-500">Ensure the backend API is reachable at http://localhost:8000.</p>
          </div>
        ) : (
          <>
            {/* Executive AI Briefing Banner */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-indigo-500/20 border border-indigo-400/30 rounded-md text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Executive Operations Briefing & Root Cause Synthesis
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Analyzed Volume: <strong className="text-white">{data.total_weekly_tickets} tickets</strong>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {data.executive_weekly_briefing}
              </p>
            </div>

            {/* Top Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium">Active Incidents</span>
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {data.total_active_tickets}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Across 4 global regions</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium">At-Risk / Breached</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {data.total_sla_at_risk_or_breached}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Imminent check-in proximity</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium">Manager Escalations</span>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {data.total_escalated}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Requiring supervisor waiver</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium">Avg SLA Window</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {data.average_resolution_hours}h
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dynamic travel margin target</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Theme Clusters */}
              <div className="lg:col-span-2 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Active Theme Clusters & Root Cause Analysis</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    {data.theme_clusters.length} Clusters
                  </span>
                </div>

                <div className="space-y-3">
                  {data.theme_clusters.map((cluster) => (
                    <div
                      key={cluster.tag}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3 transition-colors"
                    >
                      {/* Cluster Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getCategoryBadge(cluster.category)}
                            <span className="text-xs font-mono text-slate-400">#{cluster.tag}</span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {cluster.share_percentage}% Volume
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cluster.label}</h3>
                        </div>

                        <div className="flex items-center gap-2 text-right shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 block">
                              {cluster.ticket_count}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">Tickets</span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-right">
                            <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 block">
                              ${cluster.estimated_dispute_value.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase">Risk</span>
                          </div>
                        </div>
                      </div>

                      {/* Slim Volume Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1 rounded-full"
                            style={{ width: `${Math.min(cluster.share_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {cluster.share_percentage}%
                        </span>
                      </div>

                      {/* Root Cause & Remediation Callout */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-3 space-y-1.5 text-xs">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">Root Cause: </strong>
                          <span className="text-slate-600 dark:text-slate-400">{cluster.root_cause_summary}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <strong className="text-emerald-700 dark:text-emerald-400">Actionable Fix: </strong>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {cluster.actionable_recommendation}
                          </span>
                        </div>
                      </div>

                      {/* Partners & Sample Tickets Deep-Links */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Partners:</span>
                          {cluster.top_agencies.length > 0 ? (
                            cluster.top_agencies.map((ag) => (
                              <span key={ag} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                {ag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">Network-wide</span>
                          )}
                        </div>

                        {/* Interactive Deep-Links */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Sample:</span>
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
                            <span className="text-slate-400 text-[10px]">None active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Supplier Incident Leaderboard */}
              <div className="space-y-3.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Degraded Supplier Chains</span>
                </h2>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3.5 transition-colors">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Suppliers generating the highest dispute volume and CRS failures in active threads:
                  </p>

                  <div className="space-y-2">
                    {data.top_problematic_suppliers.map((sup, idx) => (
                      <div
                        key={sup.name}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center text-[9px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sup.name}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded text-[10px]">
                          {sup.incident_count} Threads
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Back to Operations Desk</span>
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
