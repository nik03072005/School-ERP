import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { logbookService } from "../../api/logbookService";
import { setupService } from "../../api/setupService";

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
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
    if (!confirm("Delete this logbook entry?")) return;
    try {
      await logbookService.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {
      alert("Failed to delete entry.");
    }
  };

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const filteredSections = filters.class_id
    ? sections.filter((s) => s.class_id?._id === filters.class_id || s.class_id === filters.class_id)
    : sections;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daily Logbook</h2>
          <p className="mt-1 text-sm text-slate-500">View classwork and homework entries posted by teachers.</p>
        </div>
        <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => set("date", e.target.value)}
            className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 md:col-span-1"
          />
          <select
            value={filters.class_id}
            onChange={(e) => { set("class_id", e.target.value); set("section_id", ""); }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name || `Grade ${c.grade}`}</option>
            ))}
          </select>
          <select
            value={filters.section_id}
            onChange={(e) => set("section_id", e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="">All Sections</option>
            {filteredSections.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => set("status", e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <BookOpen size={32} className="opacity-30" />
            <p className="text-sm">No logbook entries found for the selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry._id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Date</p>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Class / Section</p>
                      <p className="text-sm font-medium text-slate-800">
                        {entry.class_id?.name || "—"} / {entry.section_id?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Subject</p>
                      <p className="text-sm font-medium text-slate-800">{entry.subject}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Teacher</p>
                      <p className="text-sm text-slate-600">
                        {entry.teacher_id ? `${entry.teacher_id.first_name} ${entry.teacher_id.last_name}` : "—"}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[entry.status]}`}>
                    {entry.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpanded((p) => (p === entry._id ? null : entry._id))}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Expand"
                  >
                    {expanded === entry._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(entry._id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Expanded content */}
                {expanded === entry._id && (
                  <div className="mx-4 mb-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
                    <ContentBlock label="Classwork" content={entry.classwork} />
                    <ContentBlock label="Homework" content={entry.homework} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ContentBlock({ label, content }) {
  if (!content?.text && !content?.media?.length) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm text-slate-400 italic">Not added</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {content.text && <p className="text-sm text-slate-700 whitespace-pre-wrap">{content.text}</p>}
      {content.media?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {content.media.map((m, i) =>
            m.type === "image" ? (
              <a key={i} href={m.url} target="_blank" rel="noreferrer">
                <img src={m.url} alt={m.filename || "media"} className="h-20 w-20 rounded-lg object-cover border border-slate-200" />
              </a>
            ) : (
              <a key={i} href={m.url} target="_blank" rel="noreferrer"
                className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-600">
                Video
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
