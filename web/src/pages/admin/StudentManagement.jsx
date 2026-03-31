import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/adminService";
import StatusBadge from "../../components/admin/StatusBadge";

const INITIAL_FILTERS = {
  search: "",
  admission_status: "",
  is_active: "",
};

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, totalItems: 0 });

  const loadStudents = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await adminService.getAllUsers({
        role: "student",
        search: filters.search || undefined,
        is_active: filters.is_active || undefined,
        sort_by: "createdAt",
        sort_dir: "desc",
        page: pagination.page,
        limit: pagination.limit,
      });

      const nextStudents = data?.users || [];
      setStudents(nextStudents);
      setPagination((prev) => ({
        ...prev,
        page: data?.pagination?.page || prev.page,
        limit: data?.pagination?.limit || prev.limit,
        totalPages: data?.pagination?.totalPages || 1,
        totalItems: data?.pagination?.totalItems || nextStudents.length,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load students.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.is_active, filters.search, pagination.limit, pagination.page]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredStudents = useMemo(() => {
    if (!filters.admission_status) return students;
    return students.filter((user) => {
      const status = user?.student_profile?.admission_status || "not_submitted";
      return status === filters.admission_status;
    });
  }, [filters.admission_status, students]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === "search" || key === "is_active") {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleActive = async (user) => {
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user._id);
        setNotice("Student account deactivated.");
      } else {
        await adminService.activateUser(user._id);
        setNotice("Student account activated.");
      }
      await loadStudents(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update student account status.");
    }
  };

  return (
    <section className="space-y-4">
      <article className="panel panel-soft flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Students</h2>
          <p className="text-sm text-slate-600">Review student details, class assignment, and admission progress.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => loadStudents(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </article>

      <article className="panel panel-soft">
        <div className="table-filters">
          <label>
            Search
            <input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Name, email or mobile"
            />
          </label>

          <label>
            Admission Status
            <select
              value={filters.admission_status}
              onChange={(event) => setFilter("admission_status", event.target.value)}
            >
              <option value="">All</option>
              <option value="not_submitted">Not Submitted</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label>
            Activity
            <select value={filters.is_active} onChange={(event) => setFilter("is_active", event.target.value)}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </div>

        <div className="table-filter-actions">
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
        </div>
      </article>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}

      {loading ? (
        <div className="panel loading-panel"><div className="loader" /></div>
      ) : (
        <article className="panel table-shell">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Admission</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7}><p className="empty-state">No students found for selected filters.</p></td>
                  </tr>
                ) : (
                  filteredStudents.map((user) => {
                    const profile = user?.student_profile;
                    const admissionStatus = profile?.admission_status || "not_submitted";
                    const className = profile?.class_id?.name || profile?.class_applying || "Not assigned";
                    const sectionName = profile?.section_id?.name || "-";

                    return (
                      <tr key={user._id}>
                        <td>
                          <div className="table-primary">{user.first_name} {user.last_name}</div>
                          <p className="table-secondary">{user.email}</p>
                        </td>
                        <td>{user.mobile || "-"}</td>
                        <td>{className}</td>
                        <td>{sectionName}</td>
                        <td><StatusBadge status={admissionStatus} /></td>
                        <td>
                          <span className={`activity-pill ${user.is_active ? "active" : "inactive"}`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {profile?._id ? (
                              <Link className="btn btn-secondary" to={`/admin/admissions/${profile._id}`}>
                                View Details
                              </Link>
                            ) : null}
                            <Link className="btn btn-secondary" to={`/admin/admissions/edit/${user._id}`}>
                              {profile?._id ? "Update Form" : "Open Form"}
                            </Link>
                            <button type="button" className={user.is_active ? "btn btn-danger" : "btn btn-primary"} onClick={() => toggleActive(user)}>
                              {user.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

export default StudentManagement;
