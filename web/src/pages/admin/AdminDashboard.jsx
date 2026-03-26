import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/adminService";
import StatusBadge from "../../components/admin/StatusBadge";
import RoleBadge from "../../components/admin/RoleBadge";

function AdminDashboard() {
  const [summary, setSummary] = useState({ pendingUsers: 0, pendingAdmissions: 0, allUsers: 0 });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingAdmissions, setPendingAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    try {
      setError("");
      setLoading(true);

      const [pendingUserRes, pendingAdmissionRes, allUserRes] = await Promise.all([
          adminService.getPendingUsers(),
          adminService.getPendingAdmissions(),
          adminService.getAllUsers(),
      ]);

      setSummary({
        pendingUsers: pendingUserRes.count || 0,
        pendingAdmissions: pendingAdmissionRes.count || 0,
        allUsers: allUserRes.count || 0,
      });

      setPendingUsers((pendingUserRes.users || []).slice(0, 4));
      setPendingAdmissions((pendingAdmissionRes.students || []).slice(0, 4));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <section className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Quick visibility into approvals and admissions pending action.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSummary}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Accounts</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{loading ? "..." : summary.pendingUsers}</h3>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Admissions</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{loading ? "..." : summary.pendingAdmissions}</h3>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Users</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{loading ? "..." : summary.allUsers}</h3>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-700">Pending User Accounts</h3>
            <Link
              to="/admin/users"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              Open
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-36 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              No pending accounts right now.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RoleBadge role={user?.role_id?.name || "student"} />
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-700">Pending Admissions</h3>
            <Link
              to="/admin/users"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              Review
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-36 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
            </div>
          ) : pendingAdmissions.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              No pending admission forms.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingAdmissions.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item?.user_id?.first_name} {item?.user_id?.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{item?.user_id?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.admission_status} />
                    <Link
                      to={`/admin/admissions/${item._id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default AdminDashboard;
