import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  FileText,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { payrollService } from "../../api/payrollService";
import { currency, MONTH_NAMES } from "../../utils/indianCurrency";
import PayslipModal from "../../components/payroll/PayslipModal";

const STATUS_CONFIG = {
  draft:     { cls: "bg-slate-100 text-slate-600",     label: "Draft" },
  processed: { cls: "bg-amber-100 text-amber-700",     label: "Processed" },
  approved:  { cls: "bg-cyan-100 text-cyan-700",       label: "Approved" },
  paid:      { cls: "bg-emerald-100 text-emerald-700", label: "Paid" },
};

export default function TeacherPayslips() {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewSlip, setViewSlip] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await payrollService.getMyPayslips();
      setSlips(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load payslips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
          <BadgeIndianRupee size={15} />
          Payroll Self-Service
        </div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">My Salary Slips</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          View, download, and print your monthly salary slips. All figures include statutory EPF, ESI, Professional Tax & TDS deductions.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          <AlertCircle size={14} className="text-rose-500" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <Loader2 size={22} className="animate-spin text-cyan-600" />
        </div>
      ) : slips.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <IndianRupee size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No payslips available yet</p>
          <p className="text-xs text-slate-400 mt-1">Your salary slips will appear here once the administrator processes monthly payroll.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slips.map((s) => {
            const monthLabel = `${MONTH_NAMES[s.month] || s.month} ${s.year}`;
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.processed;

            return (
              <div
                key={s._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-sm transition-shadow"
              >
                {/* Month badge */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-black text-slate-900">{monthLabel}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.slip_number}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Key Figures */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Gross Earnings</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{currency(s.gross_earnings)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Deductions</span>
                    <span className="font-semibold text-rose-700 tabular-nums">–{currency(s.total_deductions)}</span>
                  </div>
                  {s.lop_days > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">LOP ({s.lop_days} days)</span>
                      <span className="text-rose-500 tabular-nums">–{currency(s.lop_deduction)}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between">
                    <span className="text-xs font-bold text-slate-700">Net Salary</span>
                    <span className="text-base font-black text-emerald-700 tabular-nums">{currency(s.net_salary)}</span>
                  </div>
                </div>

                {/* Statutory breakdown chips */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {[
                    { label: "EPF", val: s.epf_employee, color: "bg-amber-50 text-amber-700 border-amber-200" },
                    { label: "ESI", val: s.esi_employee, color: "bg-violet-50 text-violet-700 border-violet-200" },
                    { label: "PT", val: s.professional_tax, color: "bg-blue-50 text-blue-700 border-blue-200" },
                    { label: "TDS", val: s.tds, color: "bg-orange-50 text-orange-700 border-orange-200" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${color}`}>
                      {label}: {currency(val)}
                    </div>
                  ))}
                </div>

                {/* Attendance summary */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  {[
                    ["Days Worked", s.present_days],
                    ["LOP Days", s.lop_days],
                    ["Paid Leaves", s.approved_leaves],
                  ].map(([l, v]) => (
                    <div key={l} className={`rounded-lg border px-1 py-1.5 ${l === "LOP Days" && v > 0 ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-slate-50"}`}>
                      <div className={`text-sm font-black tabular-nums ${l === "LOP Days" && v > 0 ? "text-rose-600" : "text-slate-700"}`}>{v}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>

                {/* Payment info */}
                {s.payment_date && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 mb-3">
                    <CheckCircle2 size={11} />
                    Paid on {new Date(s.payment_date).toLocaleDateString("en-IN")}
                    {s.transaction_reference && <span className="text-slate-400 ml-1">· {s.transaction_reference}</span>}
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={() => setViewSlip(s)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100 transition-colors"
                >
                  <FileText size={13} />
                  View & Print Payslip
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Payslip Print Modal */}
      {viewSlip && <PayslipModal slip={viewSlip} onClose={() => setViewSlip(null)} />}
    </div>
  );
}

