import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  GraduationCap,
  Layers,
  RefreshCw,
  Sparkles,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { subjectService } from "../../api/subjectService";
import { syllabusService } from "../../api/syllabusService";
import { setupService } from "../../api/setupService";

export default function TeacherSyllabus() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [classRes, subjectRes] = await Promise.all([
        setupService.listClasses({ is_active: true }),
        subjectService.getSubjects(),
      ]);

      const classList = classRes.classes || [];
      const allSubjects = subjectRes.subjects || [];

      setClasses(classList);
      setSubjects(allSubjects);

      if (classList.length > 0) {
        const firstClassId = String(classList[0]._id);
        setSelectedClassId(firstClassId);

        const classSubs = allSubjects.filter(
          (s) => String(s.class_id?._id || s.class_id) === firstClassId
        );
        if (classSubs.length > 0) {
          const firstSubId = String(classSubs[0]._id);
          setSelectedSubjectId(firstSubId);
          await loadSubjectSyllabus(firstSubId);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load syllabus data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadSubjectSyllabus = async (subjectId) => {
    if (!subjectId) return;
    try {
      const res = await syllabusService.getSyllabusBySubject(subjectId);
      setSyllabus(res.syllabus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (newClassId) => {
    setSelectedClassId(newClassId);
    const classSubs = subjects.filter(
      (s) => String(s.class_id?._id || s.class_id) === String(newClassId)
    );
    const newSubId = classSubs[0]?._id ? String(classSubs[0]._id) : "";
    setSelectedSubjectId(newSubId);
    if (newSubId) {
      setLoading(true);
      await loadSubjectSyllabus(newSubId);
      setLoading(false);
    } else {
      setSyllabus(null);
    }
  };

  const handleSubjectChange = async (newSubId) => {
    setSelectedSubjectId(newSubId);
    setLoading(true);
    await loadSubjectSyllabus(newSubId);
    setLoading(false);
  };

  const handleUpdateProgress = async (chapterId, updates) => {
    if (!syllabus) return;
    try {
      const res = await syllabusService.updateChapterProgress(
        syllabus._id,
        chapterId,
        updates
      );
      setSyllabus(res.syllabus);
      setNotice("Chapter progress saved.");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update chapter progress");
    }
  };

  const currentClassSubjects = subjects.filter(
    (s) => String(s.class_id?._id || s.class_id) === String(selectedClassId)
  );

  const selectedSubject = currentClassSubjects.find(
    (s) => String(s._id) === String(selectedSubjectId)
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
            <Compass className="h-4 w-4" /> Faculty Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Syllabus Delivery & Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track chapter progress, log delivery periods, and mark syllabus completion (% covered).
          </p>
        </div>
      </div>

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

      {/* Class and Subject Selectors */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : selectedSubject ? (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-cyan-900 p-6 text-white shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="rounded-md bg-amber-400 px-2 py-0.5 font-mono text-xs font-bold text-slate-950">
                  CBSE Code {selectedSubject.code}
                </span>
                <h2 className="mt-2 text-2xl font-bold">{selectedSubject.name}</h2>
                <div className="mt-1 text-xs text-slate-300">
                  Assessment Split: {selectedSubject.theory_marks} Theory +{" "}
                  {selectedSubject.practical_marks || 0} Practical +{" "}
                  {selectedSubject.internal_marks || 0} Internal = {selectedSubject.total_marks} Marks
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-md text-center">
                <div className="text-xs font-medium text-slate-300 uppercase">Curriculum Delivered</div>
                <div className="text-3xl font-extrabold text-cyan-300">
                  {syllabus?.overall_completion_percentage || 0}%
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {syllabus?.completed_chapters || 0} of {syllabus?.total_chapters || 0} Chapters
                </div>
              </div>
            </div>
          </div>

          {/* Chapters Table */}
          {!syllabus || syllabus.chapters?.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">No chapters configured yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Please contact the academic coordinator or switch to Admin mode to import chapters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {syllabus.chapters.map((ch) => {
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
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Planned: {ch.planned_periods} periods</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Actual Spent:
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={ch.actual_periods || 0}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (val !== ch.actual_periods) {
                                    handleUpdateProgress(ch._id, { actual_periods: val });
                                  }
                                }}
                                className="w-14 rounded-md border border-slate-200 px-1.5 py-0.5 text-xs text-center font-semibold"
                              />
                              periods
                            </span>
                            {ch.target_completion_date && (
                              <>
                                <span>•</span>
                                <span>Target: {new Date(ch.target_completion_date).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right controls */}
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
                      </div>
                    </div>

                    {/* Teacher Instructional Notes input */}
                    <div className="mt-3 border-t border-slate-100/80 pt-2.5">
                      <input
                        type="text"
                        placeholder="Log teacher notes, textbook questions covered, homework assigned..."
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
      ) : null}
    </div>
  );
}

