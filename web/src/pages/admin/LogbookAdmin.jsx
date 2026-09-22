import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Trash2, Calendar, User, FileText, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { logbookService } from "../../api/logbookService";
import { setupService } from "../../api/setupService";

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  draft: "bg-amber-50 text-amber-700 border border-amber-200",
};

export default function LogbookAdmin() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [filters, setFilters] = useState({
    date: today(),
    class_id: "",
    section_id: "",
    subject: "",
    status: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const data = await logbookService.getAllEntries(params);
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load logbook entries.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([setupService.listClasses(), setupService.listSections()]).then(
      ([cls, sec]) => {
        setClasses(cls.classes || []);
        setSections(sec.sections || []);
      }
    );
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this logbook entry?")) return;
    try {
      await logbookService.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {
      alert("Failed to delete logbook entry.");
    }
  };

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const filteredSections = filters.class_id
    ? sections.filter((s) => s.class_id?._id === filters.class_id || s.class_id === filters.class_id)
    : sections;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <BookOpen size={15} />
            Academic Daily Journal
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Daily Logbook</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Review teacher curriculum delivery, daily topics covered, assignments, and lesson attachments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-cyan-50 border border-cyan-200 px-3.5 py-1.5 text-xs font-bold text-cyan-800">
            {total} {total === 1 ? "Entry" : "Entries"} Logged
          </span>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Log Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => set("date", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Class Standard</label>
            <select
              value={filters.class_id}
              onChange={(e) => {
                set("class_id", e.target.value);
                set("section_id", "");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name || `Grade ${c.grade}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Section</label>
            <select
              value={filters.section_id}
              onChange={(e) => set("section_id", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">All Sections</option>
              {filteredSections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Status</label>
            <select
              value={filters.status}
              onChange={(e) => set("status", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft Only</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* ── Log Entries Stream ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
            <p className="mt-2 text-xs font-bold text-slate-500">Loading daily logbook entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BookOpen size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">No logbook entries found for the selected criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const isExp = expanded === entry._id;
              const teacherName = entry.teacher_id
                ? `${entry.teacher_id.first_name} ${entry.teacher_id.last_name}`.trim()
                : "Unassigned Teacher";

              return (
                <div key={entry._id} className="transition hover:bg-slate-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 font-bold text-cyan-800 text-xs">
                        {entry.subject?.[0] || "B"}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">{entry.subject}</h3>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {entry.class_id?.name || "—"} &bull; {entry.section_id?.name || "—"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              STATUS_COLORS[entry.status] || STATUS_COLORS.draft
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Educator: <strong>{teacherName}</strong> &bull; Date:{" "}
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpanded(isExp ? null : entry._id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <span>{isExp ? "Hide Content" : "View Details"}</span>
                        {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        className="rounded-xl p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {isExp && (
                    <div className="mx-5 mb-5 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:grid-cols-2">
                      <ContentCard title="Classwork & Topics Covered" content={entry.classwork} />
                      <ContentCard title="Assigned Homework & Practice" content={entry.homework} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ContentCard({ title, content }) {
  if (!content?.text && !content?.media?.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          {title}
        </span>
        <p className="text-xs text-slate-400 italic">No notes or entries logged.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
        {title}
      </span>
      {content.text && (
        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{content.text}</p>
      )}

      {content.media?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {content.media.map((m, i) =>
            m.type === "image" ? (
              <a key={i} href={m.url} target="_blank" rel="noreferrer" className="group block">
                <img
                  src={m.url}
                  alt={m.filename || "attachment"}
                  className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200 group-hover:scale-105 transition"
                />
              </a>
            ) : (
              <a
                key={i}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
              >
                Video Clip
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
