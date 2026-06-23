import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { studentService } from "../../api/studentService";
import { logbookService } from "../../api/logbookService";

const fmt = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

export default function StudentLogbook() {
  const [profile, setProfile] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    studentService.getMyProfile().then((d) => setProfile(d.student)).catch(() => {});
  }, []);

  const loadEntries = useCallback(async () => {
    if (!profile?.class_id?._id || !profile?.section_id?._id) return;
    setLoading(true);
    setError("");
    try {
      const data = await logbookService.getEntriesByDate(
        profile.class_id._id,
        profile.section_id._id,
        date
      );
      setEntries(data.entries || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load logbook.");
    } finally {
      setLoading(false);
    }
  }, [profile, date]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-600">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Daily Logbook</h1>
            <p className="text-sm text-slate-500">
              {profile?.class_id?.name
                ? `${profile.class_id.name} – ${profile.section_id?.name || ""}`
                : "Loading…"}
            </p>
          </div>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          onClick={() => shiftDate(-1)}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          />
          <button
            onClick={() => setDate(new Date().toISOString().slice(0, 10))}
            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-sm font-medium text-slate-500">{fmt(date)}</p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!profile?.class_id?._id && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Class information not found</p>
          <p className="mt-1 text-xs text-slate-400">
            Contact your school administrator to complete your profile.
          </p>
        </div>
      )}

      {profile?.class_id?._id && loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-cyan-500" />
        </div>
      )}

      {profile?.class_id?._id && !loading && entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No logbook entries for this date</p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div>
                <p className="font-bold text-slate-900">{entry.subject}</p>
                <p className="text-xs text-slate-500">
                  {entry.teacher_id
                    ? `By ${entry.teacher_id.first_name} ${entry.teacher_id.last_name}`
                    : ""}
                </p>
              </div>
              <span className="rounded-lg bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                {entry.class_id?.name}
              </span>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <ContentBlock label="Classwork" content={entry.classwork} color="blue" />
              <ContentBlock label="Homework" content={entry.homework} color="amber" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentBlock({ label, content, color }) {
  const colors = {
    blue: "text-blue-700 bg-blue-50",
    amber: "text-amber-700 bg-amber-50",
  };
  if (!content?.text && !content?.media?.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className={`mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${colors[color]}`}>
          {label}
        </p>
        <p className="text-sm italic text-slate-400">Not added</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className={`mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${colors[color]}`}>
        {label}
      </p>
      {content.text && (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{content.text}</p>
      )}
      {content.media?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {content.media.map((m, i) =>
            m.type === "image" ? (
              <a key={i} href={m.url} target="_blank" rel="noreferrer">
                <img
                  src={m.url}
                  alt={m.filename || "media"}
                  className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                />
              </a>
            ) : (
              <a
                key={i}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-medium text-slate-600"
              >
                ▶ Video
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
