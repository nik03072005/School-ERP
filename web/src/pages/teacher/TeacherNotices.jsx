import { useEffect, useState } from "react";
import { ChevronDown, Megaphone, Paperclip } from "lucide-react";
import { noticeService } from "../../api/noticeService";

const TYPE_COLORS = {
  general:   "bg-slate-100 text-slate-600",
  event:     "bg-violet-50 text-violet-700",
  exam:      "bg-amber-50 text-amber-700",
  fee:       "bg-green-50 text-green-700",
  holiday:   "bg-cyan-50 text-cyan-700",
  emergency: "bg-red-50 text-red-700",
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function TeacherNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    noticeService.getNotices()
      .then((d) => setNotices(d.notices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notices</h1>
        <p className="text-sm text-slate-500">School announcements and updates</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center">
          <Megaphone size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No notices at the moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const isOpen = expanded === notice._id;
            const typeColor = TYPE_COLORS[notice.type] || TYPE_COLORS.general;
            return (
              <div
                key={notice._id}
                className={`rounded-2xl border bg-white shadow-sm ${notice.is_pinned ? "border-violet-200 ring-1 ring-violet-100" : "border-slate-200"}`}
              >
                <button
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() => setExpanded((p) => (p === notice._id ? null : notice._id))}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {notice.is_pinned && (
                      <span className="shrink-0 text-xs font-bold text-violet-600 bg-violet-50 rounded-lg px-2 py-0.5">
                        📌 Pinned
                      </span>
                    )}
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${typeColor}`}>
                      {notice.type}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">{notice.title}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                    <span>{notice.published_at ? formatDate(notice.published_at) : ""}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>
                    {notice.attachments?.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Attachments</p>
                        {notice.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-cyan-600 hover:bg-slate-100 transition"
                          >
                            <Paperclip size={13} />
                            {att.filename || att.url.split("/").pop()}
                          </a>
                        ))}
                      </div>
                    )}
                    {notice.expires_at && (
                      <p className="mt-3 text-xs text-slate-400">
                        Expires: {formatDate(notice.expires_at)}
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
