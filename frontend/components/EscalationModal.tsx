"use client";

import React, { useState } from "react";
import { ShieldAlert, X, AlertOctagon } from "lucide-react";
import { api } from "@/lib/api";

interface EscalationModalProps {
  ticketId: string;
  ticketNumber: string;
  actorName: string;
  actorRole: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  ticketId,
  ticketNumber,
  actorName,
  actorRole,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please select or enter an escalation reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.escalateTicket(ticketId, {
        reason: reason.trim(),
        escalation_notes: notes.trim(),
        actor_name: actorName,
        actor_role: actorRole,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to escalate ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const presetReasons = [
    "Supplier CRS unresponsive / Check-in deadline imminent (<2h)",
    "Hotel overbooked - Guest walked without DMC authorization",
    "VIP Platinum Agency partner dispute / Legal compensation demand",
    "Unresolved rate differential / Double debit at hotel reception",
    "Meal plan or room category mismatch rejected by property duty desk",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Escalate to Escalation Manager</h3>
              <p className="text-xs text-rose-600 font-mono">Ticket {ticketNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 text-xs text-amber-900">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Escalation immediately marks the ticket as <span className="font-bold">ESCALATED</span>, promotes priority to <span className="font-bold">URGENT</span>, reassigns ownership to the on-duty Escalation Manager (Priya Nair), and writes an immutable audit record.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Escalation Trigger / Root Cause *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white"
            >
              <option value="">Select predefined escalation trigger...</option>
              {presetReasons.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Custom Rationale & Immediate Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail hotel contacts reached, financial threshold authorization needed, or specific passenger situation..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-md border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{submitting ? "Escalating..." : "Confirm Escalation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
