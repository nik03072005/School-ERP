const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  not_submitted: "Not Submitted",
};

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  not_submitted: "bg-slate-200 text-slate-700",
};

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const tone = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

export default StatusBadge;
