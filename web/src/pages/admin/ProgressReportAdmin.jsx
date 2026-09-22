import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Printer,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getExams } from "../../api/examService";
import { getExamReport, publishReports } from "../../api/progressReportService";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";
import CbseReportCardModal from "../../components/reports/CbseReportCardModal";

const GRADE_COLORS = {
  "A+": "bg-emerald-100 text-emerald-800 border-emerald-300",
  A: "bg-emerald-50 text-emerald-800 border-emerald-200",
  B: "bg-cyan-50 text-cyan-800 border-cyan-200",
  C: "bg-amber-50 text-amber-800 border-amber-200",
  D: "bg-rose-50 text-rose-800 border-rose-200",
  "N/A": "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ProgressReportAdmin() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [reports, setReports] = useState([]);
  const [examDetail, setExamDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardModal, setCardModal] = useState({ isOpen: false, activeIndex: 0 });

  useEffect(() => {
    getExams().then(({ exams: exList }) => setExams(exList || []));
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { reports: repList } = await getExamReport(selectedExam);
      setReports(repList || []);
      const exam = exams.find((e) => e._id === selectedExam);
      setExamDetail(exam || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedExam) {
      setReports([]);
      setExamDetail(null);
      return;
    }
    loadReport();
  }, [selectedExam]);

  const handlePublish = async () => {
    if (
      !window.confirm(
        "Publish all verified progress reports for this exam? Students and guardians will immediately be able to view their grade cards."
      )
    )
      return;
    setPublishing(true);
    try {
      const { message } = await publishReports(selectedExam);
      alert(message || "Reports published successfully.");
      loadReport();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to publish marks.");
    } finally {
      setPublishing(false);
    }
  };

  const unpublishedCount = reports.filter((r) => !r.is_published).length;
  const publishedCount = reports.filter((r) => r.is_published).length;

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter((r) => {
      const student = r.student_id;
      const name = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.toLowerCase();
      const roll = (student?.roll_no || "").toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [reports, searchQuery]);

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
                Student Performance & Marks Records
              </span>
              <span className="text-xs text-slate-400">Institutional Gradebook</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Progress Reports & Marksheets
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Consolidate term assessments, review subject marks distributions, and publish verified
              digital grade cards to the Student and Guardian portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_reports" label="Marksheet Guide" />
            {selectedExam && reports.length > 0 && (
              <button
                type="button"
                onClick={() => setCardModal({ isOpen: true, activeIndex: 0 })}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:from-amber-300 hover:to-amber-400 shadow-md active:scale-95"
              >
                <Printer size={15} />
                <span>Print CBSE Marksheets ({reports.length})</span>
              </button>
            )}
            {selectedExam && unpublishedCount > 0 && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60 shadow-md active:scale-95"
              >
                {publishing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Publish {unpublishedCount} Marksheets</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Exam Selection Bar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Evaluation Exam Cycle
          </label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
          >
            <option value="">-- Choose an Examination to Inspect --</option>
            {exams.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} — {e.class_id?.name || "General Class"}
              </option>
            ))}
          </select>
        </div>

        {selectedExam && reports.length > 0 && (
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or roll number..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ── Overview Metrics if exam selected ── */}
      {selectedExam && reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Evaluated Students</span>
              <GraduationCap size={16} className="text-cyan-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-900">{reports.length}</p>
              <span className="text-[11px] font-semibold text-slate-500">candidate marks</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Published Cards</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-emerald-600">{publishedCount}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                released to portal
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Pending Release</span>
              <BarChart3 size={16} className="text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-amber-600">{unpublishedCount}</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                draft marks
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Cards / Marksheets ── */}
      {!selectedExam ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <BarChart3 size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No Exam Selected</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Choose an examination from the dropdown menu above to inspect candidate marks and publish verified reports.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin text-cyan-600 mb-2" />
          <p className="text-xs font-medium">Aggregating student assessment marks...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <GraduationCap size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No Marks Recorded For This Exam</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Faculty members can enter subject marks through the Teacher Marks Entry module.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const student = report.student_id;
            const name = student?.user_id
              ? `${student.user_id.first_name} ${student.user_id.last_name}`
              : "Enrolled Student";
            const isOpen = expanded === report._id;
            const gradeBadge =
              GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"];

            return (
              <div
                key={report._id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Marksheet Row Header */}
                <div
                  onClick={() => setExpanded((p) => (p === report._id ? null : report._id))}
                  className="flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 font-bold text-xs">
                      {name.slice(0, 1)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{name}</h4>
                        {student?.roll_no && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Roll #{student.roll_no}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total Marks:{" "}
                        <strong className="text-slate-800">
                          {report.total_marks_obtained ?? "—"} / {report.total_max_marks ?? "—"}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {report.percentage != null ? `${report.percentage}%` : "—"}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${gradeBadge}`}
                      >
                        Grade {report.overall_grade ?? "—"}
                      </span>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        report.is_published
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {report.is_published ? "Published" : "Draft"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const idx = filteredReports.findIndex((r) => r._id === report._id);
                        setCardModal({ isOpen: true, activeIndex: Math.max(0, idx) });
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-900 transition hover:bg-amber-100 hover:border-amber-400 shadow-2xs active:scale-95"
                      title="View & Print Official CBSE Marksheet / Holistic Card"
                    >
                      <Award size={13} className="text-amber-700" />
                      <span>CBSE Card</span>
                    </button>

                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${
                        isOpen ? "rotate-180 text-cyan-600" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Marks Breakdown Table */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-3">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Subject / Paper</th>
                            <th className="px-4 py-3 text-right">Marks Obtained</th>
                            <th className="px-4 py-3 text-right">Maximum Marks</th>
                            <th className="px-4 py-3 text-right">Letter Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {report.marks?.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="px-4 py-2.5 font-bold text-slate-800">{m.subject}</td>
                              <td className="px-4 py-2.5 text-right font-extrabold text-cyan-700">
                                {m.marks_obtained}
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-400">
                                {m.max_marks}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span
                                  className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                    GRADE_COLORS[m.grade] || GRADE_COLORS["N/A"]
                                  }`}
                                >
                                  {m.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-slate-200 bg-slate-50/80 font-bold text-slate-900">
                          <tr>
                            <td className="px-4 py-3">Aggregate Evaluation Total</td>
                            <td className="px-4 py-3 text-right text-sm text-cyan-800">
                              {report.total_marks_obtained}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500">
                              {report.total_max_marks}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-bold ${gradeBadge}`}
                              >
                                {report.overall_grade}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {report.remarks && (
                      <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-600">
                        <span className="font-bold text-slate-700">Educator Remarks: </span>
                        {report.remarks}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Formal CBSE Printable Report Card Modal ── */}
      <CbseReportCardModal
        isOpen={cardModal.isOpen}
        onClose={() => setCardModal({ isOpen: false, activeIndex: 0 })}
        reports={filteredReports}
        activeReportIndex={cardModal.activeIndex}
        schoolBranding={{
          schoolName: "Kidz Galaxy International Senior Secondary School",
          affiliationNo: "2130892",
          schoolCode: "71204",
        }}
      />
    </div>
  );
}
