import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  GraduationCap,
  Save,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { setupService } from "../../api/setupService";
import { attendanceService } from "../../api/attendanceService";
import { adminService } from "../../api/adminService";

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late Arrival" },
  { value: "half_day", label: "Half Day" },
  { value: "leave_pending", label: "Leave (Pending)" },
  { value: "leave_approved", label: "Leave (Approved)" },
];

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function AttendanceAdmin() {
  const [tab, setTab] = useState("students");
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkpoint, setCheckpoint] = useState("start");
  const [rows, setRows] = useState([]);
  const [staffRows, setStaffRows] = useState([]);
  const [staffRoster, setStaffRoster] = useState([]);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSetup = async () => {
    const [classData, sectionData] = await Promise.all([
      setupService.listClasses({ is_active: true }),
      setupService.listSections({ is_active: true }),
    ]);

    setClasses(classData.classes || []);
    setSections(sectionData.sections || []);
  };

  useEffect(() => {
    loadSetup().catch(() => setError("Could not load setup data"));
  }, []);

  const sectionOptions = useMemo(
    () => sections.filter((item) => String(item?.class_id?._id) === String(selectedClassId)),
    [sections, selectedClassId]
  );

  const loadStudentDaily = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    try {
      const data = await attendanceService.getStudentDaily({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        attendance_date: date,
        checkpoint,
      });
      setRows(
        (data.rows || []).map((row) => ({
          ...row,
          status: row.status || "present",
          remarks: row.remarks || "",
        }))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load student attendance");
    }
  };

  const loadStaffDaily = async () => {
    try {
      const [dailyData, teaching, nonTeaching] = await Promise.all([
        attendanceService.getStaffDaily({ attendance_date: date, checkpoint }),
        adminService.getAllUsers({ role: "teaching_staff", limit: 100 }),
        adminService.getAllUsers({ role: "non_teaching_staff", limit: 100 }),
      ]);

      const roster = [...(teaching.users || []), ...(nonTeaching.users || [])];
      setStaffRoster(roster);

      const dailyMap = new Map((dailyData.records || []).map((item) => [String(item.user_id?._id), item]));
      setStaffRows(
        roster.map((user) => {
          const existing = dailyMap.get(String(user._id));
          return {
            attendance_id: existing?._id || null,
            user_id: user._id,
            name: `${user.first_name} ${user.last_name}`.trim(),
            email: user.email,
            status: existing?.status || "present",
            remarks: existing?.remarks || "",
            marked_by: existing?.marked_by_user_id
              ? `${existing.marked_by_user_id.first_name || ""} ${existing.marked_by_user_id.last_name || ""}`.trim()
              : "",
          };
        })
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load staff attendance");
    }
  };

  useEffect(() => {
    if (tab === "students") {
      loadStudentDaily();
    } else {
      loadStaffDaily();
    }
  }, [tab, selectedClassId, selectedSectionId, date, checkpoint]);

  const saveStudentAttendance = async () => {
    if (!selectedClassId || !selectedSectionId) {
      setError("Please select class and section first");
      return;
    }

    try {
      await attendanceService.markStudentDaily({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        attendance_date: date,
        checkpoint,
        emergency_override_reason: emergencyReason || undefined,
        records: rows.map((row) => ({
          student_id: row.student_id,
          status: row.status,
          remarks: row.remarks,
        })),
      });
      setNotice("Student attendance saved successfully.");
      await loadStudentDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save student attendance");
    }
  };

  const exportStudentCsv = async () => {
    try {
      const blob = await attendanceService.exportStudentCsv({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        from_date: date,
        to_date: date,
      });
      downloadBlob(blob, `student-attendance-${date}.csv`);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not export student CSV");
    }
  };

  const exportStaffCsv = async () => {
    try {
      const blob = await attendanceService.exportStaffCsv({ from_date: date, to_date: date });
      downloadBlob(blob, `staff-attendance-${date}.csv`);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not export staff CSV");
    }
  };

  const correctStudentRecord = async (row) => {
    if (!row.attendance_id) {
      setError("Save attendance first before applying an official correction.");
      return;
    }

    const reason = window.prompt("Enter institutional audit correction reason:");
    if (!reason || !String(reason).trim()) return;

    try {
      await attendanceService.correctStudentAttendance(row.attendance_id, {
        status: row.status,
        remarks: row.remarks,
        reason,
      });
      setNotice("Student attendance corrected and logged in audit trail.");
      await loadStudentDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not correct student attendance");
    }
  };

  const correctStaffRecord = async (row) => {
    if (!row.attendance_id) {
      setError("Save attendance first before applying an official correction.");
      return;
    }

    const reason = window.prompt("Enter correction reason for staff log:");
    if (!reason || !String(reason).trim()) return;

    try {
      await attendanceService.correctStaffAttendance(row.attendance_id, {
        status: row.status,
        remarks: row.remarks,
        reason,
      });
      setNotice("Staff attendance corrected and logged.");
      await loadStaffDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not correct staff attendance");
    }
  };

  const saveStaffAttendance = async () => {
    try {
      await attendanceService.markStaffBulk({
        attendance_date: date,
        checkpoint,
        records: staffRows.map((row) => ({
          user_id: row.user_id,
          status: row.status,
          remarks: row.remarks,
        })),
      });
      setNotice("Staff attendance saved successfully.");
      await loadStaffDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save staff attendance");
    }
  };

  const activeRows = tab === "students" ? rows : staffRows;
  const presentCount = activeRows.filter((r) => r.status === "present").length;
  const absentCount = activeRows.filter((r) => r.status === "absent").length;
  const otherCount = activeRows.length - presentCount - absentCount;

  return (
    <div className="space-y-6">
      {/* ── Page Header Banner ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <CalendarCheck2 size={15} />
            Institutional Presence Tracking
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Attendance Operations</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Record morning and afternoon checkpoints, verify daily rolls, and export official register logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === "students" ? (
            <button
              type="button"
              onClick={exportStudentCsv}
              disabled={!selectedClassId || !selectedSectionId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={exportStaffCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Export Staff CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={tab === "students" ? saveStudentAttendance : saveStaffAttendance}
            disabled={tab === "students" ? !selectedClassId || !selectedSectionId || rows.length === 0 : staffRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Save size={14} />
            <span>Save Attendance</span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setTab("students")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            tab === "students"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <GraduationCap size={14} className={tab === "students" ? "text-cyan-400" : "text-slate-400"} />
          <span>Students Daily Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("staff")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            tab === "staff"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <UserCheck size={14} className={tab === "staff" ? "text-cyan-400" : "text-slate-400"} />
          <span>Faculty & Staff Attendance</span>
        </button>
      </div>

      {/* ── Alerts ── */}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
          <ShieldAlert size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Operational Filters Bar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
          {tab === "students" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700">Class Standard *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId("");
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
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
                <label className="text-xs font-bold text-slate-700">Section Division *</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedClassId}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Daily Checkpoint</label>
            <select
              value={checkpoint}
              onChange={(e) => setCheckpoint(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="start">Morning Start Checkpoint</option>
              <option value="end">Afternoon End Checkpoint</option>
            </select>
          </div>
        </div>

        {tab === "students" && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Emergency Override Reason (Optional)</label>
            <input
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="Required only for institutional administrative overrides..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* ── Quick Summary Stat Pills ── */}
      {activeRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs">
            Total Enrolled: {activeRows.length}
          </span>
          <span className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 text-xs font-bold">
            Present: {presentCount}
          </span>
          <span className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1 text-xs font-bold">
            Absent: {absentCount}
          </span>
          {otherCount > 0 && (
            <span className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 text-xs font-bold">
              Leave / Late: {otherCount}
            </span>
          )}
        </div>
      )}

      {/* ── Attendance Roster Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {tab === "students" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3 w-48">Attendance State</th>
                  <th className="px-4 py-3">Remarks & Notes</th>
                  <th className="px-5 py-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      Please select a Class and Section above to populate student attendance sheet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{row.name}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{row.roll_no || "—"}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={row.status}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((item) =>
                                item.student_id === row.student_id ? { ...item, status: e.target.value } : item
                              )
                            )
                          }
                          className={`w-full rounded-xl border px-2.5 py-1 text-xs font-bold transition ${
                            row.status === "present"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : row.status === "absent"
                              ? "border-rose-300 bg-rose-50 text-rose-800"
                              : "border-amber-300 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          value={row.remarks}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((item) =>
                                item.student_id === row.student_id
                                  ? { ...item, remarks: e.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Optional remarks..."
                          className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-xs text-slate-800 focus:bg-white"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => correctStudentRecord(row)}
                          disabled={!row.attendance_id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                          title="Apply logged audit correction"
                        >
                          <Edit3 size={11} />
                          <span>Correction</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Faculty / Employee</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3 w-48">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3">Last Recorded By</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      No staff records loaded for this date.
                    </td>
                  </tr>
                ) : (
                  staffRows.map((row) => (
                    <tr key={row.user_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{row.name}</td>
                      <td className="px-4 py-3.5 text-slate-500">{row.email}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={row.status}
                          onChange={(e) =>
                            setStaffRows((prev) =>
                              prev.map((item) =>
                                item.user_id === row.user_id ? { ...item, status: e.target.value } : item
                              )
                            )
                          }
                          className={`w-full rounded-xl border px-2.5 py-1 text-xs font-bold transition ${
                            row.status === "present"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : row.status === "absent"
                              ? "border-rose-300 bg-rose-50 text-rose-800"
                              : "border-amber-300 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          value={row.remarks}
                          onChange={(e) =>
                            setStaffRows((prev) =>
                              prev.map((item) =>
                                item.user_id === row.user_id ? { ...item, remarks: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Optional notes..."
                          className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-xs text-slate-800 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{row.marked_by || "System"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => correctStaffRecord(row)}
                          disabled={!row.attendance_id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Edit3 size={11} />
                          <span>Correction</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceAdmin;
