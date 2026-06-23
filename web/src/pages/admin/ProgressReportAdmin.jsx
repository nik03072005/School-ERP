import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, ChevronDown } from "lucide-react";
import { getExams } from "../../api/examService";
import { getExamReport, publishReports } from "../../api/progressReportService";

const GRADE_COLORS = {
  A: "bg-green-100 text-green-700",
  B: "bg-cyan-100 text-cyan-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-red-100 text-red-700",
  "N/A": "bg-slate-100 text-slate-500",
};

export default function ProgressReportAdmin() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [reports, setReports] = useState([]);
  const [examDetail, setExamDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getExams().then(({ exams }) => setExams(exams));
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setReports([]);
      setExamDetail(null);
      return;
    }
    loadReport();
  }, [selectedExam]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { reports } = await getExamReport(selectedExam);
      setReports(reports);
      const exam = exams.find((e) => e._id === selectedExam);
      setExamDetail(exam || null);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Publish all unpublished reports for this exam? Students will be notified.")) return;
    setPublishing(true);
    try {
      const { message } = await publishReports(selectedExam);
      alert(message);
      loadReport();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const unpublishedCount = reports.filter((r) => !r.is_published).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progress Reports</h1>
          <p className="text-sm text-slate-500">View and publish student result cards</p>
        </div>
        {selectedExam && unpublishedCount > 0 && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            {publishing ? "Publishing…" : `Publish ${unpublishedCount} Report(s)`}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 min-w-64"
        >
          <option value="">Select an exam</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>
              {e.name} — {e.class_id?.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedExam ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <BarChart3 size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Select an exam to view reports</p>
        </div>
      ) : loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-500">No marks entered yet for this exam</p>
          <p className="text-xs text-slate-400 mt-1">Ask teachers to enter marks from the Marks Entry page</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-2">
            <span>{reports.length} student(s)</span>
            <span>
              {reports.filter((r) => r.is_published).length} published ·{" "}
              {unpublishedCount} unpublished
            </span>
          </div>

          {reports.map((report) => {
            const student = report.student_id;
            const name = student?.user_id
              ? `${student.user_id.first_name} ${student.user_id.last_name}`
              : "Unknown Student";
            const isOpen = expanded === report._id;

            return (
              <div key={report._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div
                  className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3"
                  onClick={() => setExpanded((p) => (p === report._id ? null : report._id))}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-slate-900">{name}</span>
                    {student?.roll_no && (
                      <span className="text-xs text-slate-400">Roll: {student.roll_no}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span className="text-slate-500">{report.percentage ?? "—"}%</span>
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"]}`}>
                      {report.overall_grade ?? "—"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${report.is_published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {report.is_published ? "Published" : "Draft"}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400">
                          <th className="pb-2 font-semibold">Subject</th>
                          <th className="pb-2 font-semibold text-right">Marks</th>
                          <th className="pb-2 font-semibold text-right">Max</th>
                          <th className="pb-2 font-semibold text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {report.marks?.map((m, i) => (
                          <tr key={i}>
                            <td className="py-1.5 text-slate-700">{m.subject}</td>
                            <td className="py-1.5 text-right font-semibold text-slate-900">{m.marks_obtained}</td>
                            <td className="py-1.5 text-right text-slate-400">{m.max_marks}</td>
                            <td className="py-1.5 text-right">
                              <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${GRADE_COLORS[m.grade] || GRADE_COLORS["N/A"]}`}>
                                {m.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 font-bold">
                          <td className="pt-2 text-slate-900">Total</td>
                          <td className="pt-2 text-right text-slate-900">{report.total_marks_obtained}</td>
                          <td className="pt-2 text-right text-slate-400">{report.total_max_marks}</td>
                          <td className="pt-2 text-right">
                            <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${GRADE_COLORS[report.overall_grade] || GRADE_COLORS["N/A"]}`}>
                              {report.overall_grade}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    {report.remarks && (
                      <p className="mt-3 text-xs text-slate-500 italic">Remarks: {report.remarks}</p>
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
