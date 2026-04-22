import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setupService } from "../../api/setupService";
import { attendanceService } from "../../api/attendanceService";
import { authService } from "../../api/authService";
import { useAuth } from "../../context/AuthContext";

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

function TeacherAttendance() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mark");
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
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadSections = async () => {
      try {
        const sectionData = await setupService.listSections({ is_active: true, class_teacher_user_id: user?.id });

        const list = sectionData.sections || [];
        const mine = list.filter(
          (section) =>
            String(section?.class_teacher_user_id?._id || section?.class_teacher_user_id || "") === String(user?.id)
        );

        setSections(mine);
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load sections");
      }
    };

    if (user?.id) {
      loadSections();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!markSectionId && sections.length > 0) {
      setMarkSectionId(String(sections[0]._id));
    }
    if (!recordSectionId && sections.length > 0) {
      setRecordSectionId(String(sections[0]._id));
    }
  }, [sections, markSectionId, recordSectionId]);

  useEffect(() => {
    if (!markSectionId) return;
    const stillAvailable = sections.some((item) => String(item._id) === String(markSectionId));
    if (!stillAvailable) {
      setMarkSectionId("");
      setMarkRows([]);
    }
  }, [sections, markSectionId]);

  useEffect(() => {
    if (!recordSectionId) return;
    const stillAvailable = sections.some((item) => String(item._id) === String(recordSectionId));
    if (!stillAvailable) {
      setRecordSectionId("");
      setRecordRows([]);
    }
  }, [sections, recordSectionId]);

  const selectedMarkSection = useMemo(
    () => sections.find((item) => String(item._id) === String(markSectionId)),
    [sections, markSectionId]
  );

  const selectedRecordSection = useMemo(
    () => sections.find((item) => String(item._id) === String(recordSectionId)),
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
      setMarkRows((data.rows || []).map((row) => ({ ...row, status: row.status || "present", remarks: row.remarks || "" })));
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
      setRecordRows((data.rows || []).map((row) => ({ ...row, status: row.status || "not_marked" })));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load attendance records");
    }
  };

  useEffect(() => {
    loadMarkDaily();
  }, [markSectionId, markDate, markCheckpoint]);

  useEffect(() => {
    loadRecordDaily();
  }, [recordSectionId, recordDate, recordCheckpoint]);

  const recordSummary = useMemo(() => {
    return recordRows.reduce((acc, row) => {
      const key = row.status || "not_marked";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [recordRows]);

  const saveAttendance = async () => {
    if (!selectedMarkSection) return;

    try {
      setError("");
      await attendanceService.markStudentBulk({
        class_id: selectedMarkSection?.class_id?._id,
        section_id: markSectionId,
        attendance_date: markDate,
        checkpoint: markCheckpoint,
        records: markRows.map((row) => ({ student_id: row.student_id, status: row.status, remarks: row.remarks })),
      });
      setNotice("Attendance saved");
      await loadMarkDaily();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save attendance");
    }
  };

  const exportCsv = async () => {
    if (!selectedRecordSection) {
      setError("Select section before exporting CSV.");
      return;
    }

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
    } catch (err) {
      setError(err?.response?.data?.message || "Could not export CSV");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Please fill all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    try {
      setError("");
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      await refreshUser();
      setNotice("Password updated successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update password");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <section className="basic-dashboard teacher-dashboard-shell">
      <div className="panel-head teacher-attendance-head">
        <div>
          <h2>Teacher Dashboard</h2>
          <p>Mark attendance, review records, and manage your account settings.</p>
        </div>
        <div className="teacher-dashboard-head-actions">
          <div className="chip-row">
            <button
              type="button"
              className={`btn ${activeTab === "mark" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("mark")}
            >
              Mark Attendance
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "records" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("records")}
            >
              Attendance Records
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "settings" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>
          <button
            type="button"
            className="teacher-attendance-signout inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      {activeTab === "mark" ? (
        <>
          <article className="panel table-filters-panel teacher-attendance-filters-panel">
            <div className="table-filters-grid teacher-attendance-filters-grid">
              <label className="teacher-attendance-filter-span-2">
                Allotted Section
                <select value={markSectionId} onChange={(e) => setMarkSectionId(e.target.value)}>
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
                <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
              </label>

              <label>
                Checkpoint
                <select value={markCheckpoint} onChange={(e) => setMarkCheckpoint(e.target.value)}>
                  <option value="start">Start</option>
                  <option value="end">End</option>
                </select>
              </label>
            </div>
          </article>

          <article className="panel table-shell teacher-attendance-table-shell">
            <div className="table-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveAttendance}
                disabled={!selectedMarkSection || markRows.length === 0}
              >
                Save Attendance
              </button>
            </div>
            <div className="table-scroll">
              <table className="admin-table teacher-attendance-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {markRows.length === 0 ? (
                    <tr><td colSpan={4}><p className="empty-state">Select your allotted section to start marking.</p></td></tr>
                  ) : markRows.map((row) => (
                    <tr key={row.student_id}>
                      <td>{row.name}</td>
                      <td>{row.roll_no || "-"}</td>
                      <td>
                        <select
                          value={row.status}
                          onChange={(e) => setMarkRows((prev) => prev.map((item) => item.student_id === row.student_id ? { ...item, status: e.target.value } : item))}
                        >
                          {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          value={row.remarks}
                          onChange={(e) => setMarkRows((prev) => prev.map((item) => item.student_id === row.student_id ? { ...item, remarks: e.target.value } : item))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}

      {activeTab === "records" ? (
        <>
          <article className="panel table-filters-panel teacher-attendance-filters-panel">
            <div className="table-filters-grid teacher-attendance-filters-grid">
              <label className="teacher-attendance-filter-span-2">
                Allotted Section
                <select value={recordSectionId} onChange={(e) => setRecordSectionId(e.target.value)}>
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section?.class_id?.name} - Section {section.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Record Date
                <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
              </label>

              <label>
                Checkpoint
                <select value={recordCheckpoint} onChange={(e) => setRecordCheckpoint(e.target.value)}>
                  <option value="start">Start</option>
                  <option value="end">End</option>
                </select>
              </label>

              <label>
                Export From
                <input type="date" value={recordFromDate} onChange={(e) => setRecordFromDate(e.target.value)} />
              </label>

              <label>
                Export To
                <input type="date" value={recordToDate} onChange={(e) => setRecordToDate(e.target.value)} />
              </label>
            </div>
            <div className="table-actions">
              <button type="button" className="btn btn-ghost" onClick={loadRecordDaily} disabled={!selectedRecordSection}>
                Refresh Records
              </button>
              <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={!selectedRecordSection}>
                Export CSV
              </button>
            </div>
          </article>

          <article className="panel teacher-record-summary">
            <div className="teacher-record-summary-grid">
              <div className="teacher-record-card">
                <p>Total Students</p>
                <h3>{recordRows.length}</h3>
              </div>
              {Object.keys(recordSummary).map((key) => (
                <div className="teacher-record-card" key={key}>
                  <p>{key.replace("_", " ")}</p>
                  <h3>{recordSummary[key]}</h3>
                </div>
              ))}
            </div>
          </article>

          <article className="panel table-shell teacher-attendance-table-shell">
            <div className="table-scroll">
              <table className="admin-table teacher-attendance-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Last Marked</th>
                  </tr>
                </thead>
                <tbody>
                  {recordRows.length === 0 ? (
                    <tr><td colSpan={5}><p className="empty-state">No records found for selected section/date.</p></td></tr>
                  ) : recordRows.map((row) => (
                    <tr key={row.student_id}>
                      <td>{row.name}</td>
                      <td>{row.roll_no || "-"}</td>
                      <td>{row.status || "not_marked"}</td>
                      <td>{row.remarks || "-"}</td>
                      <td>{row.marked_at ? new Date(row.marked_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}

      {activeTab === "settings" ? (
        <div className="teacher-settings-grid">
          <article className="panel">
            <h3 className="teacher-settings-title">Profile Details</h3>
            <p className="teacher-settings-copy">Profile data is visible but read-only here.</p>

            <div className="form-grid teacher-settings-form-grid">
              <label>
                First Name
                <input value={user?.first_name || ""} disabled />
              </label>
              <label>
                Last Name
                <input value={user?.last_name || ""} disabled />
              </label>
              <label>
                Email
                <input value={user?.email || ""} disabled />
              </label>
              <label>
                Mobile
                <input value={user?.mobile || ""} disabled />
              </label>
              <label>
                Role
                <input value={user?.role || ""} disabled />
              </label>
              <label>
                Account Status
                <input value={user?.status || ""} disabled />
              </label>
            </div>
          </article>

          <article className="panel">
            <h3 className="teacher-settings-title">Change Password</h3>
            <p className="teacher-settings-copy">Update your login password securely.</p>

            <form className="create-form" onSubmit={changePassword}>
              <label>
                Current Password
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </label>

              <div className="table-actions">
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default TeacherAttendance;
