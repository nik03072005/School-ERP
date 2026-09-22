import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  DollarSign,
  GraduationCap,
  Megaphone,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import StatusBadge from "../../components/admin/StatusBadge";
import RoleBadge from "../../components/admin/RoleBadge";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

export default function AdminDashboard() {
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
        adminService.getAllUsers({ status: "approved", is_active: true }),
      ]);

      setSummary({
        pendingUsers: pendingUserRes?.pagination?.totalItems ?? pendingUserRes?.count ?? 0,
        pendingAdmissions: pendingAdmissionRes?.count ?? 0,
        allUsers: allUserRes?.pagination?.totalItems ?? allUserRes?.count ?? 0,
      });

      setPendingUsers((pendingUserRes.users || []).slice(0, 5));
      setPendingAdmissions((pendingAdmissionRes.students || []).slice(0, 5));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Executive Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="pointer-events-none absolute right-40 -bottom-10 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles size={12} />
                Executive Control Hub
              </span>
              <span className="text-xs text-slate-400">{todayStr}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Institutional Admin Console
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Real-time oversight across applicant onboarding, admission reviews, academic operations,
              and institutional compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_overview" label="Overview Guide" />

            <button
              type="button"
              onClick={loadSummary}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Refreshing..." : "Sync Stats"}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* ── Key Metrics KPI Grid ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* KPI 1: Pending Accounts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Accounts
            </span>
            <FeatureHelpButton guideKey="admin_approvals" label="Guide" className="py-0.5 px-2" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : Number(summary.pendingUsers || 0).toLocaleString()}
            </h3>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                summary.pendingUsers > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800",
              ].join(" ")}
            >
              {summary.pendingUsers > 0 ? "Action Required" : "All Clear"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">New faculty & student signup requests</p>
        </div>

        {/* KPI 2: Pending Admissions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Admissions
            </span>
            <FeatureHelpButton guideKey="admin_admissions" label="Guide" className="py-0.5 px-2" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : Number(summary.pendingAdmissions || 0).toLocaleString()}
            </h3>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                summary.pendingAdmissions > 0
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {summary.pendingAdmissions > 0 ? "In Review" : "Up to Date"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Student enrollment applications</p>
        </div>

        {/* KPI 3: Total System Users */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Active Users
            </span>
            <span className="rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5 text-[10px] font-bold border border-cyan-200">
              Active Roster
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : Number(summary.allUsers || 0).toLocaleString()}
            </h3>
            <span className="text-xs font-semibold text-cyan-600">Enterprise Cloud</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Staff, educators & enrolled students</p>
        </div>
      </div>

      {/* ── Quick Administrative Shortcuts ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Administrative Modules
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/attendance"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-cyan-500 hover:bg-cyan-50/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 group-hover:scale-105 transition">
              <CalendarCheck2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Attendance Ops</p>
              <p className="text-[10px] text-slate-500">Daily roll call & SMS</p>
            </div>
          </Link>

          <Link
            to="/admin/school-setup/class-section"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-500 hover:bg-indigo-50/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition">
              <Settings2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">School Setup</p>
              <p className="text-[10px] text-slate-500">Classes & Sections</p>
            </div>
          </Link>

          <Link
            to="/admin/fees/collection"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-amber-500 hover:bg-amber-50/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Fee Collection</p>
              <p className="text-[10px] text-slate-500">Dues & invoices</p>
            </div>
          </Link>

          <Link
            to="/admin/logbook"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-500 hover:bg-emerald-50/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Daily Logbook</p>
              <p className="text-[10px] text-slate-500">Curriculum pacing</p>
            </div>
          </Link>

          <Link
            to="/admin/notices"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-violet-500 hover:bg-violet-50/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 group-hover:scale-105 transition">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">School Notices</p>
              <p className="text-[10px] text-slate-500">Circulars & Events</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Action Tables: Pending Users & Admissions ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Panel 1: Pending User Accounts */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">Pending User Accounts</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {summary.pendingUsers}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FeatureHelpButton guideKey="admin_approvals" label="Guide" />
                <Link
                  to="/admin/users"
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-40 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-100 border-t-cyan-600" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ✓ No pending user accounts awaiting verification.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingUsers.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 font-bold text-xs">
                        {(item.first_name?.[0] || "") + (item.last_name?.[0] || "")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {item.first_name} {item.last_name}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={item?.role_id?.name || "student"} />
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-slate-600 hover:text-cyan-700 transition"
            >
              Open User Management Panel →
            </Link>
          </div>
        </div>

        {/* Panel 2: Pending Admissions */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Pending Admission Vetting</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  {summary.pendingAdmissions}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FeatureHelpButton guideKey="admin_admissions" label="Guide" />
                <Link
                  to="/admin/users"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Review</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-40 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-100 border-t-blue-600" />
              </div>
            ) : pendingAdmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ✓ All new admission forms have been processed.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingAdmissions.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold text-xs">
                        {(item?.user_id?.first_name?.[0] || "S") +
                          (item?.user_id?.last_name?.[0] || "")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {item?.user_id?.first_name} {item?.user_id?.last_name}
                        </p>
                        <p className="text-[11px] text-slate-500">{item?.user_id?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.admission_status} />
                      <Link
                        to={`/admin/admissions/${item._id}`}
                        className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <Link
              to="/admin/students"
              className="text-xs font-semibold text-slate-600 hover:text-blue-700 transition"
            >
              Open Student Records Roster →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

