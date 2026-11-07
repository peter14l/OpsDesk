"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, X, Check, Users } from "lucide-react";
import { User } from "@/lib/types";
import { api } from "@/lib/api";

interface TransferModalProps {
  ticketId: string;
  ticketNumber: string;
  currentAgentId?: string;
  actorName: string;
  actorRole: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  ticketId,
  ticketNumber,
  currentAgentId,
  actorName,
  actorRole,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [agents, setAgents] = useState<User[]>([]);
  const [targetAgentId, setTargetAgentId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getUsers().then((users) => {
        const eligible = users.filter(
          (u) =>
            u.id !== currentAgentId &&
            ["AGENT", "ESCALATION_MANAGER", "LEAD"].includes(u.role)
        );
        setAgents(eligible);
        if (eligible.length > 0) setTargetAgentId(eligible[0].id);
      });
    }
  }, [isOpen, currentAgentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAgentId) {
      setError("Please select a target agent.");
      return;
    }
    if (!reason.trim()) {
      setError("Please specify the transfer reason for the audit trail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.transferTicket(ticketId, {
        target_agent_id: targetAgentId,
        reason: reason.trim(),
        actor_name: actorName,
        actor_role: actorRole,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to transfer ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Transfer Ticket Ownership</h3>
              <p className="text-xs text-indigo-700 font-mono">Ticket {ticketNumber}</p>
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
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-950 leading-relaxed">
            <p className="font-semibold text-sky-900 mb-0.5">🔒 Recipient Retention Guarantee</p>
            All active supplier side-conversations and explicit recipient arrays are bound directly to the thread and will remain 100% intact for the new assignee.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Target Operations Agent *</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {agents.map((agent) => (
                <label
                  key={agent.id}
                  onClick={() => setTargetAgentId(agent.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    targetAgentId === agent.id
                      ? "bg-indigo-50/80 border-indigo-500 text-indigo-950 font-semibold ring-1 ring-indigo-500"
                      : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        targetAgentId === agent.id
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {targetAgentId === agent.id && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div>
                      <p className="font-bold">{agent.full_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {agent.role} • {agent.region} • Active Load: {agent.active_ticket_count}/{agent.max_concurrency}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      agent.availability_status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {agent.availability_status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Transfer Reason & Handover Brief *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., EMEA to APAC shift handover; specialized language requirement; workload rebalancing..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{submitting ? "Transferring..." : "Complete Handover"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
