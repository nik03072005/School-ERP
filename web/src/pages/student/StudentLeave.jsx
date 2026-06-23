import { useEffect, useState } from "react";
import { CalendarOff, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { leaveService } from "../../api/leaveService";

const LEAVE_TYPES = ["sick", "casual", "emergency", "other"];

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  leave_type: "sick",
  start_date: today(),
  end_date: today(),
  reason: "",
};

export default function StudentLeave() {
  const [tab, setTab] = useState("apply");
  const [form, setForm] = useState(EMPTY_FORM);
  const [leaves, setLeaves] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const d = await leaveService.getMyLeaves();
      setLeaves(d.leaves || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leave history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setError("Please provide a reason for leave.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await leaveService.applyLeave(form);
      setSuccess("Leave application submitted successfully!");
      setForm(EMPTY_FORM);
      loadLeaves();
      setTab("history");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this leave application?")) return;
    try {
      await leaveService.cancelLeave(id);
      loadLeaves();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
            <CalendarOff size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Leave Management</h1>
            <p className="text-sm text-slate-500">Apply for leave and track applications</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {[
          { key: "apply", label: "Apply Leave" },
          { key: "history", label: "My Applications" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              tab === key ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Apply tab */}
      {tab === "apply" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
        >
          <p className="text-sm font-semibold text-slate-700">Leave Application</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Leave Type</label>
              <select
                value={form.leave_type}
                onChange={(e) => setField("leave_type", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">From Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setField("start_date", e.target.value)}
                min={today()}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setField("end_date", e.target.value)}
                min={form.start_date}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setField("reason", e.target.value)}
              placeholder="Please describe the reason for your leave…"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <CalendarOff size={15} />}
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-amber-500" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <CalendarOff size={32} className="opacity-30" />
              <p className="text-sm">No leave applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">From</th>
                    <th className="px-4 py-3 text-left font-semibold">To</th>
                    <th className="px-4 py-3 text-left font-semibold">Days</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                    <th className="px-4 py-3 text-left font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaves.map((l) => {
                    const days =
                      Math.round(
                        (new Date(l.end_date) - new Date(l.start_date)) / 86400000
                      ) + 1;
                    return (
                      <tr key={l._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 capitalize font-medium text-slate-800">
                          {l.leave_type}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(l.start_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(l.end_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{days}d</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${
                              STATUS_COLORS[l.status] || "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-45 truncate text-xs text-slate-400">
                          {l.review_remarks || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {l.status === "pending" && (
                            <button
                              onClick={() => handleCancel(l._id)}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
