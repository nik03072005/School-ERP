import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookMarked,
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { createExam, deleteExam, getExams, updateExam } from "../../api/examService";
import { setupService } from "../../api/setupService";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

const EXAM_TYPES = [
  { value: "unit_test", label: "Unit Test", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "mid_term", label: "Mid Term Assessment", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "final", label: "Annual / Final Exam", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "other", label: "Classroom Test", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const params = filterClass ? { class_id: filterClass } : {};
      const { exams: examList } = await getExams(params);
      setExams(examList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [filterClass]);

  const loadSections = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    const { sections: secList } = await setupService.listSections({ class_id: classId });
    setSections(secList || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSections([]);
    setShowModal(true);
  };

  const openEdit = async (exam) => {
    setEditing(exam._id);
    const classId = exam.class_id?._id || exam.class_id;
    setForm({
      name: exam.name,
      exam_type: exam.exam_type,
      class_id: classId,
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
    await loadSections(classId);
    setShowModal(true);
  };

  const handleClassChange = async (classId) => {
    setForm((f) => ({ ...f, class_id: classId, section_id: "" }));
    await loadSections(classId);
  };

  const addSubject = () =>
    setForm((f) => ({
      ...f,
      subjects: [...f.subjects, { subject: "", max_marks: 100, exam_date: "" }],
    }));

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
    if (!window.confirm("Are you sure you want to delete this examination schedule?")) return;
    try {
      await deleteExam(id);
      loadExams();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete exam schedule.");
    }
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = searchQuery.toLowerCase();
    return exams.filter((e) => {
      const name = e.name?.toLowerCase() || "";
      const className = e.class_id?.name?.toLowerCase() || "";
      return name.includes(q) || className.includes(q);
    });
  }, [exams, searchQuery]);

  const publishedCount = exams.filter((e) => e.is_published).length;
  const draftCount = exams.length - publishedCount;

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
                <Award size={12} />
                Academic Evaluation Office
              </span>
              <span className="text-xs text-slate-400">Institutional Examination Registry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Exam Schedules & Assessment Timetables
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Configure standardized academic test cycles, subject evaluation dates, and mark weighting
              schemes across grades and academic streams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_exams" label="Assessment Guide" />
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 shadow-md active:scale-95"
            >
              <Plus size={16} />
              <span>Schedule New Exam</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Exam Schedules</span>
            <BookMarked size={16} className="text-cyan-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900">{exams.length}</p>
            <span className="text-[11px] font-semibold text-slate-500">current term</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Published To Students</span>
            <Award size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-emerald-600">{publishedCount}</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              live timetables
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Draft Schedules</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600">{draftCount}</p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              in preparation
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
            placeholder="Search exam name, class or academic term..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Academic Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Exam Schedules List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin text-cyan-600 mb-2" />
          <p className="text-xs font-medium">Loading examination schedules...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <BookMarked size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No exam schedules recorded</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Create an examination schedule using the button above to publish subject timetables and max marks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExams.map((exam) => {
            const isExpanded = expanded === exam._id;
            const typeConfig =
              EXAM_TYPES.find((t) => t.value === exam.exam_type) || EXAM_TYPES[3];
            const subjectsCount = exam.subjects?.length || 0;

            return (
              <div
                key={exam._id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpanded((p) => (p === exam._id ? null : exam._id))}
                  className="flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 font-bold text-xs">
                      <Award size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{exam.name}</h4>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${typeConfig.color}`}
                        >
                          {typeConfig.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Class: <strong className="text-slate-700">{exam.class_id?.name || "General"}</strong>
                        {exam.section_id && ` · Section ${exam.section_id?.name}`}
                        {exam.academic_year && ` · Academic Year ${exam.academic_year}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                        {subjectsCount} Subject{subjectsCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        exam.is_published
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {exam.is_published ? "Published" : "Draft Setup"}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${
                        isExpanded ? "rotate-180 text-cyan-600" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Subjects Table & Actions */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Subject Examination Timetable ({subjectsCount})
                      </p>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {exam.subjects?.map((s, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs"
                          >
                            <p className="text-xs font-bold text-slate-900 truncate">{s.subject}</p>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Max Marks:</span>
                              <strong className="text-slate-800 font-bold">{s.max_marks}</strong>
                            </div>
                            {s.exam_date && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-700 font-medium">
                                <Calendar size={12} />
                                <span>
                                  {new Date(s.exam_date).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(exam)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                      >
                        <Pencil size={13} />
                        <span>Edit Schedule</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exam._id)}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Exam Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <BookMarked size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editing ? "Modify Examination Schedule" : "Configure Examination Schedule"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Specify grade level, test cycle, and individual subject papers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Exam Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Mid-Term Examination 2026-27"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Evaluation Cycle
                  </label>
                  <select
                    value={form.exam_type}
                    onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Academic Year
                  </label>
                  <input
                    value={form.academic_year}
                    onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                    placeholder="e.g. 2026-2027"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Target Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.class_id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    <option value="">Select class grade</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Section (Optional)
                  </label>
                  <select
                    value={form.section_id}
                    onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    <option value="">All Class Sections</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic subjects */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Subjects & Papers ({form.subjects.length})
                  </p>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700"
                  >
                    <Plus size={14} /> Add Subject Paper
                  </button>
                </div>

                <div className="space-y-2">
                  {form.subjects.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={s.subject}
                        onChange={(e) => updateSubject(i, "subject", e.target.value)}
                        placeholder="Subject (e.g. Mathematics)"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={s.max_marks}
                        onChange={(e) => updateSubject(i, "max_marks", Number(e.target.value))}
                        placeholder="Max Marks"
                        min={1}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={s.exam_date}
                        onChange={(e) => updateSubject(i, "exam_date", e.target.value)}
                        className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:outline-none"
                      />
                      {form.subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(i)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition disabled:opacity-60 shadow-md shadow-cyan-600/20"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>{editing ? "Save Schedule Changes" : "Create Exam Schedule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
