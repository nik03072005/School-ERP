import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/adminService";
import { uploadAvatarToR2 } from "../../api/r2Upload";
import StatusBadge from "../../components/admin/StatusBadge";
import RoleBadge from "../../components/admin/RoleBadge";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

const TAB_OPTIONS = [
  { value: "pending", label: "Accounts" },
  { value: "admissions", label: "Admissions" },
  { value: "all", label: "All Users" },
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
  const filterContentRef = useRef(null);
  const [filterContentHeight, setFilterContentHeight] = useState("0px");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const resetPageOnFilter = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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

        const data = tab === "pending"
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
  }, [debouncedSearch, filters.created_from, filters.created_to, filters.is_active, filters.role, filters.status, pagination.limit, pagination.page, sortBy, sortDir, tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!showCreateModal) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowCreateModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCreateModal]);

  useEffect(() => {
    if (!filterContentRef.current) return;

    if (showFilters) {
      setFilterContentHeight(`${filterContentRef.current.scrollHeight}px`);
    } else {
      setFilterContentHeight("0px");
    }
  }, [showFilters, filters, tab]);

  const counts = useMemo(
    () => ({
      pending: tab === "pending" ? pagination.totalItems : 0,
      admissions: tab === "admissions" ? admissions.length : 0,
      all: tab === "all" ? pagination.totalItems : 0,
    }),
    [admissions.length, pagination.totalItems, tab]
  );

  const filteredAdmissions = useMemo(() => {
    const list = [...admissions];

    const useStatus = filters.status;
    const useActive = filters.is_active;
    const useRole = filters.role;

    let next = list;

    if (useStatus) {
      next = next.filter((student) => student?.user_id?.status === useStatus);
    }

    if (useActive) {
      const activeValue = useActive === "true";
      next = next.filter((student) => Boolean(student?.user_id?.is_active) === activeValue);
    }

    if (useRole) {
      next = next.filter((student) => student?.user_id?.role_id?.name === useRole);
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
      setError("First name, last name, email and password are required.");
      return;
    }

    if (createForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (avatarFile && avatarUploadStatus === "uploading") {
      setError("Avatar is still uploading. Please wait.");
      return;
    }

    if (avatarFile && avatarUploadStatus !== "uploaded") {
      setError("Avatar upload failed. Please reselect image.");
      return;
    }

    try {
      setCreating(true);
      await adminService.createUser({
        ...createForm,
        email: createForm.email.trim().toLowerCase(),
        mobile: createForm.mobile.trim() || undefined,
        avatar: avatarUploadUrl || undefined,
      });

      setCreateForm(INITIAL_FORM);
      setAvatarFile(null);
      setAvatarUploadStatus("idle");
      setAvatarUploadUrl("");
      setAvatarUploadError("");
      setShowCreateModal(false);
      setNotice("User created successfully.");
      await loadData(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create user.");
    } finally {
      setCreating(false);
    }
  };

  const runUserAction = async (type, id) => {
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

    setSortBy((prevSortBy) => {
      if (prevSortBy !== field) {
        setSortDir("asc");
        return field;
      }

      setSortDir((prevSortDir) => (prevSortDir === "asc" ? "desc" : "asc"));
      return prevSortBy;
    });
    resetPageOnFilter();
  };

  const getStudentFormAction = (user) => {
    const label = user?.has_admission_form ? "Update Form" : "Fill Form";
    return (
      <Link className="btn btn-secondary" to={`/admin/admissions/edit/${user._id}`}>
        {label}
      </Link>
    );
  };

  const getStaffFormAction = (user) => {
    const label = user?.has_staff_details ? "Update Details" : "Fill Details";
    return (
      <Link className="btn btn-secondary" to={`/admin/staff/edit/${user._id}`}>
        {label}
      </Link>
    );
  };

  const totalPages = pagination.totalPages || 1;

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
    <section>
      <div className="panel-head">
        <div>
          <h2>User Management</h2>
          <p>Create users, approve accounts, and review admissions.</p>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-primary create-trigger"
            onClick={() => setShowCreateModal(true)}
            aria-label="Open create user form"
          >
            +
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadData(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      {showCreateModal ? (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <article className="modal-card modal-card-lg create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Create User</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Close</button>
            </div>
            <form className="create-form" onSubmit={handleCreateUser}>
              <div className="form-grid">
                <label>
                  First Name
                  <input value={createForm.first_name} onChange={(e) => setCreateForm((p) => ({ ...p, first_name: e.target.value }))} />
                </label>
                <label>
                  Last Name
                  <input value={createForm.last_name} onChange={(e) => setCreateForm((p) => ({ ...p, last_name: e.target.value }))} />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </label>
                <label>
                  Mobile
                  <input value={createForm.mobile} onChange={(e) => setCreateForm((p) => ({ ...p, mobile: e.target.value }))} />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </label>
                <label>
                  Avatar (optional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                  />
                  {avatarUploadStatus === "uploading" ? <small>Uploading avatar...</small> : null}
                  {avatarUploadStatus === "uploaded" ? <small>Avatar uploaded successfully.</small> : null}
                  {avatarUploadStatus === "failed" ? <small>{avatarUploadError || "Avatar upload failed."}</small> : null}
                </label>
              </div>

              <div className="role-picker">
                {CREATE_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    className={`role-option ${createForm.role === role.value ? "active" : ""}`}
                    onClick={() => setCreateForm((p) => ({ ...p, role: role.value }))}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {editingUser ? (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <article className="modal-card modal-card-lg create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit User</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>Close</button>
            </div>
            <form className="create-form" onSubmit={handleUpdateUser}>
              <div className="form-grid">
                <label>
                  First Name
                  <input value={editForm.first_name} onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))} />
                </label>
                <label>
                  Last Name
                  <input value={editForm.last_name} onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))} />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </label>
                <label>
                  Mobile
                  <input value={editForm.mobile} onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))} />
                </label>
                <label>
                  New Password (optional)
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={editForm.password}
                    onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      <div className="tab-strip">
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tab-btn ${tab === item.value ? "active" : ""}`}
            onClick={() => {
              setTab(item.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <span>{item.label}</span>
            {counts[item.value] > 0 ? <strong>{counts[item.value]}</strong> : null}
          </button>
        ))}
      </div>

      <article className="panel table-filters-panel">
        <div className="table-filter-head">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-expanded={showFilters}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <span>{tab === "admissions" ? `${filteredAdmissions.length} admissions` : `${pagination.totalItems} users`} found</span>
        </div>

        <div
          ref={filterContentRef}
          className={`table-filters-collapse ${showFilters ? "open" : ""}`}
          style={{ maxHeight: filterContentHeight }}
        >
          <div className="table-filters-grid">
            <label>
              Search
              <input
                placeholder="Name, email, mobile"
                value={filters.search}
                onChange={(event) => handleFilterChange("search", event.target.value)}
              />
            </label>

            <label>
              Role
              <select value={filters.role} onChange={(event) => handleFilterChange("role", event.target.value)}>
                {FILTERED_ROLES.map((item) => (
                  <option key={item.value || "all"} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)}>
                {FILTERED_STATUS.map((item) => (
                  <option key={item.value || "all"} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Activity
              <select value={filters.is_active} onChange={(event) => handleFilterChange("is_active", event.target.value)}>
                {FILTERED_ACTIVE.map((item) => (
                  <option key={item.value || "all"} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Registered From
              <input type="date" value={filters.created_from} onChange={(event) => handleFilterChange("created_from", event.target.value)} />
            </label>

            <label>
              Registered To
              <input type="date" value={filters.created_to} onChange={(event) => handleFilterChange("created_to", event.target.value)} />
            </label>
          </div>

          <div className="table-filter-actions">
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      </article>

      {loading ? (
        <div className="panel loading-panel"><div className="loader" /></div>
      ) : tab === "admissions" ? (
        <article className="panel table-shell">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("first_name")}>Student</button>
                  </th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("createdAt")}>Submitted</button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5}><p className="empty-state">No admissions found for selected filters.</p></td>
                  </tr>
                ) : (
                  filteredAdmissions.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="table-primary">{student?.user_id?.first_name} {student?.user_id?.last_name}</div>
                        <RoleBadge role={student?.user_id?.role_id?.name || "student"} />
                      </td>
                      <td>{student?.user_id?.email || "-"}</td>
                      <td><StatusBadge status={student?.admission_status || "pending"} /></td>
                      <td>{student?.admission_submitted_at ? new Date(student.admission_submitted_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <div className="table-actions">
                          <Link className="btn btn-secondary" to={`/admin/admissions/${student._id}`}>
                            View Details
                          </Link>
                          <Link className="btn btn-secondary" to={`/admin/admissions/edit/${student?.user_id?._id}`}>
                            Update Form
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ) : (
        <article className="panel table-shell">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("first_name")}>User</button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("email")}>Email</button>
                  </th>
                  <th>Role</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("status")}>Status</button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("createdAt")}>Registered</button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6}><p className="empty-state">No users found for selected filters.</p></td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const role = user?.role_id?.name || "student";
                    return (
                      <tr key={user._id}>
                        <td>
                          <div className="table-primary">{user.first_name} {user.last_name}</div>
                          {user.mobile ? <p className="table-secondary">{user.mobile}</p> : null}
                        </td>
                        <td>{user.email}</td>
                        <td><RoleBadge role={role} /></td>
                        <td>
                          <div className="chip-row">
                            <StatusBadge status={user.status} />
                            <span className={`activity-pill ${user.is_active ? "active" : "inactive"}`}>
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-actions">
                            {tab === "pending" ? (
                              <>
                                <button type="button" className="btn btn-primary" onClick={() => setDialog({ action: "approve", id: user._id })}>
                                  Approve
                                </button>
                                <button type="button" className="btn btn-danger" onClick={() => setDialog({ action: "reject", id: user._id })}>
                                  Reject
                                </button>
                              </>
                            ) : user.is_active ? (
                              <button type="button" className="btn btn-danger" onClick={() => setDialog({ action: "deactivate", id: user._id })}>
                                Deactivate
                              </button>
                            ) : (
                              <button type="button" className="btn btn-primary" onClick={() => setDialog({ action: "activate", id: user._id })}>
                                Activate
                              </button>
                            )}

                            {role === "student" ? getStudentFormAction(user) : null}
                            {hasStaffRole(role) ? getStaffFormAction(user) : null}

                            <button type="button" className="btn btn-secondary" onClick={() => openEditModal(user)}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => setDialog({ action: "delete", id: user._id })}>
                              Delete
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

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog ? `${dialog.action[0].toUpperCase()}${dialog.action.slice(1)} user` : ""}
        message={dialog?.action === "delete" ? "This will permanently delete the user and their profile. This cannot be undone." : "Please confirm this admin action."}
        confirmText={dialog ? dialog.action : "confirm"}
        variant={["reject", "deactivate", "delete"].includes(dialog?.action) ? "danger" : "default"}
        onCancel={() => setDialog(null)}
        onConfirm={() => runUserAction(dialog.action, dialog.id)}
      />
    </section>
  );
}

export default UserManagement;
