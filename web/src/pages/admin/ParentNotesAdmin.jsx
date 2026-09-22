import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  HelpCircle,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { parentNoteService } from "../../api/parentNoteService";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

const STATUS_CONFIG = {
  open: {
    label: "Open / Unresolved",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
  in_progress: {
    label: "Under Review",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function ParentNotesAdmin() {
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("in_progress");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const data = await parentNoteService.getAllNotes(params);
      setNotes(data.notes || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load parent communications.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((n) => {
      const subj = n.subject?.toLowerCase() || "";
      const msg = n.message?.toLowerCase() || "";
      const parentName = `${n.parent?.first_name || ""} ${n.parent?.last_name || ""}`.toLowerCase();
      return subj.includes(q) || msg.includes(q) || parentName.includes(q);
    });
  }, [notes, searchQuery]);

  const toggle = (id) => {
    setExpanded((p) => (p === id ? null : id));
    setReplyText("");
    setReplyStatus("in_progress");
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const updated = await parentNoteService.replyToNote(id, {
        message: replyText.trim(),
        status: replyStatus,
      });
      setNotes((prev) => prev.map((n) => (n._id === id ? updated.note : n)));
      setReplyText("");
    } catch {
      alert("Failed to send staff response.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await parentNoteService.updateStatus(id, status);
      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, status } : n)));
    } catch {
      alert("Failed to update status.");
    }
  };

  // Quick stats
  const openCount = notes.filter((n) => n.status === "open").length;
  const inProgressCount = notes.filter((n) => n.status === "in_progress").length;
  const resolvedCount = notes.filter((n) => n.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* ── Executive Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="pointer-events-none absolute right-40 -bottom-10 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                <MessageSquare size={12} />
                Parent Relations & Inquiry Portal
              </span>
              <span className="text-xs text-slate-400">Guardian Communications</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Parent Queries & Service Tickets
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Streamline parent-teacher consultations, administrative queries, and student pastoral
              updates with real-time threaded correspondence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_parent_notes" label="Helpdesk Guide" />
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-50"
            >
              <Clock size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Tickets</span>
            <Inbox size={16} className="text-cyan-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900">{total}</p>
            <span className="text-[11px] font-semibold text-slate-500">all tickets</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Unresolved / Open</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-rose-600">
              {filterStatus === "open" ? total : openCount}
            </p>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              needs attention
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>In Progress</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600">
              {filterStatus === "in_progress" ? total : inProgressCount}
            </p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              under review
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Resolved Tickets</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-emerald-600">
              {filterStatus === "resolved" ? total : resolvedCount}
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              closed
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by subject, message text or parent name..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
          />
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          {[
            ["open", "Open"],
            ["in_progress", "In Progress"],
            ["resolved", "Resolved"],
            ["", "All Inquiries"],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilterStatus(val)}
              className={[
                "rounded-lg px-3 py-1.5 transition",
                filterStatus === val
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Query Cards List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin text-cyan-600 mb-2" />
          <p className="text-xs font-medium">Fetching correspondence threads...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Inbox size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No parent inquiries in this queue</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            All guardian notes in the current view have been processed or none match the criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const isExpanded = expanded === note._id;
            const statusCfg = STATUS_CONFIG[note.status] || STATUS_CONFIG.open;
            const parentName = note.parent
              ? `${note.parent.first_name} ${note.parent.last_name}`
              : "Guardian";
            const replyCount = note.replies?.length || 0;

            return (
              <div
                key={note._id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Header card button */}
                <button
                  type="button"
                  onClick={() => toggle(note._id)}
                  className="w-full text-left p-4 sm:p-5 hover:bg-slate-50/70 transition"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 font-bold text-xs text-white shadow-xs">
                        {note.parent?.first_name?.slice(0, 1) || "P"}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                            {note.subject}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusCfg.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                          {replyCount > 0 && (
                            <span className="rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                              {replyCount} Response{replyCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          From <strong className="text-slate-700">{parentName}</strong> · Logged on{" "}
                          {formatDate(note.createdAt)}
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-2 pt-0.5 leading-relaxed">
                          {note.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <span className="text-xs font-semibold text-cyan-600">
                        {isExpanded ? "Collapse" : "View Thread"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180 text-cyan-600" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Thread Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-5">
                    {/* Parent Contact bar */}
                    {note.parent && (
                      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-700 shadow-xs">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span className="font-bold">{parentName}</span>
                        </div>
                        {note.parent.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={14} className="text-cyan-600" />
                            <span>{note.parent.email}</span>
                          </div>
                        )}
                        {note.parent.mobile && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="text-emerald-600" />
                            <span>{note.parent.mobile}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Full inquiry text */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Guardian Inquiry Statement
                      </p>
                      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {note.message}
                      </p>
                    </div>

                    {/* Attachments if any */}
                    {note.attachments?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Attached Materials ({note.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {note.attachments.map((att, idx) =>
                            att.type === "image" ? (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:border-cyan-400 transition"
                              >
                                <img
                                  src={att.url}
                                  alt={att.filename || "Attachment"}
                                  className="h-16 w-16 object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-700 shadow-xs hover:border-cyan-400 transition"
                              >
                                <FileText size={16} />
                                <span>Download Attachment</span>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Replies stream */}
                    {note.replies?.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Response History ({note.replies.length})
                        </p>
                        <div className="space-y-2">
                          {note.replies.map((reply, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-cyan-900">
                                  {reply.replied_by
                                    ? `${reply.replied_by.first_name} ${reply.replied_by.last_name}`
                                    : "Faculty / Staff Office"}
                                </span>
                                <span className="text-[11px] text-cyan-700">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compose reply box */}
                    {note.status !== "resolved" ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                        <p className="text-xs font-bold text-slate-800">
                          Submit Administrative Response
                        </p>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type response back to parent (this will be visible on their parent portal)..."
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">Update status:</span>
                            <select
                              value={replyStatus}
                              onChange={(e) => setReplyStatus(e.target.value)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none"
                            >
                              <option value="in_progress">Keep In Progress</option>
                              <option value="resolved">Mark as Fully Resolved</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(note._id, "resolved")}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-2 rounded-xl hover:bg-emerald-50 transition"
                            >
                              <CheckCircle2 size={14} />
                              <span>Close Without Reply</span>
                            </button>

                            <button
                              type="button"
                              disabled={sending || !replyText.trim()}
                              onClick={() => handleReply(note._id)}
                              className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50 shadow-xs shadow-cyan-600/20"
                            >
                              {sending ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                              <span>Dispatch Response</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-semibold text-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          <span>This ticket has been addressed and marked as Resolved.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(note._id, "in_progress")}
                          className="rounded-xl border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          Reopen Ticket
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
