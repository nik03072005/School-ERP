import { useEffect, useMemo, useState } from "react";
import { setupService } from "../../api/setupService";
import { attendanceService } from "../../api/attendanceService";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = ["present", "absent", "late", "half_day", "leave_pending", "leave_approved"];

function TeacherAttendance() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkpoint, setCheckpoint] = useState("start");
  const [rows, setRows] = useState([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadSections = async () => {
      try {
        const [sectionData, assignmentData] = await Promise.all([
          setupService.listSections({ is_active: true }),
          setupService.listTeacherAssignments({ teacher_user_id: user?.id, is_active: true }),
        ]);

        const sectionMap = new Map((sectionData.sections || []).map((section) => [String(section._id), section]));
        const mine = (assignmentData.assignments || [])
          .map((assignment) => sectionMap.get(String(assignment.section_id?._id || assignment.section_id)))
          .filter(Boolean);

        setSections(mine);
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load sections");
      }
    };

    if (user?.id) {
      loadSections();
    }
  }, [user?.id]);

  const selectedSection = useMemo(
    () => sections.find((item) => String(item._id) === String(selectedSectionId)),
    [sections, selectedSectionId]
  );

  const loadDaily = async () => {
    if (!selectedSection) return;

    try {
      const data = await attendanceService.getStudentDaily({
        class_id: selectedSection?.class_id?._id,
        section_id: selectedSectionId,
        attendance_date: date,
        checkpoint,
      });
      setRows((data.rows || []).map((row) => ({ ...row, status: row.status || "present", remarks: row.remarks || "" })));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load attendance sheet");
    }
  };

  useEffect(() => {
    loadDaily();
  }, [selectedSectionId, date, checkpoint]);

  const save = async () => {
    if (!selectedSection) return;

    try {
      await attendanceService.markStudentBulk({
        class_id: selectedSection?.class_id?._id,
        section_id: selectedSectionId,
        attendance_date: date,
        checkpoint,
        emergency_reason: emergencyMode ? emergencyReason : undefined,
        records: rows.map((row) => ({ student_id: row.student_id, status: row.status, remarks: row.remarks })),
      });
      setNotice("Attendance saved");
      await loadDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save attendance");
    }
  };

  return (
    <section className="basic-dashboard">
      <div className="panel-head">
        <div>
          <h2>Teacher Attendance</h2>
          <p>Mark start/end checkpoint attendance for your assigned section.</p>
        </div>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <article className="panel table-filters-panel">
        <div className="table-filters-grid">
          <label>
            Section
            <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section?.class_id?.name} - Section {section.name}
                </option>
              ))}
            </select>
          </label>

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

          <label className="toggle-item">
            <span>Emergency Override</span>
            <input type="checkbox" checked={emergencyMode} onChange={(e) => setEmergencyMode(e.target.checked)} />
          </label>

          {emergencyMode ? (
            <label>
              Emergency Reason
              <input value={emergencyReason} onChange={(e) => setEmergencyReason(e.target.value)} required={emergencyMode} />
            </label>
          ) : null}
        </div>
      </article>

      <article className="panel table-shell">
        <div className="table-actions">
          <button type="button" className="btn btn-primary" onClick={save} disabled={!selectedSection || rows.length === 0}>Save Attendance</button>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4}><p className="empty-state">Select section to start marking.</p></td></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default TeacherAttendance;
