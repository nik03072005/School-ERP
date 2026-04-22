import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/adminService";

const INITIAL_FILTERS = {
  search: "",
  staff_type: "",
  is_active: "",
};

const isStaffRole = (role) => role === "teaching_staff" || role === "non_teaching_staff";
const getRoleName = (user) => user?.role_id?.name || user?.role || "";

function StaffManagement() {
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  const loadStaff = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {
        search: filters.search || undefined,
        is_active: filters.is_active || undefined,
        sort_by: "createdAt",
        sort_dir: "desc",
        page: 1,
        limit: 500,
      };

      const data = await adminService.getAllUsers(params);
      const nextUsers = (data?.users || []).filter((user) => isStaffRole(getRoleName(user)));
      nextUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setStaffUsers(nextUsers);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load staff users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.is_active, filters.search]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredStaff = useMemo(() => {
    if (!filters.staff_type) return staffUsers;
    return staffUsers.filter((user) => user?.staff_profile?.staff_type === filters.staff_type);
  }, [filters.staff_type, staffUsers]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  const paginatedStaff = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredStaff.slice(start, start + pagination.limit);
  }, [filteredStaff, pagination.limit, pagination.page]);

  useEffect(() => {
    if (pagination.page > totalPages) {
      setPagination((prev) => ({ ...prev, page: totalPages }));
    }
  }, [pagination.page, totalPages]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleActive = async (user) => {
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user._id);
        setNotice("Staff account deactivated.");
      } else {
        await adminService.activateUser(user._id);
        setNotice("Staff account activated.");
      }
      await loadStaff(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update staff account status.");
    }
  };

  return (
    <section className="space-y-4">
      <article className="panel panel-soft flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff</h2>
          <p className="text-sm text-slate-600">Review employee codes, staff details, and account activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => loadStaff(true)} disabled={refreshing}>
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
            Staff Type
            <select value={filters.staff_type} onChange={(event) => setFilter("staff_type", event.target.value)}>
              <option value="">All</option>
              <option value="teaching_staff">Teaching Staff</option>
              <option value="non_teaching_staff">Non-Teaching Staff</option>
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
                  <th>Staff</th>
                  <th>Type</th>
                  <th>Employee Code</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7}><p className="empty-state">No staff found for selected filters.</p></td>
                  </tr>
                ) : (
                  paginatedStaff.map((user) => {
                    const profile = user?.staff_profile;
                    const staffType = profile?.staff_type || getRoleName(user) || "-";
                    return (
                      <tr key={user._id}>
                        <td>
                          <div className="table-primary">{user.first_name} {user.last_name}</div>
                          <p className="table-secondary">{user.email}</p>
                        </td>
                        <td>{staffType === "teaching_staff" ? "Teaching" : "Non-Teaching"}</td>
                        <td>{profile?.employee_code || "-"}</td>
                        <td>{profile?.designation || "-"}</td>
                        <td>{profile?.department || "-"}</td>
                        <td>
                          <span className={`activity-pill ${user.is_active ? "active" : "inactive"}`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link className="btn btn-secondary" to={`/admin/staff/edit/${user._id}`}>
                              Edit Details
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
            <span>Page {pagination.page} of {totalPages}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
              disabled={pagination.page >= totalPages}
            >
              Next
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

export default StaffManagement;
