"use client";

import React, { useState } from "react";
import { TicketDetail, TicketPriority, TicketStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SlaBadge } from "@/components/SlaBadge";
import { AuditTimeline } from "@/components/AuditTimeline";
import { api } from "@/lib/api";
import {
  MessageSquare,
  ShieldAlert,
  ArrowRightLeft,
  Mail,
  Lock,
  Send,
  Building,
  Plane,
  Sparkles,
  Info,
  Clock,
  CheckCircle,
} from "lucide-react";

interface TicketDetailViewProps {
  ticket: TicketDetail;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRefresh: () => void;
  onOpenEscalate: () => void;
  onOpenTransfer: () => void;
  onOpenSideConvo: () => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({
  ticket,
  currentUser,
  onRefresh,
  onOpenEscalate,
  onOpenTransfer,
  onOpenSideConvo,
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "side_convos" | "audit">("timeline");
  const [messageBody, setMessageBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sideConvoReply, setSideConvoReply] = useState<{ [convoId: string]: string }>({});
  const [replyingSideConvo, setReplyingSideConvo] = useState(false);
  const [reEvaluating, setReEvaluating] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    setSendingMessage(true);
    try {
      await api.addMessage(ticket.id, {
        sender_id: currentUser.id,
        sender_email: currentUser.email,
        sender_role: currentUser.role,
        message_type: isInternalNote ? "INTERNAL_NOTE" : "PUBLIC",
        body: messageBody.trim(),
      });
      setMessageBody("");
      onRefresh();
    } catch (err) {
      console.error("Failed to post message", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendSupplierReply = async (convoId: string, isIncoming = false) => {
    const text = sideConvoReply[convoId];
    if (!text || !text.trim()) return;

    setReplyingSideConvo(true);
    try {
      await api.addSideConversationMessage(convoId, {
        sender_email: isIncoming ? undefined : currentUser.email,
        is_supplier_incoming: isIncoming,
        body: text.trim(),
      });
      setSideConvoReply({ ...sideConvoReply, [convoId]: "" });
      onRefresh();
    } catch (err) {
      console.error("Failed to add side convo reply", err);
    } finally {
      setReplyingSideConvo(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await api.updateTicket(ticket.id, { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    try {
      await api.updateTicket(ticket.id, { priority: newPriority });
      onRefresh();
    } catch (err) {
      console.error("Failed to update priority", err);
    }
  };

  const handleReEvaluateRouting = async () => {
    setReEvaluating(true);
    try {
      await api.evaluateRouting(ticket.id, true);
      onRefresh();
    } catch (err) {
      console.error("Failed to re-evaluate routing", err);
    } finally {
      setReEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Dense Action Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Quick Status & Priority Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="NEW">NEW</option>
              <option value="OPEN">OPEN</option>
              <option value="PENDING_SUPPLIER">PENDING SUPPLIER</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Priority:</span>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
        </div>

        {/* Right: Operational Actions (Escalate, Transfer, Side-Convo, Re-Route) */}
        <div className="flex items-center gap-2">
          {/* Re-evaluate routing */}
          <button
            onClick={handleReEvaluateRouting}
            disabled={reEvaluating}
            title="Re-run multi-dimensional routing engine scoring"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
          >
            <Sparkles className={`w-4 h-4 text-amber-500 ${reEvaluating ? "animate-spin" : ""}`} />
          </button>

          {/* New Supplier Side-Convo */}
          <button
            onClick={onOpenSideConvo}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>Supplier Thread</span>
            {ticket.side_conversations?.length > 0 && (
              <span className="ml-1 px-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                {ticket.side_conversations.length}
              </span>
            )}
          </button>

          {/* Transfer */}
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transfer</span>
          </button>

          {/* First-Class Escalation Button */}
          <button
            onClick={onOpenEscalate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Escalate to Manager</span>
          </button>
        </div>
      </div>

      {/* Ticket Header & Metadata Summary Card */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-extrabold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                {ticket.ticket_number}
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Ref: {ticket.tboh_hash}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Opened {formatDate(ticket.created_at)}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {ticket.subject}
            </h2>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <SlaBadge deadline={ticket.sla_deadline} status={ticket.sla_status} />
            <span className="text-[10px] font-mono text-slate-400">
              SLA Target: {formatDate(ticket.sla_deadline)}
            </span>
          </div>
        </div>

        {/* Travel Metadata Strip */}
        <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-mono">Agency</span>
              <span className="font-bold text-slate-900 truncate block">
                {ticket.agency?.name || "Agency"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Check-In Date</span>
              <span className="font-bold text-slate-900">{formatDate(ticket.check_in_date)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Assigned Agent</span>
              <span className="font-bold text-slate-900 truncate block">
                {ticket.assigned_agent?.full_name || "Unassigned"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Routing Score</span>
              <span className="font-bold text-purple-900">{ticket.routing_score.toFixed(1)}/100</span>
            </div>
          </div>
        </div>

        {/* Routing Reason banner */}
        {ticket.routing_reason && (
          <div className="flex items-start gap-2 bg-sky-50/60 border border-sky-100 rounded-md p-2 text-[11px] text-sky-950 font-sans">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Automated Routing Rationale:</span> {ticket.routing_reason}
            </p>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 px-4 flex items-center gap-4 bg-slate-50/40">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "timeline"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Customer & Internal Notes ({ticket.messages?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("side_convos")}
          className={`flex items-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "side_convos"
              ? "border-amber-600 text-amber-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-amber-600" />
          <span>Supplier Side-Conversations ({ticket.side_conversations?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-indigo-600 text-indigo-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>Audit History ({ticket.audit_logs?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: Customer Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {ticket.messages?.map((msg) => {
              const isNote = msg.message_type === "INTERNAL_NOTE";
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border p-3.5 space-y-2 transition-all ${
                    isNote
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isNote
                            ? "bg-amber-500 text-white"
                            : "bg-sky-600 text-white"
                        }`}
                      >
                        {isNote ? <Lock className="w-3 h-3" /> : msg.sender_role[0]}
                      </div>
                      <span className="font-bold text-slate-900">{msg.sender_email}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          isNote
                            ? "bg-amber-200/80 text-amber-900 font-bold"
                            : "bg-slate-100 text-slate-600 font-semibold"
                        }`}
                      >
                        {isNote ? "Private Internal Note" : msg.sender_role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans pl-8">
                    {msg.body}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Supplier Side-Conversations */}
        {activeTab === "side_convos" && (
          <div className="space-y-6">
            {(!ticket.side_conversations || ticket.side_conversations.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <Mail className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  No supplier side-conversations launched yet for this ticket.
                </p>
                <button
                  onClick={onOpenSideConvo}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Launch Supplier Thread
                </button>
              </div>
            ) : (
              ticket.side_conversations.map((convo) => (
                <div
                  key={convo.id}
                  className="border border-amber-300 rounded-xl bg-amber-50/30 overflow-hidden shadow-xs"
                >
                  {/* Convo Header with Preserved Recipients */}
                  <div className="bg-amber-100/70 border-b border-amber-200 p-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Supplier Thread
                        </span>
                        <h4 className="font-bold text-xs text-amber-950">{convo.subject}</h4>
                      </div>
                      <p className="text-[11px] text-amber-900 font-medium">
                        Supplier: <span className="font-bold">{convo.supplier_name}</span> ({convo.supplier_email})
                      </p>
                      {/* Preserved Recipient Chips */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[10px] font-bold text-amber-800">Preserved Recipients:</span>
                        {convo.recipient_emails.map((r) => (
                          <span
                            key={r}
                            className="bg-white/80 border border-amber-300 text-amber-900 text-[10px] font-mono px-1.5 py-0.2 rounded"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        convo.status === "WAITING_ON_SUPPLIER"
                          ? "bg-amber-200 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {convo.status}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="p-3.5 space-y-3">
                    {convo.messages?.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg text-xs leading-relaxed ${
                          m.is_supplier_incoming
                            ? "bg-white border border-slate-300 text-slate-900"
                            : "bg-amber-100/80 border border-amber-200 text-amber-950 font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span className="font-bold text-slate-800">
                            {m.is_supplier_incoming ? `📥 Supplier [${m.sender_email}]` : `📤 Outbound Desk [${m.sender_email}]`}
                          </span>
                          <span className="text-slate-400">{formatDate(m.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))}

                    {/* Quick Reply Box */}
                    <div className="pt-2 border-t border-amber-200/80 space-y-2">
                      <textarea
                        rows={2}
                        value={sideConvoReply[convo.id] || ""}
                        onChange={(e) =>
                          setSideConvoReply({ ...sideConvoReply, [convo.id]: e.target.value })
                        }
                        placeholder="Reply to supplier and all bound recipients..."
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleSendSupplierReply(convo.id, true)}
                          disabled={replyingSideConvo}
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold underline"
                        >
                          + Simulate Inbound Supplier Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendSupplierReply(convo.id, false)}
                          disabled={replyingSideConvo || !sideConvoReply[convo.id]?.trim()}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-md flex items-center gap-1 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Visual Audit Timeline */}
        {activeTab === "audit" && (
          <AuditTimeline logs={ticket.audit_logs || []} />
        )}
      </div>

      {/* Bottom Message Composer for Timeline */}
      {activeTab === "timeline" && (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInternalNote(false)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                  !isInternalNote
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                Public Customer Reply
              </button>
              <button
                type="button"
                onClick={() => setIsInternalNote(true)}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                  isInternalNote
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Internal Operations Note</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Replying as: {currentUser.name}
            </span>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              required
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={
                isInternalNote
                  ? "Write an internal note (visible only to operations agents and leads)..."
                  : "Write a public reply to the B2B travel agency partner..."
              }
              className={`flex-1 text-xs bg-white border rounded-lg p-2.5 font-medium focus:outline-none focus:ring-2 ${
                isInternalNote
                  ? "border-amber-300 focus:ring-amber-500"
                  : "border-slate-300 focus:ring-sky-500"
              }`}
            />
            <button
              type="submit"
              disabled={sendingMessage || !messageBody.trim()}
              className={`px-4 text-xs font-bold rounded-lg text-white shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors ${
                isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingMessage ? "Posting..." : "Send"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
