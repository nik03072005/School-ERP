import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarOff,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { leaveService } from "../../api/leaveService";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

const STATUS_STYLES = {
  pending: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    label: "Pending Review",
    dot: "bg-amber-500",
  },
  approved: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "Approved",
    dot: "bg-emerald-500",
  },
  rejected: {
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    label: "Rejected",
    dot: "bg-rose-500",
  },
  cancelled: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Cancelled",
    dot: "bg-slate-400",
  },
};

const TYPE_LABEL = {
  sick: "Medical / Sick Leave",
  casual: "Casual Leave",
  emergency: "Emergency Absence",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  other: "Special / Other Leave",
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function LeavesAdmin() {
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewing, setReviewing] = useState(null); // { id, action }
  const [remark, setRemark] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.applicant_type = filterType;
      const data = await leaveService.getAllLeaves(params);
      setLeaves(data.leaves || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leave applications.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLeaves = useMemo(() => {
    if (!searchQuery.trim()) return leaves;
    const q = searchQuery.toLowerCase();
    return leaves.filter((l) => {
      const name = `${l.applicant?.first_name || ""} ${l.applicant?.last_name || ""}`.toLowerCase();
      const reason = l.reason?.toLowerCase() || "";
      return name.includes(q) || reason.includes(q);
    });
  }, [leaves, searchQuery]);

  const handleReview = async (id, status) => {
    setReviewing({ id, action: status });
    try {
      await leaveService.reviewLeave(id, { status, review_remarks: remark });
      setLeaves((prev) => prev.map((l) => (l._id === id ? { ...l, status, review_remarks: remark } : l)));
      setExpanded(null);
      setRemark("");
    } catch {
      alert("Failed to update leave status.");
    } finally {
      setReviewing(null);
    }
  };

  const toggle = (id) => {
    setExpanded((p) => (p === id ? null : id));
    setRemark("");
  };

  // Quick stats
  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* ── Executive Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="pointer-events-none absolute right-40 -bottom-10 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Calendar size={12} />
                Absence & Duty Operations
              </span>
              <span className="text-xs text-slate-400">Staff & Student Requests</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Leave Applications & Approvals
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Adjudicate faculty, staff, and student absence requests with audit remarks, supporting
              medical slips, and automated status logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_leaves" label="Policy Guide" />
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-50"
            >
              <Clock size={14} className={loading ? "animate-spin" : ""} />
              <span>Sync Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Requests</span>
            <Users size={16} className="text-cyan-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900">{total}</p>
            <span className="text-[11px] font-semibold text-slate-500">recorded leaves</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Pending Review</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600">
              {filterStatus === "pending" ? total : pendingCount}
            </p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              awaiting admin
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Approved</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-emerald-600">
              {filterStatus === "approved" ? total : approvedCount}
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              authorized
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Rejected / Denied</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-rose-600">
              {filterStatus === "rejected" ? total : rejectedCount}
            </p>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              declined
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by applicant name or justification reason..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            {[
              ["pending", "Pending"],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
              ["cancelled", "Cancelled"],
              ["", "All Requests"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilterStatus(val)}
                className={[
                  "rounded-lg px-2.5 py-1 transition",
                  filterStatus === val
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Applicant Category filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
          >
            <option value="">All Applicants</option>
            <option value="staff">Faculty & Staff</option>
            <option value="student">Enrolled Students</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Applications Directory ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-cyan-600 mb-2" />
            <p className="text-xs font-medium">Retrieving leave submissions...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <CalendarOff size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700">No leave requests found</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are no absence requests matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLeaves.map((leave) => {
              const statusCfg = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
              const isPending = leave.status === "pending";
              const isExpanded = expanded === leave._id;
              const applicantName = leave.applicant
                ? `${leave.applicant.first_name} ${leave.applicant.last_name}`
                : "Unknown Applicant";
              const isStaff = leave.applicant_type === "staff";

              return (
                <div key={leave._id} className="transition">
                  <div
                    onClick={() => toggle(leave._id)}
                    className="flex cursor-pointer flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition"
                  >
                    {/* Left: Applicant info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold text-xs ${
                          isStaff ? "bg-orange-100 text-orange-700" : "bg-cyan-100 text-cyan-700"
                        }`}
                      >
                        {isStaff ? <User size={18} /> : <GraduationCap size={18} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {applicantName}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                              isStaff
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-cyan-50 text-cyan-700 border-cyan-200"
                            }`}
                          >
                            {leave.applicant_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {TYPE_LABEL[leave.leave_type] || leave.leave_type} · Applied on{" "}
                          {formatDate(leave.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Duration & Dates */}
                    <div className="flex items-center gap-6 text-xs text-slate-600 sm:text-right">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Absence Window
                        </p>
                        <p className="font-semibold text-slate-800">
                          {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {leave.total_days} Day{leave.total_days !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusCfg.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isExpanded ? "rotate-180 text-cyan-600" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expandable Review & Details Tray */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-4">
                      {/* Reason */}
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Applicant Statement & Reason
                        </p>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                          {leave.reason || "No explicit reason was documented."}
                        </p>
                      </div>

                      {/* Documents / Slips */}
                      {leave.attachments?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Medical Certificates & Supporting Slips ({leave.attachments.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {leave.attachments.map((att, idx) =>
                              att.type === "image" ? (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:border-cyan-400 transition"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.filename || "Attachment"}
                                    className="h-16 w-16 object-cover"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-700 shadow-xs hover:border-cyan-400 transition"
                                >
                                  <FileText size={16} />
                                  <span>View Certificate</span>
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Existing Admin Remarks if already reviewed */}
                      {leave.review_remarks && (
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Official Reviewer Remarks
                          </p>
                          <p className="text-xs text-slate-700">{leave.review_remarks}</p>
                        </div>
                      )}

                      {/* Adjudication Controls if Pending */}
                      {isPending && (
                        <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/40 p-4 space-y-3">
                          <p className="text-xs font-bold text-slate-800">
                            Adjudicate Absence Request
                          </p>
                          <input
                            type="text"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add administrative decision note or justification (optional)..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                          />
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={!!reviewing}
                              onClick={() => handleReview(leave._id, "approved")}
                              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 shadow-xs shadow-emerald-600/20"
                            >
                              {reviewing?.id === leave._id && reviewing.action === "approved" ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}
                              <span>Authorize & Approve</span>
                            </button>

                            <button
                              type="button"
                              disabled={!!reviewing}
                              onClick={() => handleReview(leave._id, "rejected")}
                              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60 shadow-xs shadow-rose-600/20"
                            >
                              {reviewing?.id === leave._id && reviewing.action === "rejected" ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <XCircle size={14} />
                              )}
                              <span>Decline / Reject</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
