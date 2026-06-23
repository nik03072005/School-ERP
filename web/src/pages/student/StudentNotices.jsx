import { useEffect, useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { noticeService } from "../../api/noticeService";

const TYPE_OPTIONS = ["general", "academic", "event", "urgent", "holiday"];

const TYPE_COLORS = {
  general: "bg-slate-100 text-slate-600",
  academic: "bg-blue-100 text-blue-700",
  event: "bg-violet-100 text-violet-700",
  urgent: "bg-red-100 text-red-700",
  holiday: "bg-green-100 text-green-700",
};

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    noticeService
      .getNotices(params)
      .then((d) => setNotices(d.notices || []))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load notices"))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  const pinned = notices.filter((n) => n.is_pinned);
  const regular = notices.filter((n) => !n.is_pinned);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
            <Megaphone size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notices</h1>
            <p className="text-sm text-slate-500">{notices.length} active notices</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter("")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === "" ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                typeFilter === t
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-20">
          <Megaphone size={32} className="text-slate-300" />
          <p className="text-slate-500">No notices found</p>
        </div>
      ) : (
        <>
          {/* Pinned notices */}
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-600">
                <Pin size={12} /> Pinned
              </p>
              {pinned.map((n) => (
                <NoticeCard
                  key={n._id}
                  notice={n}
                  expanded={expanded === n._id}
                  onToggle={() => setExpanded((p) => (p === n._id ? null : n._id))}
                  pinned
                />
              ))}
            </div>
          )}

          {/* Regular notices */}
          {regular.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">All Notices</p>
              )}
              {regular.map((n) => (
                <NoticeCard
                  key={n._id}
                  notice={n}
                  expanded={expanded === n._id}
                  onToggle={() => setExpanded((p) => (p === n._id ? null : n._id))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoticeCard({ notice: n, expanded, onToggle, pinned }) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition ${
        pinned ? "border-amber-200" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                TYPE_COLORS[n.type] || TYPE_COLORS.general
              }`}
            >
              {n.type}
            </span>
            {n.is_pinned && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                Pinned
              </span>
            )}
            <span className="text-xs text-slate-400">
              {new Date(n.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="mt-1 font-semibold text-slate-900">{n.title}</p>
        </div>
        <span className="mt-1 shrink-0 text-slate-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
          {n.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {n.attachments.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  📎 {a.filename || `Attachment ${i + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
