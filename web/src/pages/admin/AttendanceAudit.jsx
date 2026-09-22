import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { attendanceService } from "../../api/attendanceService";
import { adminService } from "../../api/adminService";

const TARGET_FILTERS = [
  { label: "All Target Entities", value: "all" },
  { label: "Students", value: "student" },
  { label: "Staff Faculty", value: "staff" },
];

const LIMIT_OPTIONS = [50, 100, 200];

const formatUser = (user) => {
  if (!user) return "—";
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return fullName || user.email || "—";
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <ShieldCheck size={15} />
            Institutional Compliance & Integrity
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Attendance Audit Trail
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Immutable timeline of record overrides, manual corrections, status changes, and authorized actors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAudit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Sync Trail</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
          <ShieldAlert size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Controls ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Target Classification</label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setSubjectUserId("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              {TARGET_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Specific Subject Account</label>
            <select
              value={subjectUserId}
              onChange={(e) => setSubjectUserId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">All Users</option>
              {subjectOptions.map((user) => (
                <option key={user._id} value={user._id}>
                  {`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Log Scope</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              {LIMIT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  Last {item} Corrections
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Search Trail</label>
            <div className="relative mt-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Reason, actor, name..."
                className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Audit Trail Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
            <p className="mt-2 text-xs font-bold text-slate-500">Retrieving security audit trail...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Subject User</th>
                  <th className="px-4 py-3">State Transition</th>
                  <th className="px-4 py-3">Audit Reason</th>
                  <th className="px-5 py-3 text-right">Authorized Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      No correction audit records recorded for this filter scope.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                        {formatDateTime(record.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            record.target_type === "student"
                              ? "bg-cyan-50 text-cyan-800 border border-cyan-200"
                              : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {record.target_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {record.action || "Correction"}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{formatUser(record.subject_user_id)}</p>
                        <p className="text-[11px] text-slate-400">{record.subject_user_id?.email || ""}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize">
                            {record.old_status || "—"}
                          </span>
                          <ArrowRight size={11} className="text-slate-400" />
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 capitalize">
                            {record.new_status || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-amber-50/80 px-2 py-1 text-xs font-semibold text-amber-900 border border-amber-200 block max-w-xs truncate">
                          {record.reason || "Administrative correction"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                        {formatUser(record.actor_user_id)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceAudit;
