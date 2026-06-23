import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react";
import { parentNoteService } from "../../api/parentNoteService";

const STATUS_STYLES = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
};

const STATUS_LABELS = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ParentNotesAdmin() {
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("open");
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
      setError(err?.response?.data?.message || "Failed to load parent notes.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

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
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? updated.note : n))
      );
      setReplyText("");
    } catch {
      alert("Failed to send reply.");
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

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Parent Queries</h2>
          <p className="mt-1 text-sm text-slate-500">View and respond to notes and queries from parents.</p>
        </div>
        <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {total} {total === 1 ? "query" : "queries"}
        </span>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {[["open", "Open"], ["in_progress", "In Progress"], ["resolved", "Resolved"], ["", "All"]].map(
          ([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilterStatus(val)}
              className={[
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                filterStatus === val
                  ? "bg-cyan-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <MessageSquare size={32} className="opacity-30" />
          <p className="text-sm">No queries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Note header */}
              <button
                type="button"
                onClick={() => toggle(note._id)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-2xl transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{note.subject}</p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[note.status]}`}>
                        {STATUS_LABELS[note.status]}
                      </span>
                      {note.replies?.length > 0 && (
                        <span className="text-[10px] text-slate-400">{note.replies.length} repl{note.replies.length > 1 ? "ies" : "y"}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {note.parent ? `${note.parent.first_name} ${note.parent.last_name}` : "—"} · {formatDate(note.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{note.message}</p>
                  </div>
                </div>
              </button>

              {expanded === note._id && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
                  {/* Parent contact */}
                  {note.parent && (
                    <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      <span><span className="font-medium">Email:</span> {note.parent.email || "—"}</span>
                      <span><span className="font-medium">Mobile:</span> {note.parent.mobile || "—"}</span>
                    </div>
                  )}

                  {/* Full message */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Message</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.message}</p>
                  </div>

                  {/* Attachments */}
                  {note.attachments?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Attachments</p>
                      <div className="flex flex-wrap gap-2">
                        {note.attachments.map((a, i) =>
                          a.type === "image" ? (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer">
                              <img src={a.url} alt={a.filename} className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                            </a>
                          ) : (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer"
                              className="flex h-16 w-24 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-cyan-600 font-medium">
                              View File
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Previous replies */}
                  {note.replies?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Replies</p>
                      {note.replies.map((r, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-cyan-50 px-3 py-2">
                          <p className="text-xs font-semibold text-cyan-700">
                            {r.replied_by ? `${r.replied_by.first_name} ${r.replied_by.last_name}` : "Staff"} · {formatDate(r.created_at)}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-700">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  {note.status !== "resolved" && (
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply to the parent…"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        >
                          <option value="in_progress">Mark In Progress</option>
                          <option value="resolved">Mark Resolved</option>
                        </select>
                        <button
                          type="button"
                          disabled={sending || !replyText.trim()}
                          onClick={() => handleReply(note._id)}
                          className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                        >
                          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          Send Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(note._id, "resolved")}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 size={13} /> Resolve without reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
