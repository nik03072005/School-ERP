import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/adminService";
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

function UserManagement() {
  const [tab, setTab] = useState("pending");
  const [users, setUsers] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createForm, setCreateForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState(null);

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      if (tab === "admissions") {
        const data = await adminService.getPendingAdmissions();
        setAdmissions(data.students || []);
      } else if (tab === "pending") {
        const data = await adminService.getPendingUsers();
        setUsers(data.users || []);
      } else {
        const data = await adminService.getAllUsers();
        setUsers(data.users || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load data. Please retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const counts = useMemo(
    () => ({
      pending: tab === "pending" ? users.length : 0,
      admissions: tab === "admissions" ? admissions.length : 0,
      all: tab === "all" ? users.length : 0,
    }),
    [admissions.length, tab, users.length]
  );

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

    try {
      setCreating(true);
      await adminService.createUser({
        ...createForm,
        email: createForm.email.trim().toLowerCase(),
        mobile: createForm.mobile.trim() || undefined,
      });
      setCreateForm(INITIAL_FORM);
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

      setNotice(`User ${type}d successfully.`);
      await loadData(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed.");
    } finally {
      setDialog(null);
    }
  };

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>User Management</h2>
          <p>Create users, approve accounts, and review admissions.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => loadData(true)} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <article className="panel create-panel">
        <h3>Create User</h3>
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

          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Creating..." : "Create User"}
          </button>
        </form>
      </article>

      <div className="tab-strip">
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tab-btn ${tab === item.value ? "active" : ""}`}
            onClick={() => setTab(item.value)}
          >
            <span>{item.label}</span>
            {counts[item.value] > 0 ? <strong>{counts[item.value]}</strong> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel loading-panel"><div className="loader" /></div>
      ) : tab === "admissions" ? (
        <div className="card-grid">
          {admissions.length === 0 ? (
            <article className="panel empty-panel">No pending admissions.</article>
          ) : (
            admissions.map((student) => (
              <article key={student._id} className="panel item-card">
                <div>
                  <h3>
                    {student?.user_id?.first_name} {student?.user_id?.last_name}
                  </h3>
                  <p>{student?.user_id?.email}</p>
                </div>
                <StatusBadge status={student.admission_status} />
                <p>
                  Submitted {student.admission_submitted_at ? new Date(student.admission_submitted_at).toLocaleDateString() : "-"}
                </p>
                <Link className="btn btn-secondary" to={`/admin/admissions/${student._id}`}>
                  View Full Details
                </Link>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="card-grid">
          {users.length === 0 ? (
            <article className="panel empty-panel">No users found for this tab.</article>
          ) : (
            users.map((user) => {
              const role = user?.role_id?.name || "student";
              return (
                <article key={user._id} className="panel item-card">
                  <div>
                    <h3>
                      {user.first_name} {user.last_name}
                    </h3>
                    <p>{user.email}</p>
                    {user.mobile ? <p>{user.mobile}</p> : null}
                  </div>
                  <div className="chip-row">
                    <StatusBadge status={user.status} />
                    <RoleBadge role={role} />
                  </div>
                  <p>Registered {new Date(user.createdAt).toLocaleDateString()}</p>
                  <div className="item-actions">
                    {tab === "pending" ? (
                      <>
                        <button type="button" className="btn btn-primary" onClick={() => setDialog({ action: "approve", id: user._id })}>
                          Approve
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => setDialog({ action: "reject", id: user._id })}>
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        {user.is_active ? (
                          <button type="button" className="btn btn-danger" onClick={() => setDialog({ action: "deactivate", id: user._id })}>
                            Deactivate
                          </button>
                        ) : (
                          <button type="button" className="btn btn-primary" onClick={() => setDialog({ action: "activate", id: user._id })}>
                            Activate
                          </button>
                        )}
                      </>
                    )}
                    {tab === "all" && role === "student" ? (
                      <Link className="btn btn-secondary" to={`/admin/admissions/edit/${user._id}`}>
                        Manage Admission Form
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog ? `${dialog.action[0].toUpperCase()}${dialog.action.slice(1)} user` : ""}
        message="Please confirm this admin action."
        confirmText={dialog ? dialog.action : "confirm"}
        variant={dialog?.action === "reject" || dialog?.action === "deactivate" ? "danger" : "default"}
        onCancel={() => setDialog(null)}
        onConfirm={() => runUserAction(dialog.action, dialog.id)}
      />
    </section>
  );
}

export default UserManagement;
