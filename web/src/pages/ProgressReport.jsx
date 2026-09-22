import { useEffect, useState } from "react";
import { Award, ChevronDown, GraduationCap, Printer } from "lucide-react";
import { getMyReports } from "../api/progressReportService";
import CbseReportCardModal from "../components/reports/CbseReportCardModal";

const GRADE_COLORS = {
  A: "bg-green-100 text-green-700",
  B: "bg-cyan-100 text-cyan-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-red-100 text-red-700",
  "N/A": "bg-slate-100 text-slate-500",
};

const TYPE_LABELS = {
  unit_test: "Unit Test",
  mid_term: "Mid Term",
  final: "Final",
  other: "Other",
};

export default function ProgressReport() {
  const [reports, setReports] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cardModal, setCardModal] = useState({ isOpen: false, activeIndex: 0 });

  useEffect(() => {
    getMyReports()
      .then((data) => {
        setReports(data.reports || []);
        setStudent(data.student || null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Loading your results…</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-600 p-3 text-white">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Progress Reports</h1>
            <p className="text-sm text-slate-500">Academic results and grades</p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center">
            <GraduationCap size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No published results yet</p>
            <p className="text-xs text-slate-400 mt-1">Results will appear here once published by the school</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const exam = report.exam_schedule_id;
              const isOpen = expanded === report._id;
              return (
                <div key={report._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <button
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setExpanded((p) => (p === report._id ? null : report._id))}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-lg">{exam?.name}</span>
                        {exam?.exam_type && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {TYPE_LABELS[exam.exam_type] || exam.exam_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {exam?.class_id?.name}
                        {exam?.academic_year ? ` · ${exam.academic_year}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">{report.percentage ?? "—"}%</p>
                        <p className="text-xs text-slate-400">
                          {report.total_marks_obtained}/{report.total_max_marks}
                        </p>
                      </div>
                      <span className={`rounded-xl px-3 py-1.5 text-sm font-bold ${GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"]}`}>
                        {report.overall_grade ?? "—"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const idx = reports.findIndex((r) => r._id === report._id);
                          setCardModal({ isOpen: true, activeIndex: Math.max(0, idx) });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition active:scale-95"
                        title="Open Printable CBSE Marksheet"
                      >
                        <Award size={14} className="text-amber-700" />
                        <span className="hidden sm:inline">CBSE Marksheet</span>
                      </button>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-400">
                            <th className="pb-2 font-semibold">Subject</th>
                            <th className="pb-2 font-semibold text-right">Marks</th>
                            <th className="pb-2 font-semibold text-right">Out of</th>
                            <th className="pb-2 font-semibold text-right">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {report.marks?.map((m, i) => (
                            <tr key={i}>
                              <td className="py-2 text-slate-700">{m.subject}</td>
                              <td className="py-2 text-right font-bold text-slate-900">{m.marks_obtained}</td>
                              <td className="py-2 text-right text-slate-400">{m.max_marks}</td>
                              <td className="py-2 text-right">
                                <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${GRADE_COLORS[m.grade] || GRADE_COLORS["N/A"]}`}>
                                  {m.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 font-bold">
                            <td className="pt-3 text-slate-900">Total</td>
                            <td className="pt-3 text-right text-slate-900">{report.total_marks_obtained}</td>
                            <td className="pt-3 text-right text-slate-400">{report.total_max_marks}</td>
                            <td className="pt-3 text-right">
                              <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"]}`}>
                                {report.overall_grade}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        {report.remarks ? (
                          <p className="rounded-xl bg-cyan-50 px-4 py-2 text-xs sm:text-sm text-cyan-700 flex-1">
                            <span className="font-semibold">Remarks:</span> {report.remarks}
                          </p>
                        ) : (
                          <div />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const idx = reports.findIndex((r) => r._id === report._id);
                            setCardModal({ isOpen: true, activeIndex: Math.max(0, idx) });
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-amber-700 transition active:scale-95"
                        >
                          <Printer size={14} />
                          <span>Print Official CBSE Marksheet / HPC</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Formal CBSE Printable Report Card Modal ── */}
        {reports.length > 0 && (
          <CbseReportCardModal
            isOpen={cardModal.isOpen}
            onClose={() => setCardModal({ isOpen: false, activeIndex: 0 })}
            reports={reports.map((r) => ({
              ...r,
              student_id: r.student_id?._id ? r.student_id : student,
            }))}
            activeReportIndex={cardModal.activeIndex}
            schoolBranding={{
              schoolName: "Kidz Galaxy International Senior Secondary School",
              affiliationNo: "2130892",
              schoolCode: "71204",
            }}
          />
        )}
      </div>
    </div>
  );
}
