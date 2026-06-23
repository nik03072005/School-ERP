import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { leaveService } from "../api/leaveService";
import MediaUpload from "../components/MediaUpload";

const TYPE_OPTIONS = [
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  leave_type: "sick",
  start_date: today(),
  end_date: today(),
  reason: "",
  attachments: [],
};

export default function LeaveApply() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [myLeaves, setMyLeaves] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadMyLeaves = async () => {
    try {
      const data = await leaveService.getMyLeaves();
      setMyLeaves(data.leaves || []);
    } catch {
      // silent
    }
  };

  useEffect(() => { loadMyLeaves(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addAttachment = (media) =>
    setForm((f) => ({
      ...f,
      attachments: [...f.attachments, { url: media.url, type: media.type, filename: media.filename }],
    }));

  const removeAttachment = (idx) =>
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) { setError("Please provide a reason for the leave."); return; }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("End date must be on or after start date."); return;
    }

    setSubmitting(true);
    setError("");
    try {
      await leaveService.applyLeave(form);
      setSuccess(true);
      setForm(EMPTY_FORM);
      loadMyLeaves();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit leave application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this leave application?")) return;
    try {
      await leaveService.cancelLeave(id);
      setMyLeaves((prev) => prev.map((l) => (l._id === id ? { ...l, status: "cancelled" } : l)));
    } catch {
      alert("Failed to cancel leave.");
    }
  };

  const totalDays =
    form.start_date && form.end_date
      ? Math.max(1, Math.round((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)) + 1)
      : 1;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Leave Application</h2>
        <p className="mt-1 text-sm text-slate-500">Apply for leave and track the status of your applications.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Apply form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-slate-700">New Application</p>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Leave Type</label>
              <select
                value={form.leave_type}
                onChange={(e) => set("leave_type", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                <input
                  type="date"
                  value={form.start_date}
                  min={today()}
                  onChange={(e) => set("start_date", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || today()}
                  onChange={(e) => set("end_date", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
              </div>
            </div>

            {totalDays > 0 && (
              <p className="text-xs text-slate-500">
                Duration: <span className="font-semibold text-cyan-700">{totalDays} day{totalDays > 1 ? "s" : ""}</span>
              </p>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
                placeholder="Briefly describe the reason for leave…"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                required
              />
            </div>

            {/* Document upload */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Supporting Documents (optional)</label>
              {form.attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {form.attachments.map((a, i) => (
                    <div key={i} className="relative">
                      {a.type === "image" ? (
                        <img src={a.url} alt={a.filename} className="h-14 w-14 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                          Doc
                        </div>
                      )}
                      <button type="button" onClick={() => removeAttachment(i)}
                        className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow text-slate-400 hover:text-red-500 text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
              <MediaUpload label="Upload Medical Cert / Doc" onUpload={addAttachment} accept="image/*,video/*" />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {submitting ? "Submitting…" : "Submit Application"}
            </button>

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                <CheckCircle2 size={15} /> Application submitted successfully!
              </div>
            )}
          </div>
        </form>

        {/* My leaves history */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">My Applications</p>
            {myLeaves.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {myLeaves.map((leave) => (
                  <div key={leave._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 capitalize">{leave.leave_type}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[leave.status]}`}>
                          {leave.status}
                        </span>
                        {leave.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(leave._id)}
                            className="text-slate-300 hover:text-red-500"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatDate(leave.start_date)} → {formatDate(leave.end_date)} · {leave.total_days}d
                    </p>
                    {leave.review_remarks && (
                      <p className="mt-1 text-[11px] text-slate-600 italic">"{leave.review_remarks}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
