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
    <div className="flex flex-col min-h-screen bg-slate-50">
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
              <span className="bg-indigo-100 text-indigo-800 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Theme Clustering Engine
              </span>
              <span className="text-xs text-slate-500 font-mono">TBO Operations Intelligence</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Ops Insights & Upstream Defect Clusters
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl mt-1 leading-relaxed">
              Dynamically groups operational tickets across hotel bedbanks, airlines, and B2B agencies into systemic themes. Surfaces chronic supplier CRS errors and rate mismatches before they trigger multi-million dollar penalties.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 rounded-lg shadow-xs"
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
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Active Incidents</span>
                  <Layers className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {data.total_active_tickets}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Across 4 global distribution regions</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
                <div className="flex items-center justify-between text-xs text-rose-700 mb-2 font-semibold">
                  <span>SLA At-Risk / Breached</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-700 font-mono">
                  {data.total_sla_at_risk_or_breached}
                </div>
                <div className="text-[11px] text-rose-600 mt-1">Driven by imminent check-in proximity</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
                <div className="flex items-center justify-between text-xs text-purple-800 mb-2 font-semibold">
                  <span>Escalated to Managers</span>
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-900 font-mono">
                  {data.total_escalated}
                </div>
                <div className="text-[11px] text-purple-700 mt-1">Requiring supervisor financial waiver</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Avg Resolution Target</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
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
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Active Theme Clusters & Root Cause Analysis</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    {data.theme_clusters.length} Identified Clusters
                  </span>
                </div>

                <div className="space-y-4">
                  {data.theme_clusters.map((cluster) => (
                    <div
                      key={cluster.tag}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(
                                cluster.category
                              )}`}
                            >
                              {cluster.category}
                            </span>
                            <span className="text-xs font-mono text-slate-400">#{cluster.tag}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{cluster.label}</h3>
                        </div>

                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <span className="text-base font-extrabold font-mono text-slate-900 block">
                              {cluster.ticket_count}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">Incidents</span>
                          </div>
                          {cluster.sla_breached_count > 0 && (
                            <div className="bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                              <span className="text-xs font-bold font-mono text-rose-700 block">
                                {cluster.sla_breached_count}
                              </span>
                              <span className="text-[9px] text-rose-600 uppercase font-semibold">Breached</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Root Cause & Recommendation */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800">Root Cause: </span>
                          <span className="text-slate-600">{cluster.root_cause_summary}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="font-bold text-emerald-800">Actionable Remediation: </span>
                          <span className="text-emerald-950 font-medium">
                            {cluster.actionable_recommendation}
                          </span>
                        </div>
                      </div>

                      {/* Affected Agencies & Sample Linked Tickets */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <span className="font-semibold text-slate-700">Affected Partners:</span>
                          {cluster.top_agencies.map((ag) => (
                            <span key={ag} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              {ag}
                            </span>
                          ))}
                        </div>

                        {/* Direct Deep-Links to Sample Tickets */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600">Sample Cases:</span>
                          {cluster.sample_tickets?.slice(0, 2).map((st) => (
                            <button
                              key={st.id}
                              onClick={() => router.push(`/?ticket=${st.id}`)}
                              className="text-[11px] font-mono font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                            >
                              <span>{st.ticket_number}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Supplier Incident Leaderboard */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Top Degraded Suppliers / Chains</span>
                </h2>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Third-party hotel suppliers with the highest volume of operational inquiries and CRS failures in active side-conversations:
                  </p>

                  <div className="space-y-2.5">
                    {data.top_problematic_suppliers.map((sup, idx) => (
                      <div
                        key={sup.name}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{sup.name}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                          {sup.incident_count} Threads
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
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
