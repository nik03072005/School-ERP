import { useCallback, useEffect, useState } from "react";
import { CalendarOff, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { leaveService } from "../../api/leaveService";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const TYPE_LABEL = {
  sick: "Sick", casual: "Casual", emergency: "Emergency",
  maternity: "Maternity", paternity: "Paternity", other: "Other",
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function LeavesAdmin() {
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType, setFilterType] = useState("");
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

  useEffect(() => { load(); }, [load]);

  const handleReview = async (id, status) => {
    setReviewing({ id, action: status });
    try {
      await leaveService.reviewLeave(id, { status, review_remarks: remark });
      setLeaves((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
      setExpanded(null);
      setRemark("");
    } catch {
      alert("Failed to update leave status.");
    } finally {
      setReviewing(null);
    }
  };

  const toggle = (id) => { setExpanded((p) => (p === id ? null : id)); setRemark(""); };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Applications</h2>
          <p className="mt-1 text-sm text-slate-500">Review and approve leave requests from staff and students.</p>
        </div>
        <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {total} application{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[["", "All Status"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["cancelled", "Cancelled"]].map(
          ([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilterStatus(val)}
              className={[
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                filterStatus === val
                  ? "bg-cyan-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          )
        )}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="ml-auto rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <option value="">All Types</option>
          <option value="staff">Staff</option>
          <option value="student">Students</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <CalendarOff size={32} className="opacity-30" />
            <p className="text-sm">No leave applications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <div key={leave._id}>
                <button
                  type="button"
                  onClick={() => toggle(leave._id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                    <div className="min-w-0 flex-1 grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Applicant</p>
                        <p className="text-sm font-medium text-slate-800">
                          {leave.applicant
                            ? `${leave.applicant.first_name} ${leave.applicant.last_name}`
                            : "—"}
                        </p>
                        <p className="text-[11px] text-slate-400">{leave.applicant_type}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Type</p>
                        <p className="text-sm font-medium text-slate-800">{TYPE_LABEL[leave.leave_type] || leave.leave_type}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Dates</p>
                        <p className="text-sm text-slate-700">
                          {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                        </p>
                        <p className="text-[11px] text-slate-400">{leave.total_days} day{leave.total_days !== 1 ? "s" : ""}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Applied</p>
                        <p className="text-sm text-slate-600">{formatDate(leave.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[leave.status]}`}>
                      {leave.status}
                    </span>
                  </div>
                </button>

                {expanded === leave._id && (
                  <div className="mx-4 mb-4 space-y-3 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Reason</p>
                      <p className="text-sm text-slate-700">{leave.reason}</p>
                    </div>

                    {leave.attachments?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {leave.attachments.map((a, i) =>
                            a.type === "image" ? (
                              <a key={i} href={a.url} target="_blank" rel="noreferrer">
                                <img src={a.url} alt={a.filename} className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                              </a>
                            ) : (
                              <a key={i} href={a.url} target="_blank" rel="noreferrer"
                                className="flex h-16 w-24 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-cyan-600 font-medium">
                                View Doc
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {leave.review_remarks && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Admin Remark</p>
                        <p className="text-sm text-slate-600">{leave.review_remarks}</p>
                      </div>
                    )}

                    {leave.status === "pending" && (
                      <div className="space-y-2 border-t border-slate-200 pt-3">
                        <input
                          type="text"
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          placeholder="Remark (optional)"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!!reviewing}
                            onClick={() => handleReview(leave._id, "approved")}
                            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                          >
                            {reviewing?.id === leave._id && reviewing.action === "approved"
                              ? <Loader2 size={13} className="animate-spin" />
                              : <CheckCircle2 size={13} />}
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={!!reviewing}
                            onClick={() => handleReview(leave._id, "rejected")}
                            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {reviewing?.id === leave._id && reviewing.action === "rejected"
                              ? <Loader2 size={13} className="animate-spin" />
                              : <XCircle size={13} />}
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
