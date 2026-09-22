import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileEdit,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Power,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import StatusBadge from "../../components/admin/StatusBadge";

const INITIAL_FILTERS = {
  search: "",
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
      if (refresh) setRefreshing(true);
      else setLoading(true);

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
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredStudents = useMemo(() => {
    return students.filter((user) => {
      const status = user?.student_profile?.admission_status || "not_submitted";
      return status === "approved";
    });
  }, [students]);

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
        setNotice(`Student ${user.first_name} deactivated.`);
      } else {
        await adminService.activateUser(user._id);
        setNotice(`Student ${user.first_name} activated.`);
      }
      await loadStudents(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update student account status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <GraduationCap size={15} />
            Enrolled Student Body
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Student Directory</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Browse enrolled students, inspect class placements, roll assignments, and admission profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-2xl bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-800 border border-cyan-200">
            {filteredStudents.length} Active Enrolled
          </span>
          <button
            type="button"
            onClick={() => loadStudents(true)}
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

      {/* ── Filter Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search student by name, email or mobile..."
                className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div className="w-40">
              <select
                value={filters.is_active}
                onChange={(e) => setFilter("is_active", e.target.value)}
                className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              >
                <option value="">All Activity Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>

          {(filters.search || filters.is_active) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-end sm:self-center"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Students Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw size={24} className="mx-auto animate-spin text-cyan-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading student directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Class & Section</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Portal State</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      No enrolled students match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((user) => {
                    const profile = user?.student_profile;
                    const admissionStatus = profile?.admission_status || "not_submitted";
                    const admissionNumber = profile?.admission_no || "—";
                    const className = profile?.class_id?.name || profile?.class_applying || "Unassigned";
                    const sectionName = profile?.section_id?.name || "—";
                    const rollNumber = profile?.roll_no || "—";

                    return (
                      <tr key={user._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 font-bold text-white text-xs shadow-2xs">
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
                        <td className="px-4 py-3.5 text-slate-600">
                          {user.mobile ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              {user.mobile}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                            {admissionNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700">{rollNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800 border border-cyan-100">
                            {className} {sectionName !== "—" ? `(${sectionName})` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={admissionStatus} />
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
                            {profile?._id ? (
                              <Link
                                to={`/admin/admissions/${profile._id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
                                title="View Admission Dossier"
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">Dossier</span>
                              </Link>
                            ) : null}

                            {user?.student_profile?._id ? (
                              <Link
                                to={`/admin/tc-generator?studentId=${user.student_profile._id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                                title="Issue Transfer Certificate (TC)"
                              >
                                <Award size={12} />
                                <span className="hidden sm:inline">TC</span>
                              </Link>
                            ) : null}

                            <Link
                              to={`/admin/admissions/edit/${user._id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              title="Update Admission Form"
                            >
                              <FileEdit size={12} />
                              <span className="hidden sm:inline">Edit Form</span>
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

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs">
            <span className="text-slate-500 font-medium">
              Page {pagination.page} of {pagination.totalPages}
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
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))
                }
                disabled={pagination.page >= pagination.totalPages}
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

export default StudentManagement;
