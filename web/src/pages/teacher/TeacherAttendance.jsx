import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Download, RefreshCw } from "lucide-react";
import { setupService } from "../../api/setupService";
import { attendanceService } from "../../api/attendanceService";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = ["present", "absent", "late", "half_day", "leave_pending", "leave_approved"];

const STATUS_COLORS = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
  half_day: "bg-orange-100 text-orange-700",
  leave_pending: "bg-blue-100 text-blue-700",
  leave_approved: "bg-indigo-100 text-indigo-700",
  not_marked: "bg-slate-100 text-slate-500",
};

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mark");

  const [sections, setSections] = useState([]);
  const [markSectionId, setMarkSectionId] = useState("");
  const [recordSectionId, setRecordSectionId] = useState("");
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordFromDate, setRecordFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordToDate, setRecordToDate] = useState(new Date().toISOString().slice(0, 10));
  const [markCheckpoint, setMarkCheckpoint] = useState("start");
  const [recordCheckpoint, setRecordCheckpoint] = useState("start");
  const [markRows, setMarkRows] = useState([]);
  const [recordRows, setRecordRows] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setupService
      .listSections({ is_active: true, class_teacher_user_id: user.id })
      .then((data) => {
        const mine = (data.sections || []).filter(
          (s) => String(s?.class_teacher_user_id?._id || s?.class_teacher_user_id || "") === String(user.id)
        );
        setSections(mine);
      })
      .catch((err) => setError(err?.response?.data?.message || "Could not load sections"));
  }, [user?.id]);

  useEffect(() => {
    if (!markSectionId && sections.length > 0) setMarkSectionId(String(sections[0]._id));
    if (!recordSectionId && sections.length > 0) setRecordSectionId(String(sections[0]._id));
  }, [sections]);

  const selectedMarkSection = useMemo(
    () => sections.find((s) => String(s._id) === String(markSectionId)),
    [sections, markSectionId]
  );
  const selectedRecordSection = useMemo(
    () => sections.find((s) => String(s._id) === String(recordSectionId)),
    [sections, recordSectionId]
  );

  const loadMarkDaily = async () => {
    if (!selectedMarkSection) return;
    try {
      setError("");
      const data = await attendanceService.getStudentDaily({
        class_id: selectedMarkSection?.class_id?._id,
        section_id: markSectionId,
        attendance_date: markDate,
        checkpoint: markCheckpoint,
      });
      setMarkRows(
        (data.rows || []).map((r) => ({ ...r, status: r.status || "present", remarks: r.remarks || "" }))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load attendance sheet");
    }
  };

  const loadRecordDaily = async () => {
    if (!selectedRecordSection) return;
    try {
      setError("");
      const data = await attendanceService.getStudentDaily({
        class_id: selectedRecordSection?.class_id?._id,
        section_id: recordSectionId,
        attendance_date: recordDate,
        checkpoint: recordCheckpoint,
      });
      setRecordRows((data.rows || []).map((r) => ({ ...r, status: r.status || "not_marked" })));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load records");
    }
  };

  useEffect(() => { loadMarkDaily(); }, [markSectionId, markDate, markCheckpoint]);
  useEffect(() => { loadRecordDaily(); }, [recordSectionId, recordDate, recordCheckpoint]);

  const recordSummary = useMemo(() =>
    recordRows.reduce((acc, r) => { acc[r.status || "not_marked"] = (acc[r.status] || 0) + 1; return acc; }, {}),
    [recordRows]
  );

  const saveAttendance = async () => {
    if (!selectedMarkSection) return;
    setSaving(true);
    try {
      setError("");
      await attendanceService.markStudentBulk({
        class_id: selectedMarkSection?.class_id?._id,
        section_id: markSectionId,
        attendance_date: markDate,
        checkpoint: markCheckpoint,
        records: markRows.map((r) => ({ student_id: r.student_id, status: r.status, remarks: r.remarks })),
      });
      setNotice("Attendance saved successfully");
      setTimeout(() => setNotice(""), 3000);
      await loadMarkDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = async () => {
    if (!selectedRecordSection) return;
    try {
      setError("");
      const blob = await attendanceService.exportStudentCsv({
        class_id: selectedRecordSection?.class_id?._id,
        section_id: recordSectionId,
        from_date: recordFromDate,
        to_date: recordToDate,
      });
      downloadBlob(blob, `attendance-${recordFromDate}-to-${recordToDate}.csv`);
      setNotice("CSV exported successfully");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Export failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">Mark and review class attendance records</p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle size={16} /> {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-1 w-fit">
        {[
          { key: "mark", label: "Mark Attendance" },
          { key: "records", label: "Attendance Records" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── MARK ATTENDANCE ── */}
      {tab === "mark" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">
              Filters
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="label">Section</label>
                <select
                  value={markSectionId}
                  onChange={(e) => setMarkSectionId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select section</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s?.class_id?.name} – Section {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={markDate}
                  onChange={(e) => setMarkDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Checkpoint</label>
                <select
                  value={markCheckpoint}
                  onChange={(e) => setMarkCheckpoint(e.target.value)}
                  className="input w-full"
                >
                  <option value="start">Morning (Start)</option>
                  <option value="end">Afternoon (End)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attendance table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                {markRows.length > 0 ? `${markRows.length} students` : "No students loaded"}
              </p>
              <button
                onClick={saveAttendance}
                disabled={saving || !selectedMarkSection || markRows.length === 0}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Attendance"}
              </button>
            </div>

            {markRows.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-slate-400">
                Select your allotted section to start marking attendance.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Student</th>
                      <th className="px-4 py-3 text-left font-semibold">Roll</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {markRows.map((row, i) => (
                      <tr key={row.student_id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{row.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.roll_no || "—"}</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={row.status}
                            onChange={(e) =>
                              setMarkRows((prev) =>
                                prev.map((r) =>
                                  r.student_id === row.student_id ? { ...r, status: e.target.value } : r
                                )
                              )
                            }
                            className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-300 ${STATUS_COLORS[row.status] || STATUS_COLORS.present}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            value={row.remarks}
                            onChange={(e) =>
                              setMarkRows((prev) =>
                                prev.map((r) =>
                                  r.student_id === row.student_id ? { ...r, remarks: e.target.value } : r
                                )
                              )
                            }
                            placeholder="Optional…"
                            className="w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-violet-400 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ATTENDANCE RECORDS ── */}
      {tab === "records" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label">Section</label>
                <select
                  value={recordSectionId}
                  onChange={(e) => setRecordSectionId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select section</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s?.class_id?.name} – {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Record Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Checkpoint</label>
                <select
                  value={recordCheckpoint}
                  onChange={(e) => setRecordCheckpoint(e.target.value)}
                  className="input w-full"
                >
                  <option value="start">Morning</option>
                  <option value="end">Afternoon</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={loadRecordDaily}
                  disabled={!selectedRecordSection}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>
            {/* Export range */}
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
              <div>
                <label className="label">Export From</label>
                <input
                  type="date"
                  value={recordFromDate}
                  onChange={(e) => setRecordFromDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Export To</label>
                <input
                  type="date"
                  value={recordToDate}
                  onChange={(e) => setRecordToDate(e.target.value)}
                  className="input"
                />
              </div>
              <button
                onClick={exportCsv}
                disabled={!selectedRecordSection}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition disabled:opacity-50"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Summary cards */}
          {recordRows.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{recordRows.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total</p>
              </div>
              {Object.entries(recordSummary).map(([key, count]) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{key.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          )}

          {/* Records table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {recordRows.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-slate-400">
                No records found for the selected section and date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Student</th>
                      <th className="px-4 py-3 text-left font-semibold">Roll</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                      <th className="px-4 py-3 text-left font-semibold">Last Marked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recordRows.map((row, i) => (
                      <tr key={row.student_id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{row.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.roll_no || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[row.status] || STATUS_COLORS.not_marked}`}>
                            {(row.status || "not marked").replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{row.remarks || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">
                          {row.marked_at
                            ? new Date(row.marked_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
