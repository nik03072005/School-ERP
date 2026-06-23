import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { parentNoteService } from "../../api/parentNoteService";

const STATUS_COLORS = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-500",
};

const EMPTY_FORM = { subject: "", message: "" };

export default function StudentQueries() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const d = await parentNoteService.getMyNotes();
      setNotes(d.notes || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setError("Please enter your query message.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await parentNoteService.submitNote(form);
      setSuccess("Query submitted successfully!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadNotes();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit query");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Queries & Notes</h1>
            <p className="text-sm text-slate-500">
              Send queries to teachers or administration
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <Send size={14} />
          New Query
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* New query form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-violet-200 bg-violet-50/30 p-5 shadow-sm space-y-3"
        >
          <p className="text-sm font-semibold text-slate-700">New Query</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Subject (optional)
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              placeholder="e.g. Homework clarification"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
              placeholder="Describe your query or concern…"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? "Sending…" : "Send Query"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Queries list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-violet-500" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 py-20">
          <MessageSquare size={32} className="text-slate-300" />
          <p className="text-slate-500">No queries submitted yet</p>
          <p className="text-xs text-slate-400">Use "New Query" to send a message to the school</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOpen = expanded === note._id;
            return (
              <div
                key={note._id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded((p) => (p === note._id ? null : note._id))}
                  className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          STATUS_COLORS[note.status] || STATUS_COLORS.open
                        }`}
                      >
                        {(note.status || "open").replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(note.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-900">
                      {note.subject || "Query"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{note.message}</p>
                  </div>
                  <span className="mt-1 shrink-0 text-slate-400">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {/* Original message */}
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Your Query
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{note.message}</p>
                    </div>

                    {/* Reply */}
                    {note.reply ? (
                      <div className="rounded-xl bg-violet-50 p-4">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                          Response from School
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.reply}</p>
                        {note.replied_at && (
                          <p className="mt-2 text-xs text-slate-400">
                            {new Date(note.replied_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-400">
                        Awaiting response from school administration…
                      </p>
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
