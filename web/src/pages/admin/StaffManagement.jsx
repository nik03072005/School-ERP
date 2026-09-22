import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Mail,
  Phone,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const loadStaff = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const params = {
        role: filters.staff_type || "teaching_staff,non_teaching_staff",
        search: debouncedSearch || undefined,
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
  }, [filters.is_active, debouncedSearch, filters.staff_type]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredStaff = useMemo(() => {
    if (!filters.staff_type) return staffUsers;
    return staffUsers.filter(
      (user) => user?.staff_profile?.staff_type === filters.staff_type || getRoleName(user) === filters.staff_type
    );
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
        setNotice(`Staff account for ${user.first_name} deactivated.`);
      } else {
        await adminService.activateUser(user._id);
        setNotice(`Staff account for ${user.first_name} activated.`);
      }
      await loadStaff(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update staff account status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header Card ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <UserCheck size={15} />
            Institutional Faculty & Staff
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Staff Management</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Oversee educators, administrative personnel, employee records, and portal permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-2xl bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-800 border border-cyan-200">
            {filteredStaff.length} Total Personnel
          </span>
          <button
            type="button"
            onClick={() => loadStaff(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
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
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search staff by name, email or phone..."
                className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div className="w-44">
              <select
                value={filters.staff_type}
                onChange={(e) => setFilter("staff_type", e.target.value)}
                className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              >
                <option value="">All Staff Classifications</option>
                <option value="teaching_staff">Teaching Faculty</option>
                <option value="non_teaching_staff">Administrative / Support</option>
              </select>
            </div>

            <div className="w-36">
              <select
                value={filters.is_active}
                onChange={(e) => setFilter("is_active", e.target.value)}
                className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              >
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>

          {(filters.search || filters.staff_type || filters.is_active) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-end sm:self-center"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Staff Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw size={24} className="mx-auto animate-spin text-cyan-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading staff records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee Name</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Emp Code</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      No staff records found.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((user) => {
                    const profile = user?.staff_profile;
                    const staffType = profile?.staff_type || getRoleName(user) || "-";
                    const isTeaching = staffType === "teaching_staff";

                    return (
                      <tr key={user._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 font-bold text-white text-xs shadow-2xs">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${
                              isTeaching
                                ? "bg-cyan-50 text-cyan-800 border border-cyan-200"
                                : "bg-purple-50 text-purple-800 border border-purple-200"
                            }`}
                          >
                            {isTeaching ? "Teaching Faculty" : "Staff / Admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 font-bold">
                          {profile?.employee_code || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-semibold">
                          {profile?.designation || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {profile?.department || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              user.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.is_active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              to={`/admin/staff/edit/${user._id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
                              title="Edit Details"
                            >
                              <Edit size={12} />
                              <span>Details</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => toggleActive(user)}
                              className={`rounded-lg p-1.5 transition ${
                                user.is_active
                                  ? "text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                              title={user.is_active ? "Deactivate Account" : "Activate Account"}
                            >
                              <Power size={13} />
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
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs">
            <span className="text-slate-500 font-medium">
              Page {pagination.page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                disabled={pagination.page >= totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffManagement;
