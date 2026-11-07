"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Agency } from "@/lib/types";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Plane,
  Building,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Check,
  Zap,
} from "lucide-react";

export default function NewTicketPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyId, setAgencyId] = useState("");
  const [tbohHash, setTbohHash] = useState("TBOH-7849102-M");
  const [requesterEmail, setRequesterEmail] = useState("ops@emirateshorizon.com");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OVERBOOKING");
  const [priority, setPriority] = useState("HIGH");
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 5); // 5 hours from now
    return d.toISOString().slice(0, 16);
  });
  const [lcd, setLcd] = useState("");
  const [themeTag, setThemeTag] = useState("supplier-crs-outage");

  // Dynamic Intent Auto-Suggest state
  const [detectedIntent, setDetectedIntent] = useState<{
    predicted_category: string;
    label: string;
    confidence: number;
    suggested_priority: string;
    matched_keywords: string[];
    suggested_tag: string;
  } | null>(null);
  const [intentApplied, setIntentApplied] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAgencies().then((list) => {
      setAgencies(list);
      if (list.length > 0) setAgencyId(list[0].id);
    });
  }, []);

  // Debounced Intent Auto-Suggest when Subject or Description changes
  useEffect(() => {
    const textToClassify = `${subject} ${description}`.trim();
    if (textToClassify.length < 8) {
      setDetectedIntent(null);
      setIntentApplied(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const intent = await api.classifyIntent(textToClassify);
        if (intent && intent.matched_keywords && intent.matched_keywords.length > 0) {
          setDetectedIntent(intent);
        } else {
          setDetectedIntent(null);
        }
      } catch (e) {
        console.error("Intent auto-suggest error", e);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [subject, description]);

  const handleApplyIntent = () => {
    if (!detectedIntent) return;
    setCategory(detectedIntent.predicted_category);
    setPriority(detectedIntent.suggested_priority);
    setThemeTag(detectedIntent.suggested_tag);
    setIntentApplied(true);
  };

  const handleQuickPrompt = (promptSubject: string, promptDesc: string) => {
    setSubject(promptSubject);
    setDescription(promptDesc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId || !tbohHash || !subject || !description) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createTicket({
        tboh_hash: tbohHash.trim().toUpperCase(),
        agency_id: agencyId,
        requester_email: requesterEmail.trim(),
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        check_in_date: new Date(checkInDate).toISOString(),
        last_cancellation_date: lcd ? new Date(lcd).toISOString() : undefined,
        theme_tags: themeTag ? [themeTag] : [],
      });
      setSuccessResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Operations Workspace</span>
        </Link>
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-sky-600 -rotate-45" />
          <span className="font-extrabold text-sm text-slate-900">OpsDesk Dispatch Engine</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Submit B2B Travel Operations Incident
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter hotel/flight booking details. The AI-assisted intent classifier and routing engine will score and dispatch this ticket immediately.
            </p>
          </div>

          {/* Quick Click Prompts to Impress Judges */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              💡 Demo Quick-Fill Scenarios:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Refund status inquiry for booking TBOH-8492041",
                    "Refund hasn't arrived for booking TBOH-8492041 after 10 days. Pre-authorization deduction disputed by client bank."
                  )
                }
                className="text-[11px] font-medium bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 rounded px-2 py-1 transition-colors"
              >
                💸 Refund Delay Prompt
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Hilton Dubai Al Habtoor - Overbooking Walk Emergency",
                    "Guest arrived at hotel; duty receptionist states property is overbooked and walked guest to another hotel without voucher endorsement."
                  )
                }
                className="text-[11px] font-medium bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300 rounded px-2 py-1 transition-colors"
              >
                🏨 Hotel Overbooking Walk
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Medical cancellation penalty waiver request",
                    "Primary traveler hospitalized with cardiac illness. Requesting non-refundable cancellation penalty waiver with hospital discharge summary."
                  )
                }
                className="text-[11px] font-medium bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded px-2 py-1 transition-colors"
              >
                🏥 Medical Cancellation Waiver
              </button>
            </div>
          </div>

          {/* Dynamic Intent Auto-Suggest Alert Box */}
          {detectedIntent && (
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-300 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-sky-800 tracking-wider">
                      Dynamic Intent Auto-Suggest
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Suggested Category: <span className="text-sky-700">{detectedIntent.label}</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right font-mono">
                    <span className="text-xs font-black text-sky-900">
                      {(detectedIntent.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-slate-400 block font-sans">Confidence</span>
                  </div>

                  {!intentApplied ? (
                    <button
                      type="button"
                      onClick={handleApplyIntent}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                      <span>Apply Intent</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Matched Keywords Strip */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Matched Signal Words:</span>
                {detectedIntent.matched_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="font-mono text-[10px] bg-white border border-sky-200 text-sky-800 px-1.5 py-0.2 rounded"
                  >
                    "{kw}"
                  </span>
                ))}
                <span className="text-slate-400 font-mono text-[10px]">
                  • Priority: {detectedIntent.suggested_priority}
                </span>
              </div>
            </div>
          )}

          {successResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm">Ticket Successfully Dispatched!</h3>
              </div>

              <div className="bg-white/80 border border-emerald-200 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Ticket Number:</span>
                  <span className="font-bold text-slate-900">{successResult.ticket.ticket_number}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Booking Hash:</span>
                  <span className="font-bold text-sky-700">{successResult.ticket.tboh_hash}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Dispatched To:</span>
                  <span className="font-bold text-slate-900">
                    {successResult.routed_to.name} (Score: {successResult.routed_to.score}/100)
                  </span>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-950 flex gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Routing Audit: </span>
                  {successResult.routing_reason}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSuccessResult(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Submit Another
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  View in Workspace
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    B2B Travel Agency *
                  </label>
                  <select
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
                  >
                    {agencies.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.tier} • {ag.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Booking Hash (TBOH) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TBOH-7849102-M"
                    value={tbohHash}
                    onChange={(e) => setTbohHash(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:ring-1 focus:ring-sky-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refund hasn't arrived for booking TBOH-8492041 after 10 days"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setIntentApplied(false);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Incident Description & Hotel Response *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the issue: guest names, hotel front desk receptionist remarks, disputed charges, or error codes..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIntentApplied(false);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requester Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="OVERBOOKING">Hotel Overbooking / Relocation</option>
                    <option value="REFUND">Refund / Billing Discrepancy</option>
                    <option value="CANCELLATION">Cancellation Penalty Waiver</option>
                    <option value="AMENDMENT">Name / Date Amendment</option>
                    <option value="VOUCHER_ISSUE">Voucher Rate Discrepancy</option>
                    <option value="SPECIAL_REQUEST">Special Request / Meal Plan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Check-In / Departure *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Cancellation Date (LCD)
                  </label>
                  <input
                    type="datetime-local"
                    value={lcd}
                    onChange={(e) => setLcd(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ops Insights Defect Tag
                </label>
                <select
                  value={themeTag}
                  onChange={(e) => setThemeTag(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="supplier-crs-outage">supplier-crs-outage</option>
                  <option value="voucher-rate-mismatch">voucher-rate-mismatch</option>
                  <option value="breakfast-inclusion-dispute">breakfast-inclusion-dispute</option>
                  <option value="non-refundable-waiver-request">non-refundable-waiver-request</option>
                  <option value="overbooking-walk-relocation">overbooking-walk-relocation</option>
                </select>
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {error}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Evaluating & Routing..." : "Dispatch Ticket"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
