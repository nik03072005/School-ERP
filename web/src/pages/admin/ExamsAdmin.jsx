import { useEffect, useState } from "react";
import { Plus, Trash2, X, BookMarked, ChevronDown, ChevronUp } from "lucide-react";
import { createExam, deleteExam, getExams, updateExam } from "../../api/examService";
import { setupService } from "../../api/setupService";

const EXAM_TYPES = [
  { value: "unit_test", label: "Unit Test" },
  { value: "mid_term", label: "Mid Term" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
];

const TYPE_COLORS = {
  unit_test: "bg-purple-50 text-purple-700",
  mid_term: "bg-amber-50 text-amber-700",
  final: "bg-rose-50 text-rose-700",
  other: "bg-slate-100 text-slate-600",
};

const emptyForm = {
  name: "",
  exam_type: "mid_term",
  class_id: "",
  section_id: "",
  academic_year: "",
  subjects: [{ subject: "", max_marks: 100, exam_date: "" }],
};

export default function ExamsAdmin() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
  }, []);

  useEffect(() => {
    loadExams();
  }, [filterClass]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const params = filterClass ? { class_id: filterClass } : {};
      const { exams } = await getExams(params);
      setExams(exams);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (classId) => {
    if (!classId) { setSections([]); return; }
    const { sections } = await setupService.listSections({ class_id: classId });
    setSections(sections || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSections([]);
    setShowModal(true);
  };

  const openEdit = async (exam) => {
    setEditing(exam._id);
    setForm({
      name: exam.name,
      exam_type: exam.exam_type,
      class_id: exam.class_id?._id || exam.class_id,
      section_id: exam.section_id?._id || exam.section_id || "",
      academic_year: exam.academic_year || "",
      subjects: exam.subjects?.length
        ? exam.subjects.map((s) => ({
            subject: s.subject,
            max_marks: s.max_marks,
            exam_date: s.exam_date ? s.exam_date.slice(0, 10) : "",
          }))
        : [{ subject: "", max_marks: 100, exam_date: "" }],
    });
    await loadSections(exam.class_id?._id || exam.class_id);
    setShowModal(true);
  };

  const handleClassChange = async (classId) => {
    setForm((f) => ({ ...f, class_id: classId, section_id: "" }));
    await loadSections(classId);
  };

  const addSubject = () =>
    setForm((f) => ({ ...f, subjects: [...f.subjects, { subject: "", max_marks: 100, exam_date: "" }] }));

  const removeSubject = (i) =>
    setForm((f) => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));

  const updateSubject = (i, key, val) =>
    setForm((f) => {
      const subjects = [...f.subjects];
      subjects[i] = { ...subjects[i], [key]: val };
      return { ...f, subjects };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.class_id) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        section_id: form.section_id || undefined,
        subjects: form.subjects
          .filter((s) => s.subject.trim())
          .map((s) => ({ ...s, exam_date: s.exam_date || undefined })),
      };
      if (editing) {
        await updateExam(editing, payload);
      } else {
        await createExam(payload);
      }
      setShowModal(false);
      loadExams();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this exam schedule?")) return;
    try {
      await deleteExam(id);
      loadExams();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exam Schedules</h1>
          <p className="text-sm text-slate-500">Manage exams and subject configurations</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
        >
          <Plus size={16} /> New Exam
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <BookMarked size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No exam schedules yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4"
                onClick={() => setExpanded((p) => (p === exam._id ? null : exam._id))}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${TYPE_COLORS[exam.exam_type] || TYPE_COLORS.other}`}>
                    {exam.exam_type?.replace("_", " ")}
                  </span>
                  <span className="font-semibold text-slate-900 truncate">{exam.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-slate-400 text-xs">
                  <span>{exam.class_id?.name}</span>
                  {exam.section_id && <span>· {exam.section_id?.name}</span>}
                  {exam.academic_year && <span>· {exam.academic_year}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${exam.is_published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {exam.is_published ? "Published" : "Draft"}
                  </span>
                  {expanded === exam._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {expanded === exam._id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Subjects ({exam.subjects?.length || 0})
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {exam.subjects?.map((s, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-800">{s.subject}</p>
                        <p className="text-xs text-slate-500">Max: {s.max_marks} marks</p>
                        {s.exam_date && (
                          <p className="text-xs text-slate-400">
                            {new Date(s.exam_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEdit(exam)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exam._id)}
                      className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? "Edit Exam" : "New Exam Schedule"}
              </h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Exam Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Mid Term Exam 2024-25"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Exam Type</label>
                  <select
                    value={form.exam_type}
                    onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))}
                    className="input w-full"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Academic Year</label>
                  <input
                    value={form.academic_year}
                    onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                    placeholder="e.g. 2024-25"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select
                    required
                    value={form.class_id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Section (optional)</label>
                  <select
                    value={form.section_id}
                    onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="">All sections</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Subjects</label>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                  >
                    <Plus size={12} /> Add Subject
                  </button>
                </div>
                <div className="space-y-2">
                  {form.subjects.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={s.subject}
                        onChange={(e) => updateSubject(i, "subject", e.target.value)}
                        placeholder="Subject name"
                        className="input flex-1"
                      />
                      <input
                        type="number"
                        value={s.max_marks}
                        onChange={(e) => updateSubject(i, "max_marks", Number(e.target.value))}
                        placeholder="Max marks"
                        min={1}
                        className="input w-24"
                      />
                      <input
                        type="date"
                        value={s.exam_date}
                        onChange={(e) => updateSubject(i, "exam_date", e.target.value)}
                        className="input w-36"
                      />
                      {form.subjects.length > 1 && (
                        <button type="button" onClick={() => removeSubject(i)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving…" : editing ? "Update" : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
