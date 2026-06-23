import { useCallback, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Loader2, Save } from "lucide-react";
import { logbookService } from "../../api/logbookService";
import { setupService } from "../../api/setupService";
import MediaUpload from "../../components/MediaUpload";

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  class_id: "",
  section_id: "",
  subject: "",
  date: today(),
  classwork: { text: "", media: [] },
  homework: { text: "", media: [] },
  status: "published",
};

export default function TeacherLogbook() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([setupService.listClasses(), setupService.listSections()]).then(
      ([cls, sec]) => {
        setClasses(cls.classes || []);
        setSections(sec.sections || []);
      }
    );
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const data = await logbookService.getMyEntries({ limit: 10 });
      setRecentEntries(data.entries || []);
    } catch {
      // silent
    }
  };

  const filteredSections = form.class_id
    ? sections.filter((s) => s.class_id?._id === form.class_id || s.class_id === form.class_id)
    : sections;

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setContentField = (block, key, val) =>
    setForm((f) => ({ ...f, [block]: { ...f[block], [key]: val } }));

  const addMedia = (block, mediaItem) =>
    setForm((f) => ({
      ...f,
      [block]: { ...f[block], media: [...f[block].media, { url: mediaItem.url, type: mediaItem.type, filename: mediaItem.filename }] },
    }));

  const removeMedia = (block, idx) =>
    setForm((f) => ({
      ...f,
      [block]: { ...f[block], media: f[block].media.filter((_, i) => i !== idx) },
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id || !form.section_id || !form.subject || !form.date) {
      setError("Please fill in class, section, subject, and date.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await logbookService.upsertEntry(form);
      setSuccess(true);
      loadRecent();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Daily Logbook</h2>
        <p className="mt-1 text-sm text-slate-500">Post today's classwork and homework for your class.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Form — takes 3 cols */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-slate-700">Entry Details</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Class</label>
                <select
                  value={form.class_id}
                  onChange={(e) => { setField("class_id", e.target.value); setField("section_id", ""); }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name || `Grade ${c.grade}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Section</label>
                <select
                  value={form.section_id}
                  onChange={(e) => setField("section_id", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                >
                  <option value="">Select section</option>
                  {filteredSections.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* Classwork */}
          <EntryBlock
            label="Classwork"
            content={form.classwork}
            onTextChange={(v) => setContentField("classwork", "text", v)}
            onMediaUpload={(m) => addMedia("classwork", m)}
            onMediaRemove={(i) => removeMedia("classwork", i)}
          />

          {/* Homework */}
          <EntryBlock
            label="Homework"
            content={form.homework}
            onTextChange={(v) => setContentField("homework", "text", v)}
            onMediaUpload={(m) => addMedia("homework", m)}
            onMediaRemove={(i) => removeMedia("homework", i)}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex items-center gap-3">
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <option value="published">Publish immediately</option>
              <option value="draft">Save as draft</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving…" : "Save Entry"}
            </button>

            {success && (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <CheckCircle2 size={15} /> Saved!
              </span>
            )}
          </div>
        </form>

        {/* Recent entries — takes 2 cols */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">Recent Entries</p>
            {recentEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <BookOpen size={28} className="opacity-30" />
                <p className="text-xs">No entries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEntries.map((e) => (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() =>
                      setForm({
                        class_id: e.class_id?._id || e.class_id,
                        section_id: e.section_id?._id || e.section_id,
                        subject: e.subject,
                        date: new Date(e.date).toISOString().slice(0, 10),
                        classwork: e.classwork || { text: "", media: [] },
                        homework: e.homework || { text: "", media: [] },
                        status: e.status,
                      })
                    }
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 truncate">{e.subject}</span>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${e.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {e.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {e.class_id?.name || "—"} / {e.section_id?.name || "—"} ·{" "}
                      {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryBlock({ label, content, onTextChange, onMediaUpload, onMediaRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <textarea
        value={content.text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Describe today's ${label.toLowerCase()}…`}
        rows={3}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
      />

      {content.media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.media.map((m, i) => (
            <div key={i} className="relative">
              {m.type === "image" ? (
                <img src={m.url} alt={m.filename} className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                  Video
                </div>
              )}
              <button
                type="button"
                onClick={() => onMediaRemove(i)}
                className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow text-slate-400 hover:text-red-500 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <MediaUpload
        label={`Add ${label} Media`}
        onUpload={onMediaUpload}
        accept="image/*,video/*"
      />
    </div>
  );
}
