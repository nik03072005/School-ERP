import { useEffect, useMemo, useState } from "react";
import { attendanceService } from "../../api/attendanceService";
import { adminService } from "../../api/adminService";

const TARGET_FILTERS = [
  { label: "All", value: "all" },
  { label: "Student", value: "student" },
  { label: "Staff", value: "staff" },
];

const LIMIT_OPTIONS = [50, 100, 200];

const formatUser = (user) => {
  if (!user) return "-";
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return fullName || user.email || "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

function AttendanceAudit() {
  const [targetType, setTargetType] = useState("all");
  const [subjectUserId, setSubjectUserId] = useState("");
  const [limit, setLimit] = useState(100);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubjects = async (type) => {
    try {
      if (type === "student") {
        const data = await adminService.getAllUsers({ role: "student", limit: 200 });
        setSubjectOptions(data.users || []);
        return;
      }

      if (type === "staff") {
        const [teaching, nonTeaching] = await Promise.all([
          adminService.getAllUsers({ role: "teaching_staff", limit: 200 }),
          adminService.getAllUsers({ role: "non_teaching_staff", limit: 200 }),
        ]);

        const combined = [...(teaching.users || []), ...(nonTeaching.users || [])];
        const unique = Array.from(new Map(combined.map((user) => [String(user._id), user])).values());
        setSubjectOptions(unique);
        return;
      }

      const [students, teaching, nonTeaching] = await Promise.all([
        adminService.getAllUsers({ role: "student", limit: 200 }),
        adminService.getAllUsers({ role: "teaching_staff", limit: 200 }),
        adminService.getAllUsers({ role: "non_teaching_staff", limit: 200 }),
      ]);

      const combined = [
        ...(students.users || []),
        ...(teaching.users || []),
        ...(nonTeaching.users || []),
      ];
      const unique = Array.from(new Map(combined.map((user) => [String(user._id), user])).values());
      setSubjectOptions(unique);
    } catch {
      setSubjectOptions([]);
    }
  };

  const loadAudit = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { limit };
      if (targetType !== "all") params.target_type = targetType;
      if (subjectUserId) params.subject_user_id = subjectUserId;

      const data = await attendanceService.listAudit(params);
      setRecords(data.records || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load attendance audit records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects(targetType);
  }, [targetType]);

  useEffect(() => {
    loadAudit();
  }, [targetType, subjectUserId, limit]);

  const filteredRecords = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return records;

    return records.filter((record) => {
      const subject = formatUser(record.subject_user_id).toLowerCase();
      const actor = formatUser(record.actor_user_id).toLowerCase();
      const reason = String(record.reason || "").toLowerCase();
      const action = String(record.action || "").toLowerCase();
      const type = String(record.target_type || "").toLowerCase();
      return [subject, actor, reason, action, type].some((item) => item.includes(term));
    });
  }, [records, search]);

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>Attendance Audit Trail</h2>
          <p>Track every correction, emergency override, and attendance change.</p>
        </div>
      </div>

      {error ? <p className="alert error">{error}</p> : null}

      <article className="panel table-filters-panel">
        <div className="table-filters-grid">
          <label>
            Target Type
            <select value={targetType} onChange={(event) => { setTargetType(event.target.value); setSubjectUserId(""); }}>
              {TARGET_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subject User
            <select value={subjectUserId} onChange={(event) => setSubjectUserId(event.target.value)}>
              <option value="">All users</option>
              {subjectOptions.map((user) => (
                <option key={user._id} value={user._id}>
                  {`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            API Limit
            <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
              {LIMIT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Local Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by subject, actor, reason, action"
            />
          </label>
        </div>
      </article>

      <article className="panel table-shell">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Action</th>
                <th>Subject</th>
                <th>Old → New</th>
                <th>Reason</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <p className="empty-state">Loading audit records...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <p className="empty-state">No audit records found for current filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>{formatDateTime(record.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${record.target_type === "student" ? "status-approved" : "status-pending"}`}>
                        {record.target_type}
                      </span>
                    </td>
                    <td>{record.action || "-"}</td>
                    <td>
                      <div className="table-primary">{formatUser(record.subject_user_id)}</div>
                      <div className="table-secondary">{record.subject_user_id?.email || ""}</div>
                    </td>
                    <td>
                      <div>{`${record.old_status || "-"} -> ${record.new_status || "-"}`}</div>
                      <div className="table-secondary">{`Remarks: ${record.old_remarks || "-"} -> ${record.new_remarks || "-"}`}</div>
                    </td>
                    <td>{record.reason || "-"}</td>
                    <td>
                      <div className="table-primary">{formatUser(record.actor_user_id)}</div>
                      <div className="table-secondary">{record.actor_user_id?.email || ""}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default AttendanceAudit;
