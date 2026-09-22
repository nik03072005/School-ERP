import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit2,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
  AlertCircle,
  FileCheck2,
  Beaker,
} from "lucide-react";
import { subjectService } from "../../api/subjectService";
import { setupService } from "../../api/setupService";
import { adminService } from "../../api/adminService";

export default function SubjectMasterAdmin() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [availablePresets, setAvailablePresets] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);

  // Subject Form State
  const initialForm = {
    name: "",
    code: "",
    class_id: "",
    board: "CBSE",
    subject_type: "core",
    split_type: "80_20",
    theory_marks: 80,
    practical_marks: 0,
    internal_marks: 20,
    total_marks: 100,
    pass_marks: 33,
    periods_per_week: 6,
    assigned_teachers: [],
    description: "",
    academic_year: "2026-2027",
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [classRes, teacherRes, subjectRes] = await Promise.all([
        setupService.listClasses({ is_active: true }),
        adminService.getAllUsers({ role: "teaching_staff", limit: 100 }),
        subjectService.getSubjects(),
      ]);

      const classList = classRes.classes || [];
      setClasses(classList);
      setTeachers(teacherRes.users || []);
      setSubjects(subjectRes.subjects || []);

      if (classList.length > 0 && !selectedClassId) {
        setSelectedClassId(String(classList[0]._id));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update split preset marks helper
  const handleSplitChange = (splitKey) => {
    let t = 80,
      p = 0,
      i = 20;
    if (splitKey === "70_30") {
      t = 70;
      p = 30;
      i = 0;
    } else if (splitKey === "50_50") {
      t = 50;
      p = 50;
      i = 0;
    } else if (splitKey === "100_0") {
      t = 100;
      p = 0;
      i = 0;
    } else if (splitKey === "custom") {
      t = formData.theory_marks;
      p = formData.practical_marks;
      i = formData.internal_marks;
    }

    setFormData((prev) => ({
      ...prev,
      split_type: splitKey,
      theory_marks: t,
      practical_marks: p,
      internal_marks: i,
      total_marks: t + p + i,
    }));
  };

  const handleCustomMarksChange = (field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setFormData((prev) => {
      const next = { ...prev, [field]: num };
      const tot =
        (field === "theory_marks" ? num : prev.theory_marks) +
        (field === "practical_marks" ? num : prev.practical_marks) +
        (field === "internal_marks" ? num : prev.internal_marks);
      return { ...next, total_marks: tot };
    });
  };

  const openCreateModal = () => {
    setFormData({
      ...initialForm,
      class_id: selectedClassId || (classes[0]?._id ? String(classes[0]._id) : ""),
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      class_id: subject.class_id?._id || subject.class_id || "",
      board: subject.board || "CBSE",
      subject_type: subject.subject_type || "core",
      split_type: subject.split_type || "80_20",
      theory_marks: subject.theory_marks ?? 80,
      practical_marks: subject.practical_marks ?? 0,
      internal_marks: subject.internal_marks ?? 20,
      total_marks: subject.total_marks ?? 100,
      pass_marks: subject.pass_marks ?? 33,
      periods_per_week: subject.periods_per_week ?? 6,
      assigned_teachers: (subject.assigned_teachers || []).map((t) => (t._id ? String(t._id) : String(t))),
      description: subject.description || "",
      academic_year: subject.academic_year || "2026-2027",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError("");

      if (formData.theory_marks + formData.practical_marks + formData.internal_marks !== formData.total_marks) {
        setError(`Theory + Practical + Internal must equal Total Marks (${formData.total_marks})`);
        setActionLoading(false);
        return;
      }

      if (isEditModalOpen && editingSubject) {
        await subjectService.updateSubject(editingSubject._id, formData);
        setNotice(`Subject "${formData.name}" updated successfully.`);
      } else {
        await subjectService.createSubject(formData);
        setNotice(`Subject "${formData.name}" created successfully.`);
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingSubject(null);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save subject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"? This will also remove its syllabus records.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await subjectService.deleteSubject(id);
      setNotice(`Subject "${name}" deleted.`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete subject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPresetModal = async () => {
    try {
      const selectedClass = classes.find((c) => String(c._id) === String(selectedClassId));
      const grade = selectedClass?.grade_level;
      const res = await subjectService.getPresets(grade ? { grade_level: grade } : {});
      setAvailablePresets(res.subject_presets || []);
      setIsPresetModalOpen(true);
    } catch (err) {
      setError("Failed to load CBSE presets");
    }
  };

  const handleApplyPresets = async () => {
    if (!selectedClassId) return;
    try {
      setActionLoading(true);
      setError("");
      const res = await subjectService.seedPresetsForClass({ class_id: selectedClassId });
      setNotice(res.message);
      setIsPresetModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to seed CBSE presets");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchClass = !selectedClassId || String(s.class_id?._id || s.class_id) === String(selectedClassId);
      const matchType = typeFilter === "all" || s.subject_type === typeFilter;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchType && matchSearch;
    });
  }, [subjects, selectedClassId, typeFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const list = selectedClassId
      ? subjects.filter((s) => String(s.class_id?._id || s.class_id) === String(selectedClassId))
      : subjects;

    const total = list.length;
    const core = list.filter((s) => s.subject_type === "core").length;
    const practical = list.filter((s) => (s.practical_marks || 0) > 0).length;
    const avgCoverage =
      total > 0
        ? Math.round(
            (list.reduce((sum, s) => sum + (s.syllabus_progress?.overall_completion_percentage || 0), 0) /
              total) *
              10
          ) / 10
        : 0;

    return { total, core, practical, avgCoverage };
  }, [subjects, selectedClassId]);

  const selectedClass = classes.find((c) => String(c._id) === String(selectedClassId));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
            <GraduationCap className="h-4 w-4" /> Academic Architecture
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Central Subject Master
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage formal CBSE/State subject codes, theory vs. practical mark splits, and curriculum structure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenPresetModal}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100/80"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Quick Import CBSE Presets
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Notifications / Errors */}
      {notice && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Subjects</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-1 text-xs text-slate-400">{selectedClass ? selectedClass.name : "All Classes"}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Core Academic</div>
          <div className="mt-1 text-2xl font-bold text-cyan-600">{stats.core}</div>
          <div className="mt-1 text-xs text-slate-400">Board mandatory</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Practical / Lab Units</div>
          <div className="mt-1 text-2xl font-bold text-violet-600">{stats.practical}</div>
          <div className="mt-1 text-xs text-slate-400">70+30 or 50+50 split</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Avg. Syllabus Covered</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.avgCoverage}%</div>
          <div className="mt-1 text-xs text-slate-400">Class academic progress</div>
        </div>
      </div>

      {/* Filter and Class Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} (Grade {c.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="core">Core Subjects</option>
              <option value="language">Languages</option>
              <option value="elective">Electives</option>
              <option value="vocational">Vocational / Skill</option>
            </select>
          </div>
        </div>

        <div className="relative min-w-56 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Subjects List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <BookOpen className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No subjects configured</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Configure formal subjects for this class or import the official CBSE standard curriculum presets with 1-click.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleOpenPresetModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Sparkles className="h-4 w-4" /> Import CBSE Presets
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Add Custom
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((sub) => {
            const pct = sub.syllabus_progress?.overall_completion_percentage || 0;
            const completedCh = sub.syllabus_progress?.completed_chapters || 0;
            const totalCh = sub.syllabus_progress?.total_chapters || 0;

            return (
              <div
                key={sub._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-cyan-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-mono font-bold tracking-wider text-amber-400">
                        Code {sub.code}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                        {sub.subject_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => openEditModal(sub)}
                        title="Edit Subject"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cyan-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub._id, sub.name)}
                        title="Delete Subject"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-cyan-700">
                    {sub.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {sub.class_id?.name || "Class"} • {sub.board || "CBSE"} Board
                  </div>

                  {/* Mark Split Card */}
                  <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 mb-1.5">
                      <span className="font-semibold text-slate-700">Assessment Mark Split:</span>
                      <span className="font-bold text-slate-900">{sub.total_marks} Marks</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-lg bg-blue-50/80 p-1 border border-blue-100">
                        <span className="block text-[10px] text-blue-600 font-semibold uppercase">Theory</span>
                        <span className="font-bold text-blue-900">{sub.theory_marks}</span>
                      </div>
                      <div className="rounded-lg bg-purple-50/80 p-1 border border-purple-100">
                        <span className="block text-[10px] text-purple-600 font-semibold uppercase">Practical</span>
                        <span className="font-bold text-purple-900">{sub.practical_marks || 0}</span>
                      </div>
                      <div className="rounded-lg bg-amber-50/80 p-1 border border-amber-100">
                        <span className="block text-[10px] text-amber-600 font-semibold uppercase">Internal</span>
                        <span className="font-bold text-amber-900">{sub.internal_marks || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Teacher */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Teacher:{" "}
                      {sub.assigned_teachers?.length > 0
                        ? sub.assigned_teachers
                            .map((t) => `${t.first_name} ${t.last_name}`)
                            .join(", ")
                        : "Not assigned"}
                    </span>
                  </div>
                </div>

                {/* Bottom Syllabus Completion Tracker */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Syllabus Covered:</span>
                    <span className="font-bold text-cyan-700">{pct}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-cyan-500" : "bg-amber-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {completedCh} of {totalCh} chapters completed
                    </span>
                    <Link
                      to={`/admin/syllabus?classId=${sub.class_id?._id || sub.class_id}&subjectId=${sub._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Track Chapters <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditModalOpen ? "Edit Subject Master" : "Add Subject to Master"}
                </h2>
                <p className="text-xs text-slate-500">Configure CBSE subject code and formal assessment mark split</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    CBSE / State Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 041, 086, 042"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full font-mono rounded-xl border border-slate-200 px-3.5 py-2 text-sm uppercase focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Class *</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} (Grade {c.grade_level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Board</label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Type</label>
                  <select
                    value={formData.subject_type}
                    onChange={(e) => setFormData({ ...formData, subject_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="core">Core Mandatory</option>
                    <option value="language">Language</option>
                    <option value="elective">Elective</option>
                    <option value="vocational">Vocational / Skill</option>
                    <option value="co_curricular">Co-Curricular</option>
                  </select>
                </div>
              </div>

              {/* Assessment Marks Split Section */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Theory vs. Practical / Internal Marks Split
                  </span>
                  <span className="text-xs font-bold text-cyan-700">
                    Total: {formData.total_marks} Marks
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { key: "80_20", label: "80 Theory + 20 Internal" },
                    { key: "70_30", label: "70 Theory + 30 Practical (Lab)" },
                    { key: "50_50", label: "50 Theory + 50 Practical (Skill)" },
                    { key: "100_0", label: "100 Theory (No Practical)" },
                    { key: "custom", label: "Custom Split" },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleSplitChange(preset.key)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        formData.split_type === preset.key
                          ? "bg-cyan-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Marks inputs */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      Theory Marks
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.theory_marks}
                      onChange={(e) => handleCustomMarksChange("theory_marks", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      Practical / Lab
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.practical_marks}
                      onChange={(e) => handleCustomMarksChange("practical_marks", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      Internal Assess.
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.internal_marks}
                      onChange={(e) => handleCustomMarksChange("internal_marks", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Teacher Assignment */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Assign Teaching Faculty
                </label>
                <select
                  multiple
                  value={formData.assigned_teachers}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setFormData({ ...formData, assigned_teachers: selected });
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-cyan-500 focus:outline-none h-24"
                >
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.first_name} {t.last_name} ({t.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Hold Ctrl (or Cmd) to select multiple teachers</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                  {isEditModalOpen ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Import CBSE Presets Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Standard CBSE Curriculum Presets</h2>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Applying presets will provision the official CBSE curriculum for{" "}
              <strong>{selectedClass ? selectedClass.name : "the selected class"}</strong> including subject codes,
              theory/practical split rules, and pre-populated chapter syllabi.
            </p>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
              {availablePresets.map((p) => (
                <div
                  key={p.code}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">Code {p.code}</span>
                      <span className="font-bold text-slate-900">{p.name}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Split: {p.theory_marks} Th + {p.practical_marks || 0} Prac + {p.internal_marks || 0} Int •{" "}
                      {p.default_chapters?.length || 0} Chapters
                    </div>
                  </div>
                  <span className="rounded-md bg-indigo-100/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                    Official CBSE
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPresets}
                disabled={actionLoading || !selectedClassId}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Provision {availablePresets.length} Subjects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

