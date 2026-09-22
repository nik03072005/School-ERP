import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeIndianRupee,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { payrollService } from "../../../api/payrollService";
import { currency, MONTH_NAMES } from "../../../utils/indianCurrency";
import PayslipModal from "../../../components/payroll/PayslipModal";
import SlipOverrideModal from "../../../components/payroll/SlipOverrideModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_CONFIG = {
  draft:     { cls: "bg-slate-100 text-slate-600",     label: "Draft" },
  processed: { cls: "bg-amber-100 text-amber-700",     label: "Processed" },
  approved:  { cls: "bg-cyan-100 text-cyan-700",       label: "Approved" },
  disbursed: { cls: "bg-emerald-100 text-emerald-700", label: "Disbursed" },
};

const StatPill = ({ label, value, color }) => (
  <div className={`rounded-xl border px-3 py-2 ${color}`}>
    <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
    <div className="mt-0.5 text-base font-black tabular-nums">{value}</div>
  </div>
);

const BANK_OPTIONS = [
  { code: "sbi",    label: "🏦 SBI Corporate CMP",       sub: "NEFT/Intra-bank CSV" },
  { code: "hdfc",   label: "🏦 HDFC Enet Bulk Upload",   sub: "FT/NEFT CSV" },
  { code: "pnb",    label: "🏦 PNB Corporate IB",        sub: "Beneficiary List CSV" },
  { code: "master", label: "📊 Master Payroll Register", sub: "Full Audit CSV" },
];

// Disburse modal
function DisburseModal({ batch, onClose, onDisbursed }) {
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("NEFT");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await payrollService.updateBatchStatus(batch._id, {
        status: "disbursed",
        disbursement_reference: utr,
        payment_method: method,
        notes,
      });
      onDisbursed?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to disburse.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-emerald-600" />
            <span className="text-sm font-black text-slate-900">Mark as Disbursed</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">✕</button>
        </div>
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>
        )}
        <div className="p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {["NEFT", "RTGS", "IMPS", "Bank Transfer", "Cash"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">UTR / Transaction Reference</label>
            <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. SBI-NEFT-20260930-XXXX" className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Notes (Optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50">
            <CheckCircle2 size={13} />
            {saving ? "Saving…" : "Confirm Disbursement"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollBatchDetail() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [staffTypeFilter, setStaffTypeFilter] = useState("");
  const [bankMenuOpen, setBankMenuOpen] = useState(false);

  const [viewSlip, setViewSlip] = useState(null);
  const [editSlip, setEditSlip] = useState(null);
  const [disburseOpen, setDisburseOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await payrollService.getBatchById(batchId, {
        search: search || undefined,
        staff_type: staffTypeFilter || undefined,
      });
      setBatch(data.batch);
      setSlips(data.slips);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load batch.");
    } finally {
      setLoading(false);
    }
  }, [batchId, search, staffTypeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    try {
      setError("");
      await payrollService.updateBatchStatus(batchId, { status: "approved" });
      setNotice("Payroll batch approved successfully.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to approve.");
    } finally {
      setTimeout(() => setNotice(""), 3000);
    }
  };

  const handleDownload = (bankCode) => {
    const token = localStorage.getItem("school_erp_token");
    const url = `${API_BASE}/payroll/batches/${batchId}/export-bank/${bankCode}`;
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "");
    // append auth header via fetch approach
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        a.href = objUrl;
        const monthStr = MONTH_NAMES[batch?.month] || "";
        a.download = `Payroll_${monthStr}_${batch?.year}_${bankCode.toUpperCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objUrl);
      });
    setBankMenuOpen(false);
  };

  if (loading && !batch) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <Loader2 size={24} className="animate-spin text-cyan-600" />
      </div>
    );
  }

  const monthLabel = batch ? `${MONTH_NAMES[batch.month]} ${batch.year}` : "";
  const statusCfg = STATUS_CONFIG[batch?.status] || STATUS_CONFIG.draft;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <Link to="/admin/payroll" className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-cyan-600">
              <ArrowLeft size={13} /> Back to Payroll
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
              <BadgeIndianRupee size={14} /> Payroll Batch Detail
            </div>
            <h1 className="mt-1 text-xl font-black text-slate-900">{monthLabel}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-400">{batch?.batch_code}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${statusCfg.cls}`}>{statusCfg.label}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={load} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              <RefreshCw size={12} /> Refresh
            </button>

            {batch?.status === "processed" && (
              <button onClick={handleApprove} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-3 py-2 text-xs font-bold text-white hover:from-cyan-500 hover:to-cyan-600">
                <ShieldCheck size={13} /> Approve Batch
              </button>
            )}

            {batch?.status === "approved" && (
              <button onClick={() => setDisburseOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-emerald-600">
                <Wallet size={13} /> Mark as Disbursed
              </button>
            )}

            {/* Bank Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBankMenuOpen((p) => !p)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Download size={13} /> Export Payout <ChevronDown size={11} />
              </button>
              {bankMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-60 rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {BANK_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleDownload(opt.code)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <span className="text-base leading-none">{opt.label.slice(0, 2)}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{opt.label.slice(3)}</div>
                        <div className="text-[10px] text-slate-400">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={14} className="text-emerald-600" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          <AlertCircle size={14} className="text-rose-500" /> {error}
        </div>
      )}

      {/* ── Summary Pills ── */}
      {batch && (
        <div className="flex flex-wrap gap-3">
          <StatPill label="Staff" value={batch.staff_count} color="border-slate-200 text-slate-800" />
          <StatPill label="Gross Pay" value={currency(batch.total_gross_pay)} color="border-emerald-200 text-emerald-800" />
          <StatPill label="Net Pay" value={currency(batch.total_net_pay)} color="border-cyan-200 text-cyan-800" />
          <StatPill label="EPF" value={currency(batch.total_epf)} color="border-amber-200 text-amber-800" />
          <StatPill label="ESI" value={currency(batch.total_esi)} color="border-violet-200 text-violet-800" />
          <StatPill label="Prof Tax" value={currency(batch.total_pt)} color="border-blue-200 text-blue-800" />
          <StatPill label="TDS" value={currency(batch.total_tds)} color="border-orange-200 text-orange-800" />
          <StatPill label="LOP Deductions" value={currency(batch.total_lop_deductions)} color="border-rose-200 text-rose-800" />
          {batch.disbursement_reference && (
            <StatPill label="UTR / Ref" value={batch.disbursement_reference} color="border-emerald-200 text-emerald-700" />
          )}
        </div>
      )}

      {/* ── Slips Table ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff name or code…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-semibold text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </div>
          <select
            value={staffTypeFilter}
            onChange={(e) => setStaffTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
          >
            <option value="">All Staff</option>
            <option value="teaching_staff">Teaching Staff</option>
            <option value="non_teaching_staff">Non-Teaching Staff</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">
            <Users size={12} className="inline mr-1" />{slips.length} records
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-cyan-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Emp Code", "Name", "Designation", "Gross", "EPF", "ESI", "PT", "LOP Ded.", "Net Salary", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slips.map((s) => {
                  const slipStatus = STATUS_CONFIG[s.status] || STATUS_CONFIG.processed;
                  return (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3">
                        <div className="font-bold text-xs text-slate-700">{s.employee_code}</div>
                        <div className="text-[10px] text-slate-400">{s.staff_type === "teaching_staff" ? "TCH" : "NTS"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-xs text-slate-900 whitespace-nowrap">{s.employee_name}</div>
                        <div className="text-[10px] text-slate-400">{s.department}</div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.designation}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 tabular-nums whitespace-nowrap">{currency(s.gross_earnings)}</td>
                      <td className="px-3 py-3 text-xs text-amber-700 tabular-nums">{currency(s.epf_employee)}</td>
                      <td className="px-3 py-3 text-xs text-violet-700 tabular-nums">{currency(s.esi_employee)}</td>
                      <td className="px-3 py-3 text-xs text-blue-700 tabular-nums">{currency(s.professional_tax)}</td>
                      <td className="px-3 py-3 text-xs tabular-nums">
                        <span className={s.lop_deduction > 0 ? "font-bold text-rose-700" : "text-slate-400"}>
                          {currency(s.lop_deduction)}
                        </span>
                        {s.lop_days > 0 && <div className="text-[10px] text-rose-400">{s.lop_days}d LOP</div>}
                      </td>
                      <td className="px-3 py-3 font-black text-emerald-700 tabular-nums whitespace-nowrap">{currency(s.net_salary)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${slipStatus.cls}`}>
                          {slipStatus.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewSlip(s)}
                            className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:text-cyan-700"
                          >
                            <Eye size={12} /> View
                          </button>
                          {batch?.status !== "disbursed" && (
                            <button
                              onClick={() => setEditSlip(s)}
                              className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700"
                            >
                              <Edit3 size={12} /> Adjust
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {slips.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">No salary slips match your filters.</div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewSlip && <PayslipModal slip={viewSlip} onClose={() => setViewSlip(null)} />}
      {editSlip && (
        <SlipOverrideModal
          slip={editSlip}
          onClose={() => setEditSlip(null)}
          onSaved={() => { load(); setEditSlip(null); }}
        />
      )}
      {disburseOpen && (
        <DisburseModal
          batch={batch}
          onClose={() => setDisburseOpen(false)}
          onDisbursed={() => { load(); setNotice("Payroll disbursed and all slips marked as Paid."); setTimeout(() => setNotice(""), 4000); }}
        />
      )}
    </div>
  );
}

