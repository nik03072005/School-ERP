import { useEffect, useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { getMyReports } from "../../api/progressReportService";

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

const PCT_COLOR = (pct) => {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-cyan-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-600";
};

export default function StudentResults() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyReports()
      .then(({ reports }) => setReports(reports || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-green-50 p-3 text-green-600">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Results</h1>
            <p className="text-sm text-slate-500">
              {reports.length} {reports.length === 1 ? "report" : "reports"} published
            </p>
          </div>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-20">
          <BarChart3 size={32} className="text-slate-300" />
          <p className="text-slate-500">No published results yet</p>
          <p className="text-xs text-slate-400">Results will appear here once published by the school</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const exam = report.exam_schedule_id;
            const isOpen = expanded === report._id;
            return (
              <div
                key={report._id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setExpanded((p) => (p === report._id ? null : report._id))}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-lg">{exam?.name}</span>
                      {exam?.exam_type && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {TYPE_LABELS[exam.exam_type] || exam.exam_type}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {exam?.class_id?.name}
                      {exam?.academic_year ? ` · ${exam.academic_year}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${PCT_COLOR(report.percentage)}`}>
                        {report.percentage ?? "—"}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {report.total_marks_obtained}/{report.total_max_marks}
                      </p>
                    </div>
                    <span
                      className={`rounded-xl px-3 py-1.5 text-sm font-bold ${
                        GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"]
                      }`}
                    >
                      {report.overall_grade ?? "—"}
                    </span>
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
                          <th className="pb-2 font-semibold text-right">%</th>
                          <th className="pb-2 font-semibold text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {report.marks?.map((m, i) => {
                          const pct = m.max_marks
                            ? Math.round((m.marks_obtained / m.max_marks) * 100)
                            : null;
                          return (
                            <tr key={i}>
                              <td className="py-2 text-slate-700">{m.subject}</td>
                              <td className="py-2 text-right font-bold text-slate-900">
                                {m.marks_obtained}
                              </td>
                              <td className="py-2 text-right text-slate-400">{m.max_marks}</td>
                              <td className={`py-2 text-right text-sm font-semibold ${PCT_COLOR(pct)}`}>
                                {pct !== null ? `${pct}%` : "—"}
                              </td>
                              <td className="py-2 text-right">
                                <span
                                  className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
                                    GRADE_COLORS[m.grade] || GRADE_COLORS["N/A"]
                                  }`}
                                >
                                  {m.grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 font-bold">
                          <td className="pt-3 text-slate-900">Total</td>
                          <td className="pt-3 text-right text-slate-900">
                            {report.total_marks_obtained}
                          </td>
                          <td className="pt-3 text-right text-slate-400">{report.total_max_marks}</td>
                          <td className={`pt-3 text-right font-bold ${PCT_COLOR(report.percentage)}`}>
                            {report.percentage != null ? `${report.percentage}%` : "—"}
                          </td>
                          <td className="pt-3 text-right">
                            <span
                              className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
                                GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"]
                              }`}
                            >
                              {report.overall_grade}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    {report.remarks && (
                      <p className="mt-3 rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
                        <span className="font-semibold">Remarks:</span> {report.remarks}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
