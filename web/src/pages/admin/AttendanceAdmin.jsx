import { useEffect, useMemo, useState } from "react";
import { setupService } from "../../api/setupService";
import { attendanceService } from "../../api/attendanceService";
import { adminService } from "../../api/adminService";

const STATUS_OPTIONS = ["present", "absent", "late", "half_day", "leave_pending", "leave_approved"];

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
      setRows((data.rows || []).map((row) => ({ ...row, status: row.status || "present", remarks: row.remarks || "" })));
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
    try {
      await attendanceService.markStudentBulk({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        attendance_date: date,
        checkpoint,
        emergency_reason: emergencyReason || undefined,
        records: rows.map((row) => ({ student_id: row.student_id, status: row.status, remarks: row.remarks })),
      });
      setNotice("Student attendance saved");
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
      setError("Save attendance first before correction.");
      return;
    }

    const reason = window.prompt("Enter correction reason");
    if (!reason || !String(reason).trim()) return;

    try {
      await attendanceService.correctStudentAttendance(row.attendance_id, {
        status: row.status,
        remarks: row.remarks,
        reason,
      });
      setNotice("Student attendance corrected");
      await loadStudentDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not correct student attendance");
    }
  };

  const correctStaffRecord = async (row) => {
    if (!row.attendance_id) {
      setError("Save attendance first before correction.");
      return;
    }

    const reason = window.prompt("Enter correction reason");
    if (!reason || !String(reason).trim()) return;

    try {
      await attendanceService.correctStaffAttendance(row.attendance_id, {
        status: row.status,
        remarks: row.remarks,
        reason,
      });
      setNotice("Staff attendance corrected");
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
        records: staffRows.map((row) => ({ user_id: row.user_id, status: row.status, remarks: row.remarks })),
      });
      setNotice("Staff attendance saved");
      await loadStaffDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save staff attendance");
    }
  };

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>Attendance Operations</h2>
          <p>Mark start/end checkpoints and export daily attendance reports.</p>
        </div>
        <div className="chip-row">
          <button type="button" className={`btn ${tab === "students" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("students")}>Students</button>
          <button type="button" className={`btn ${tab === "staff" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("staff")}>Staff</button>
        </div>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <article className="panel table-filters-panel">
        <div className="table-filters-grid">
          {tab === "students" ? (
            <>
              <label>
                Class
                <select value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId(""); }}>
                  <option value="">Select class</option>
                  {classes.map((item) => <option key={item._id} value={item._id}>{item.name} (Grade {item.grade_level})</option>)}
                </select>
              </label>

              <label>
                Section
                <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
                  <option value="">Select section</option>
                  {sectionOptions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
              </label>
            </>
          ) : null}

          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label>
            Checkpoint
            <select value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)}>
              <option value="start">Start</option>
              <option value="end">End</option>
            </select>
          </label>

          {tab === "students" ? (
            <label>
              Emergency Reason (optional)
              <input value={emergencyReason} onChange={(e) => setEmergencyReason(e.target.value)} placeholder="Required only for emergency override" />
            </label>
          ) : null}
        </div>
      </article>

      {tab === "students" ? (
        <article className="panel table-shell">
          <div className="table-actions">
            <button type="button" className="btn btn-primary" onClick={saveStudentAttendance} disabled={!selectedClassId || !selectedSectionId || rows.length === 0}>Save Attendance</button>
            <button type="button" className="btn btn-secondary" onClick={exportStudentCsv} disabled={!selectedClassId || !selectedSectionId}>Export CSV</button>
          </div>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Correction</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5}><p className="empty-state">Select class and section to begin marking.</p></td></tr>
                ) : rows.map((row) => (
                  <tr key={row.student_id}>
                    <td>{row.name}</td>
                    <td>{row.roll_no || "-"}</td>
                    <td>
                      <select value={row.status} onChange={(e) => setRows((prev) => prev.map((item) => item.student_id === row.student_id ? { ...item, status: e.target.value } : item))}>
                        {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </td>
                    <td>
                      <input value={row.remarks} onChange={(e) => setRows((prev) => prev.map((item) => item.student_id === row.student_id ? { ...item, remarks: e.target.value } : item))} />
                    </td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => correctStudentRecord(row)} disabled={!row.attendance_id}>
                        Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : (
        <article className="panel table-shell">
          <div className="table-actions">
            <button type="button" className="btn btn-primary" onClick={saveStaffAttendance} disabled={staffRoster.length === 0}>Save Attendance</button>
            <button type="button" className="btn btn-secondary" onClick={exportStaffCsv}>Export CSV</button>
          </div>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Marked By</th>
                  <th>Correction</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.length === 0 ? (
                  <tr><td colSpan={6}><p className="empty-state">No staff records for selected date/checkpoint.</p></td></tr>
                ) : staffRows.map((row) => (
                  <tr key={row.user_id}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>
                      <select value={row.status} onChange={(e) => setStaffRows((prev) => prev.map((item) => item.user_id === row.user_id ? { ...item, status: e.target.value } : item))}>
                        {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </td>
                    <td>
                      <input value={row.remarks} onChange={(e) => setStaffRows((prev) => prev.map((item) => item.user_id === row.user_id ? { ...item, remarks: e.target.value } : item))} />
                    </td>
                    <td>{row.marked_by || "-"}</td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => correctStaffRecord(row)} disabled={!row.attendance_id}>
                        Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}

export default AttendanceAdmin;
