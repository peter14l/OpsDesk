"use client";

import React, { useState } from "react";
import { Mail, Plus, X, Building2, Send } from "lucide-react";
import { api } from "@/lib/api";

interface SideConversationModalProps {
  ticketId: string;
  ticketNumber: string;
  defaultSubject: string;
  creatorAgentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SideConversationModal: React.FC<SideConversationModalProps> = ({
  ticketId,
  ticketNumber,
  defaultSubject,
  creatorAgentId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [subject, setSubject] = useState(`Supplier Inquiry: ${defaultSubject}`);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddRecipient = () => {
    const val = recipientInput.trim();
    if (val && !recipients.includes(val)) {
      setRecipients([...recipients, val]);
      setRecipientInput("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !supplierEmail.trim()) {
      setError("Please provide supplier property/desk name and email address.");
      return;
    }
    if (!message.trim()) {
      setError("Please write the initial supplier communication.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const allRecipients = Array.from(new Set([supplierEmail.trim(), ...recipients]));
      await api.createSideConversation(ticketId, {
        supplier_name: supplierName.trim(),
        supplier_email: supplierEmail.trim(),
        subject: subject.trim(),
        recipient_emails: allRecipients,
        initial_message: message.trim(),
        created_by_agent_id: creatorAgentId,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create supplier side-conversation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">New Supplier Side-Conversation</h3>
              <p className="text-xs text-amber-700 font-mono">Bound to {ticketNumber}</p>
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
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Decoupled Supplier Thread:</span> This creates an isolated third-party thread. The recipient array below survives any future ticket reassignments or transfers.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supplier Desk / Hotel Name *
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Hilton Dubai Al Habtoor Front Desk"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Supplier Email *
              </label>
              <input
                type="email"
                required
                placeholder="reservations@hotel.com"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Explicit Recipient List Array */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Explicit Recipient Array (CC / Additional Stakeholders)
            </label>
            <div className="flex gap-1.5 mb-2">
              <input
                type="email"
                placeholder="duty.manager@hotel.com or contracts@tbo.com"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
                className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Recipient Chips */}
            <div className="flex flex-wrap gap-1 min-h-6">
              {supplierEmail && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-amber-100 text-amber-900 border border-amber-300 rounded-md px-2 py-0.5">
                  Primary: {supplierEmail}
                </span>
              )}
              {recipients.map((rec) => (
                <span
                  key={rec}
                  className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-100 text-slate-800 border border-slate-300 rounded-md px-2 py-0.5"
                >
                  <span>{rec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(rec)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Outbound Supplier Inquiry Message *
            </label>
            <textarea
              rows={4}
              required
              placeholder="State booking reference, guest name, check-in date, and specific operational requirement (e.g., CRS confirmation, waiver request, early check-in)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white"
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
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Sending..." : "Dispatch Supplier Thread"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
