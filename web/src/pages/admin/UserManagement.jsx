import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import { uploadAvatarToR2 } from "../../api/r2Upload";
import StatusBadge from "../../components/admin/StatusBadge";
import RoleBadge from "../../components/admin/RoleBadge";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

const TAB_OPTIONS = [
  { value: "pending", label: "Pending Accounts", icon: Clock },
  { value: "admissions", label: "Submitted Admissions", icon: GraduationCap },
  { value: "all", label: "All Users Directory", icon: Users },
];

const CREATE_ROLES = [
  { value: "student", label: "Student" },
  { value: "teaching_staff", label: "Teaching Staff" },
  { value: "non_teaching_staff", label: "Non-Teaching Staff" },
  { value: "admin", label: "Admin" },
];

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  password: "",
  role: "student",
};

const INITIAL_EDIT_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  password: "",
};

const INITIAL_FILTERS = {
  search: "",
  role: "",
  status: "",
  is_active: "",
  created_from: "",
  created_to: "",
};

const FILTERED_ROLES = [
  { value: "", label: "All Roles" },
  { value: "student", label: "Student" },
  { value: "teaching_staff", label: "Teaching Staff" },
  { value: "non_teaching_staff", label: "Non-Teaching Staff" },
  { value: "admin", label: "Admin" },
];

const FILTERED_STATUS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const FILTERED_ACTIVE = [
  { value: "", label: "All Activity" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const USER_SORTABLE_FIELDS = ["first_name", "email", "status", "createdAt"];
const hasStaffRole = (role) => role === "teaching_staff" || role === "non_teaching_staff";

function UserManagement() {
  const [tab, setTab] = useState("pending");
  const [users, setUsers] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createForm, setCreateForm] = useState(INITIAL_FORM);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploadStatus, setAvatarUploadStatus] = useState("idle");
  const [avatarUploadUrl, setAvatarUploadUrl] = useState("");
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, totalItems: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const resetPageOnFilter = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        if (tab === "admissions") {
          const data = await adminService.getPendingAdmissions({
            search: debouncedSearch || undefined,
            created_from: filters.created_from || undefined,
            created_to: filters.created_to || undefined,
          });
          setAdmissions(data.students || []);
          setPagination((prev) => ({
            ...prev,
            totalItems: data.count || 0,
            totalPages: 1,
          }));
        } else {
          const params = {
            search: debouncedSearch || undefined,
            role: filters.role || undefined,
            status: filters.status || undefined,
            is_active: filters.is_active || undefined,
            created_from: filters.created_from || undefined,
            created_to: filters.created_to || undefined,
            sort_by: sortBy,
            sort_dir: sortDir,
            page: pagination.page,
            limit: pagination.limit,
          };

          const data =
            tab === "pending"
              ? await adminService.getPendingUsers(params)
              : await adminService.getAllUsers(params);

          setUsers(data.users || []);
          setPagination((prev) => ({
            ...prev,
            page: data?.pagination?.page || prev.page,
            limit: data?.pagination?.limit || prev.limit,
            totalPages: data?.pagination?.totalPages || 1,
            totalItems: data?.pagination?.totalItems || data.count || 0,
          }));
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load data. Please retry.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      debouncedSearch,
      filters.created_from,
      filters.created_to,
      filters.is_active,
      filters.role,
      filters.status,
      pagination.limit,
      pagination.page,
      sortBy,
      sortDir,
      tab,
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredAdmissions = useMemo(() => {
    let next = [...admissions];

    if (filters.status) {
      next = next.filter((student) => student?.user_id?.status === filters.status);
    }
    if (filters.is_active) {
      const activeValue = filters.is_active === "true";
      next = next.filter((student) => Boolean(student?.user_id?.is_active) === activeValue);
    }
    if (filters.role) {
      next = next.filter((student) => student?.user_id?.role_id?.name === filters.role);
    }

    if (sortBy === "first_name") {
      next.sort((a, b) => {
        const aName = `${a?.user_id?.first_name || ""} ${a?.user_id?.last_name || ""}`.trim();
        const bName = `${b?.user_id?.first_name || ""} ${b?.user_id?.last_name || ""}`.trim();
        return sortDir === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    }

    if (sortBy === "createdAt") {
      next.sort((a, b) => {
        const aDate = a?.admission_submitted_at ? new Date(a.admission_submitted_at).getTime() : 0;
        const bDate = b?.admission_submitted_at ? new Date(b.admission_submitted_at).getTime() : 0;
        return sortDir === "asc" ? aDate - bDate : bDate - aDate;
      });
    }

    return next;
  }, [admissions, filters.is_active, filters.role, filters.status, sortBy, sortDir]);

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!createForm.first_name || !createForm.last_name || !createForm.email || !createForm.password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (createForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await adminService.createUser({
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim().toLowerCase(),
        mobile: createForm.mobile.trim() || undefined,
        password: createForm.password,
        role: createForm.role,
        avatar: avatarUploadUrl || undefined,
      });

      setNotice("User created successfully.");
      setCreateForm(INITIAL_FORM);
      setAvatarFile(null);
      setAvatarUploadUrl("");
      setAvatarUploadStatus("idle");
      setShowCreateModal(false);
      await loadData(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create user.");
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async () => {
    if (!dialog) return;

    const { type, id } = dialog;

    try {
      if (type === "approve") await adminService.approveUser(id);
      if (type === "reject") await adminService.rejectUser(id);
      if (type === "activate") await adminService.activateUser(id);
      if (type === "deactivate") await adminService.deactivateUser(id);
      if (type === "delete") await adminService.deleteUser(id);

      setNotice(type === "delete" ? "User deleted successfully." : `User ${type}d successfully.`);
      await loadData(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed.");
    } finally {
      setDialog(null);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      password: "",
    });
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;

    if (!editForm.first_name || !editForm.last_name || !editForm.email) {
      setError("First name, last name and email are required.");
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSavingEdit(true);
      await adminService.updateUser(editingUser._id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email.trim().toLowerCase(),
        mobile: editForm.mobile.trim() || undefined,
        password: editForm.password || undefined,
      });

      setEditingUser(null);
      setEditForm(INITIAL_EDIT_FORM);
      setNotice("User updated successfully.");
      await loadData(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update user.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    resetPageOnFilter();
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSortBy("createdAt");
    setSortDir("desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleSort = (field) => {
    if (!USER_SORTABLE_FIELDS.includes(field)) return;
    setSortBy((prev) => {
      if (prev !== field) {
        setSortDir("asc");
        return field;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
    resetPageOnFilter();
  };

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarUploadUrl("");
    setAvatarUploadError("");

    if (!file) {
      setAvatarUploadStatus("idle");
      return;
    }

    setAvatarUploadStatus("uploading");
    try {
      const uploadedUrl = await uploadAvatarToR2(
        file,
        `${createForm.first_name || "user"}-${createForm.last_name || "avatar"}`
      );
      setAvatarUploadUrl(uploadedUrl);
      setAvatarUploadStatus("uploaded");
    } catch (uploadErr) {
      setAvatarUploadStatus("failed");
      setAvatarUploadError(uploadErr?.message || "Avatar upload failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Shield size={14} />
            Institutional User Directory
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">User Management</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Provision user credentials, review applications, and manage system permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 transition hover:from-cyan-500 hover:to-cyan-600"
          >
            <UserPlus size={14} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* ── Notices & Errors ── */}
      {notice ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ── Tab Bar Navigation ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {TAB_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setTab(item.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={14} className={isActive ? "text-cyan-400" : "text-slate-400"} />
              <span>{item.label}</span>
              {item.value === "admissions" && admissions.length > 0 ? (
                <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300">
                  {admissions.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls Card ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={14} className="text-cyan-600" />
            <span>Search & Refine Users</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((p) => !p)}
            className="text-xs font-semibold text-cyan-700 hover:underline"
          >
            {showFilters ? "Collapse Filters" : "Expand Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Search</label>
              <div className="relative mt-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Name, email, mobile..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              >
                {FILTERED_ROLES.map((item) => (
                  <option key={item.value || "all"} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              >
                {FILTERED_STATUS.map((item) => (
                  <option key={item.value || "all"} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Account Activity</label>
              <select
                value={filters.is_active}
                onChange={(e) => handleFilterChange("is_active", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              >
                {FILTERED_ACTIVE.map((item) => (
                  <option key={item.value || "all"} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium">
                Showing {tab === "admissions" ? filteredAdmissions.length : pagination.totalItems} entries
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw size={24} className="mx-auto animate-spin text-cyan-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading directory records...</p>
          </div>
        ) : tab === "admissions" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Admission Status</th>
                  <th className="px-4 py-3">Submitted On</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No admissions match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAdmissions.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 font-bold text-xs">
                            {student?.user_id?.first_name?.[0] || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {student?.user_id?.first_name} {student?.user_id?.last_name}
                            </p>
                            <RoleBadge role={student?.user_id?.role_id?.name || "student"} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{student?.user_id?.email || "-"}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={student?.admission_status || "pending"} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {student?.admission_submitted_at
                          ? new Date(student.admission_submitted_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/admin/admissions/${student._id}`}
                            className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-800 transition hover:bg-cyan-100"
                          >
                            View Dossier
                          </Link>
                          <Link
                            to={`/admin/admissions/edit/${student?.user_id?._id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit Form
                          </Link>
                        </div>
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
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("first_name")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>User</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("createdAt")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Registered</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No users found for this filter selection.
                    </td>
                  </tr>
                ) : (
                  users.map((item) => {
                    const roleName = item?.role_id?.name || item?.role || "student";
                    const isStaff = hasStaffRole(roleName);
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.avatar ? (
                              <img
                                src={item.avatar}
                                alt=""
                                className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                                {item.first_name?.[0] || "U"}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">
                                {item.first_name} {item.last_name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span>{item.email}</span>
                                {item.mobile ? <span>&bull; {item.mobile}</span> : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <RoleBadge role={roleName} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.is_active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Edit User"
                            >
                              <Pencil size={13} />
                            </button>

                            {item.status === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDialog({
                                      type: "approve",
                                      id: item._id,
                                      title: "Approve User",
                                      message: `Approve user account for ${item.first_name} ${item.last_name}?`,
                                    })
                                  }
                                  className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDialog({
                                      type: "reject",
                                      id: item._id,
                                      title: "Reject User",
                                      message: `Reject user account for ${item.first_name} ${item.last_name}?`,
                                    })
                                  }
                                  className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 border border-rose-200 hover:bg-rose-100"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}

                            {roleName === "student" && (
                              <Link
                                to={`/admin/admissions/edit/${item._id}`}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {item.has_admission_form ? "Update Form" : "Fill Form"}
                              </Link>
                            )}

                            {isStaff && (
                              <Link
                                to={`/admin/staff/edit/${item._id}`}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {item.has_staff_details ? "Update Details" : "Fill Details"}
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setDialog({
                                  type: item.is_active ? "deactivate" : "activate",
                                  id: item._id,
                                  title: item.is_active ? "Deactivate User" : "Activate User",
                                  message: `${item.is_active ? "Deactivate" : "Activate"} account for ${item.first_name}?`,
                                })
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title={item.is_active ? "Deactivate" : "Activate"}
                            >
                              <UserCheck size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDialog({
                                  type: "delete",
                                  id: item._id,
                                  title: "Delete User",
                                  message: `Permanently delete user record for ${item.first_name} ${item.last_name}? This cannot be undone.`,
                                })
                              }
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                              title="Delete User"
                            >
                              <Trash2 size={13} />
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
        {tab !== "admissions" && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs">
            <span className="text-slate-500 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(p.page - 1, 1) }))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.page + 1, pagination.totalPages) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create User Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-cyan-600" />
                <h3 className="font-extrabold text-slate-900">Provision New User Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">First Name *</label>
                  <input
                    required
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, first_name: e.target.value }))}
                    className="mt-1"
                    placeholder="E.g. Aryan"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Last Name *</label>
                  <input
                    required
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, last_name: e.target.value }))}
                    className="mt-1"
                    placeholder="E.g. Sharma"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1"
                    placeholder="aryan@school.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <input
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="mt-1"
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="mt-1"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Assigned System Role</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {CREATE_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, role: r.value }))}
                      className={`rounded-xl border p-2 text-xs font-bold transition ${
                        createForm.role === r.value
                          ? "border-cyan-500 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-200"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Profile Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={handleAvatarSelect} className="mt-1" />
                {avatarUploadStatus === "uploading" && <p className="mt-1 text-[11px] text-cyan-600">Uploading avatar...</p>}
                {avatarUploadStatus === "uploaded" && <p className="mt-1 text-[11px] text-emerald-600">Avatar uploaded.</p>}
                {avatarUploadStatus === "failed" && <p className="mt-1 text-[11px] text-rose-600">{avatarUploadError}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
                >
                  {creating ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-cyan-600" />
                <h3 className="font-extrabold text-slate-900">
                  Edit User: {editingUser.first_name} {editingUser.last_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">First Name</label>
                  <input
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Last Name</label>
                  <input
                    required
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Mobile</label>
                  <input
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter new password if updating"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          onConfirm={handleAction}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

export default UserManagement;
