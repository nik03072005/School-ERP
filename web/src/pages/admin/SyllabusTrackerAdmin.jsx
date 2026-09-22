import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Edit,
  Edit2,
  FileCheck2,
  Filter,
  GraduationCap,
  Layers,
  Milestone,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { syllabusService } from "../../api/syllabusService";
import { subjectService } from "../../api/subjectService";
import { setupService } from "../../api/setupService";

export default function SyllabusTrackerAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlClassId = searchParams.get("classId");
  const urlSubjectId = searchParams.get("subjectId");

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(urlClassId || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId || "");
  const [activeTab, setActiveTab] = useState(urlSubjectId ? "chapters" : "overview");

  // Data states
  const [classSyllabi, setClassSyllabi] = useState(null);
  const [currentSyllabus, setCurrentSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Modals & Forms
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterForm, setChapterForm] = useState({
    chapter_number: 1,
    title: "",
    description: "",
    term: "Term 1",
    planned_periods: 8,
    target_completion_date: "",
  });

  // Load classes & subjects
  const loadInitial = async () => {
    try {
      setLoading(true);
      const [classRes, subjectRes] = await Promise.all([
        setupService.listClasses({ is_active: true }),
        subjectService.getSubjects(),
      ]);

      const classList = classRes.classes || [];
      const subList = subjectRes.subjects || [];
      setClasses(classList);
      setSubjects(subList);

      const defaultClassId = urlClassId || (classList[0]?._id ? String(classList[0]._id) : "");
      setSelectedClassId(defaultClassId);

      const matchingSubs = subList.filter(
        (s) => String(s.class_id?._id || s.class_id) === String(defaultClassId)
      );
      const defaultSubId =
        urlSubjectId || (matchingSubs[0]?._id ? String(matchingSubs[0]._id) : "");
      setSelectedSubjectId(defaultSubId);

      if (defaultClassId) {
        await loadClassSyllabi(defaultClassId);
      }
      if (defaultSubId) {
        await loadSubjectSyllabus(defaultSubId);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load syllabus tracker data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadClassSyllabi = async (classId) => {
    if (!classId) return;
    try {
      const res = await syllabusService.listSyllabusByClass(classId);
      setClassSyllabi(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjectSyllabus = async (subjectId) => {
    if (!subjectId) return;
    try {
      const res = await syllabusService.getSyllabusBySubject(subjectId);
      setCurrentSyllabus(res.syllabus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (newClassId) => {
    setSelectedClassId(newClassId);
    searchParams.set("classId", newClassId);
    setSearchParams(searchParams);

    const matchingSubs = subjects.filter(
      (s) => String(s.class_id?._id || s.class_id) === String(newClassId)
    );
    const newSubId = matchingSubs[0]?._id ? String(matchingSubs[0]._id) : "";
    setSelectedSubjectId(newSubId);
    if (newSubId) {
      searchParams.set("subjectId", newSubId);
      setSearchParams(searchParams);
    } else {
      searchParams.delete("subjectId");
      setSearchParams(searchParams);
    }

    setLoading(true);
    await loadClassSyllabi(newClassId);
    if (newSubId) {
      await loadSubjectSyllabus(newSubId);
    } else {
      setCurrentSyllabus(null);
    }
    setLoading(false);
  };

  const handleSubjectChange = async (newSubId) => {
    setSelectedSubjectId(newSubId);
    searchParams.set("subjectId", newSubId);
    setSearchParams(searchParams);
    setActiveTab("chapters");

    setLoading(true);
    await loadSubjectSyllabus(newSubId);
    setLoading(false);
  };

  // Chapter Progress Quick Update
  const handleUpdateProgress = async (chapterId, updates) => {
    if (!currentSyllabus) return;
    try {
      const res = await syllabusService.updateChapterProgress(
        currentSyllabus._id,
        chapterId,
        updates
      );
      setCurrentSyllabus(res.syllabus);
      // Also refresh class overview
      loadClassSyllabi(selectedClassId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update progress");
    }
  };

  // Open Chapter Modal
  const openAddChapterModal = () => {
    const nextNum =
      currentSyllabus?.chapters?.length > 0
        ? Math.max(...currentSyllabus.chapters.map((c) => c.chapter_number || 0)) + 1
        : 1;
    setEditingChapter(null);
    setChapterForm({
      chapter_number: nextNum,
      title: "",
      description: "",
      term: "Term 1",
      planned_periods: 8,
      target_completion_date: "",
    });
    setIsChapterModalOpen(true);
  };

  const openEditChapterModal = (ch) => {
    setEditingChapter(ch);
    setChapterForm({
      chapter_number: ch.chapter_number,
      title: ch.title,
      description: ch.description || "",
      term: ch.term || "Term 1",
      planned_periods: ch.planned_periods || 8,
      target_completion_date: ch.target_completion_date
        ? new Date(ch.target_completion_date).toISOString().split("T")[0]
        : "",
    });
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    if (!currentSyllabus) return;
    try {
      setActionLoading(true);
      setError("");

      if (editingChapter) {
        const res = await syllabusService.updateChapter(
          currentSyllabus._id,
          editingChapter._id,
          chapterForm
        );
        setCurrentSyllabus(res.syllabus);
        setNotice("Chapter updated successfully.");
      } else {
        const res = await syllabusService.addChapter(currentSyllabus._id, chapterForm);
        setCurrentSyllabus(res.syllabus);
        setNotice("Chapter added to syllabus planner.");
      }

      setIsChapterModalOpen(false);
      loadClassSyllabi(selectedClassId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save chapter");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChapter = async (chId, title) => {
    if (!window.confirm(`Delete chapter "${title}" from syllabus?`)) return;
    try {
      const res = await syllabusService.deleteChapter(currentSyllabus._id, chId);
      setCurrentSyllabus(res.syllabus);
      setNotice(`Chapter "${title}" removed.`);
      loadClassSyllabi(selectedClassId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete chapter");
    }
  };

  const handleSeedDefaultChapters = async () => {
    if (!selectedSubjectId) return;
    try {
      setActionLoading(true);
      setError("");
      const res = await syllabusService.seedDefaultChapters(selectedSubjectId);
      setCurrentSyllabus(res.syllabus);
      setNotice(res.message);
      loadClassSyllabi(selectedClassId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to import CBSE chapters");
    } finally {
      setActionLoading(false);
    }
  };

  const currentClassSubjects = useMemo(() => {
    return subjects.filter(
      (s) => String(s.class_id?._id || s.class_id) === String(selectedClassId)
    );
  }, [subjects, selectedClassId]);

  const selectedSubject = currentClassSubjects.find(
    (s) => String(s._id) === String(selectedSubjectId)
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
            <Compass className="h-4 w-4" /> Academic Delivery
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Chapter-wise Syllabus Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor real-time syllabus completion (% covered), plan chapter timelines, and log instructional hours.
          </p>
        </div>

        {selectedSubjectId && activeTab === "chapters" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSeedDefaultChapters}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Preload CBSE Chapters
            </button>
            <button
              onClick={openAddChapterModal}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" /> Add Chapter
            </button>
          </div>
        )}
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

      {/* Top Class & Subject Navigation */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={currentClassSubjects.length === 0}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              {currentClassSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  Code {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Class Overview
          </button>
          <button
            onClick={() => setActiveTab("chapters")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "chapters"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chapter-wise Planner
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : activeTab === "overview" ? (
        /* ── Class Curriculum Overview ── */
        <div className="space-y-6">
          {/* Class Summary Banner */}
          {classSyllabi && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Overall Class Progress</div>
                <div className="mt-1 text-2xl font-bold text-cyan-600">
                  {classSyllabi.summary?.overall_class_progress || 0}%
                </div>
                <div className="mt-1 text-xs text-slate-400">Curriculum covered</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Total Curriculum Subjects</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {classSyllabi.summary?.total_subjects || 0}
                </div>
                <div className="mt-1 text-xs text-slate-400">Active subject codes</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Chapters Completed</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">
                  {classSyllabi.summary?.completed_chapters || 0}
                </div>
                <div className="mt-1 text-xs text-slate-400">Units fully delivered</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Total Chapters Planned</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {classSyllabi.summary?.total_chapters || 0}
                </div>
                <div className="mt-1 text-xs text-slate-400">Across all subjects</div>
              </div>
            </div>
          )}

          {/* Subject Progress Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classSyllabi?.syllabi?.map((syl) => {
              const sub = syl.subject_id;
              if (!sub) return null;
              const pct = syl.overall_completion_percentage || 0;

              return (
                <div
                  key={syl._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-cyan-300"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-amber-500 bg-slate-900 px-2 py-0.5 rounded-md">
                      Code {sub.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      {sub.split_type?.replace("_", " + ")} Split
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900">{sub.name}</h3>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Syllabus Completion</span>
                    <span className="font-bold text-cyan-700">{pct}%</span>
                  </div>

                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-cyan-500" : "bg-amber-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-400">
                      {syl.completed_chapters || 0} / {syl.total_chapters || 0} chapters
                    </span>
                    <button
                      onClick={() => handleSubjectChange(sub._id)}
                      className="inline-flex items-center gap-1 font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Manage Chapters <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Chapter-wise Deep Dive ── */
        <div className="space-y-6">
          {/* Hero Banner for Selected Subject */}
          {selectedSubject && (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-6 text-white shadow-lg">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-mono font-bold text-slate-950">
                      CBSE Code {selectedSubject.code}
                    </span>
                    <span className="text-xs font-semibold text-cyan-300 uppercase">
                      {selectedSubject.board} • {selectedSubject.subject_type}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold">{selectedSubject.name}</h2>
                  <p className="mt-1 text-xs text-slate-300 max-w-xl">
                    Mark Assessment Split: <strong>{selectedSubject.theory_marks} Theory</strong> +{" "}
                    <strong>{selectedSubject.practical_marks || 0} Practical</strong> +{" "}
                    <strong>{selectedSubject.internal_marks || 0} Internal</strong> ={" "}
                    <strong>{selectedSubject.total_marks} Total Marks</strong>
                  </p>
                </div>

                {/* Big Progress Gauge */}
                <div className="flex items-center gap-5 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                  <div>
                    <div className="text-xs font-medium text-slate-300 uppercase">Curriculum Covered</div>
                    <div className="text-3xl font-extrabold text-cyan-400">
                      {currentSyllabus?.overall_completion_percentage || 0}%
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {currentSyllabus?.completed_chapters || 0} of{" "}
                      {currentSyllabus?.total_chapters || 0} Chapters
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapters List */}
          {!currentSyllabus || currentSyllabus.chapters?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">No chapters planned yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Add chapters manually or click below to preload the official CBSE NCERT chapter structure.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSeedDefaultChapters}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Sparkles className="h-4 w-4" /> Preload CBSE Chapters
                </button>
                <button
                  onClick={openAddChapterModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" /> Add Chapter
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentSyllabus.chapters.map((ch) => {
                const isCompleted = ch.status === "completed" || ch.completion_percentage >= 100;
                const isInProgress = ch.status === "in_progress" && !isCompleted;

                return (
                  <div
                    key={ch._id}
                    className={`rounded-2xl border p-4 transition ${
                      isCompleted
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isInProgress
                        ? "border-cyan-200 bg-cyan-50/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            isCompleted
                              ? "bg-emerald-600 text-white"
                              : isInProgress
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ch.chapter_number}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">{ch.title}</h4>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {ch.term}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isInProgress
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {ch.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> Planned: {ch.planned_periods} periods
                            </span>
                            <span>•</span>
                            <span>Actual Spent: {ch.actual_periods || 0} periods</span>
                            {ch.target_completion_date && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" /> Target:{" "}
                                  {new Date(ch.target_completion_date).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right controls: Slider + Status Pills */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 min-w-10 text-right">
                              {ch.completion_percentage}%
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={ch.completion_percentage}
                              onChange={(e) =>
                                handleUpdateProgress(ch._id, {
                                  completion_percentage: Number(e.target.value),
                                })
                              }
                              className="h-2 w-28 sm:w-36 cursor-pointer rounded-lg bg-slate-200 accent-cyan-600"
                            />
                          </div>

                          <button
                            onClick={() =>
                              handleUpdateProgress(ch._id, {
                                status: isCompleted ? "not_started" : "completed",
                              })
                            }
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              isCompleted
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {isCompleted ? "✓ Completed" : "Mark 100%"}
                          </button>

                          <button
                            onClick={() => openEditChapterModal(ch)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChapter(ch._id, ch.title)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Notes inline input */}
                    <div className="mt-3 border-t border-slate-100/80 pt-2.5">
                      <input
                        type="text"
                        placeholder="Add teacher instructional remarks or assignment references..."
                        defaultValue={ch.teacher_notes || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (ch.teacher_notes || "")) {
                            handleUpdateProgress(ch._id, { teacher_notes: e.target.value });
                          }
                        }}
                        className="w-full rounded-lg border border-transparent bg-slate-50/70 px-3 py-1 text-xs text-slate-700 focus:border-slate-300 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Chapter Modal */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingChapter ? "Edit Chapter" : "Add Syllabus Chapter"}
              </h3>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Ch #</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={chapterForm.chapter_number}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Term / Semester
                  </label>
                  <select
                    value={chapterForm.term}
                    onChange={(e) => setChapterForm({ ...chapterForm, term: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real Numbers"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Planned Periods
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={chapterForm.planned_periods}
                    onChange={(e) => setChapterForm({ ...chapterForm, planned_periods: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={chapterForm.target_completion_date}
                    onChange={(e) => setChapterForm({ ...chapterForm, target_completion_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Learning Objectives / Subtopics
                </label>
                <textarea
                  rows="2"
                  placeholder="Key concepts, derivation, lab practicals..."
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
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
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

