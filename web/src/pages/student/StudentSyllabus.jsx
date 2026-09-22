import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  GraduationCap,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { studentService } from "../../api/studentService";
import { syllabusService } from "../../api/syllabusService";

export default function StudentSyllabus() {
  const [profile, setProfile] = useState(null);
  const [syllabiData, setSyllabiData] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const profileRes = await studentService.getMyProfile();
      const student = profileRes.student || profileRes;
      setProfile(student);

      const classId = student.class_id?._id || student.class_id;
      if (classId) {
        const sylRes = await syllabusService.listSyllabusByClass(classId);
        setSyllabiData(sylRes);
        if (sylRes.syllabi?.length > 0) {
          setExpandedSubject(sylRes.syllabi[0]._id);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedSubject((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
          <GraduationCap className="h-4 w-4" /> Academic Curriculum
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Syllabus & Course Progress
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track official CBSE subject codes, mark distributions, and chapter-by-chapter coverage for your grade.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-800">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Class Summary */}
          {syllabiData?.summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Curriculum Delivered</div>
                <div className="mt-1 text-2xl font-bold text-cyan-600">
                  {syllabiData.summary.overall_class_progress}%
                </div>
                <div className="mt-1 text-xs text-slate-400">Average syllabus covered</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Subjects Enrolled</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {syllabiData.summary.total_subjects}
                </div>
                <div className="mt-1 text-xs text-slate-400">Formal CBSE curriculum</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Chapters Completed</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">
                  {syllabiData.summary.completed_chapters}
                </div>
                <div className="mt-1 text-xs text-slate-400">Units covered in class</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">Total Chapters</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {syllabiData.summary.total_chapters}
                </div>
                <div className="mt-1 text-xs text-slate-400">Full year syllabus</div>
              </div>
            </div>
          )}

          {/* Subjects and Chapters Accordion */}
          <div className="space-y-4">
            {syllabiData?.syllabi?.map((syl) => {
              const sub = syl.subject_id;
              if (!sub) return null;
              const isExpanded = expandedSubject === syl._id;
              const pct = syl.overall_completion_percentage || 0;

              return (
                <div
                  key={syl._id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition hover:border-cyan-300"
                >
                  {/* Subject Card Header */}
                  <div
                    onClick={() => toggleExpand(syl._id)}
                    className="flex cursor-pointer flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-400">
                          Code {sub.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 capitalize">
                          {sub.subject_type}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">{sub.name}</h3>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Assessment Split: <strong>{sub.theory_marks} Theory</strong> +{" "}
                        <strong>{sub.practical_marks || 0} Practical</strong> +{" "}
                        <strong>{sub.internal_marks || 0} Internal</strong> ={" "}
                        <strong>{sub.total_marks} Total</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="min-w-36 text-right">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Covered:</span>
                          <span className="font-bold text-cyan-700">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-cyan-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Chapter-wise Breakdown when expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 space-y-2.5 bg-white">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400 mb-2">
                        <span>Chapter Syllabus</span>
                        <span>Status</span>
                      </div>

                      {syl.chapters?.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Detailed chapter list being prepared by academic faculty.
                        </div>
                      ) : (
                        syl.chapters.map((ch) => {
                          const isDone = ch.status === "completed" || ch.completion_percentage >= 100;
                          const isInProg = ch.status === "in_progress" && !isDone;

                          return (
                            <div
                              key={ch._id}
                              className={`flex items-start justify-between rounded-xl p-3 border transition ${
                                isDone
                                  ? "border-emerald-100 bg-emerald-50/20"
                                  : isInProg
                                  ? "border-cyan-100 bg-cyan-50/20"
                                  : "border-slate-100 bg-slate-50/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                    isDone
                                      ? "bg-emerald-600 text-white"
                                      : isInProg
                                      ? "bg-cyan-600 text-white"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {ch.chapter_number}
                                </span>
                                <div>
                                  <div className="text-sm font-semibold text-slate-800">{ch.title}</div>
                                  <div className="mt-0.5 text-xs text-slate-400">
                                    {ch.term} • Planned: {ch.planned_periods} periods
                                    {ch.teacher_notes && (
                                      <span className="block mt-1 text-slate-600 italic">
                                        Note: {ch.teacher_notes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                                    isDone
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isInProg
                                      ? "bg-cyan-100 text-cyan-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isDone ? "Completed (100%)" : isInProg ? `In Progress (${ch.completion_percentage}%)` : "Upcoming"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

