import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { payrollService } from "../../../api/payrollService";
import { currency, MONTH_NAMES } from "../../../utils/indianCurrency";

const STATUS_CONFIG = {
  draft:      { cls: "bg-slate-100 text-slate-600",    label: "Draft" },
  processed:  { cls: "bg-amber-100 text-amber-700",    label: "Processed" },
  approved:   { cls: "bg-cyan-100 text-cyan-700",      label: "Approved" },
  disbursed:  { cls: "bg-emerald-100 text-emerald-700", label: "Disbursed" },
};

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className={`rounded-2xl border ${color} bg-white p-4 shadow-xs`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-black text-slate-900 tabular-nums">{value}</div>
        {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        <Icon size={19} className="text-slate-600" />
      </div>
    </div>
  </div>
);

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const MONTHS = MONTH_NAMES.slice(1);

export default function PayrollDashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [workingDays, setWorkingDays] = useState(26);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await payrollService.listBatches();
      setBatches(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load payroll batches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const handleRunPayroll = async () => {
    try {
      setRunning(true);
      setError("");
      const data = await payrollService.runPayrollBatch({
        month: selectedMonth,
        year: selectedYear,
        total_working_days: workingDays,
      });
      setNotice(data.message || "Payroll processed successfully.");
      await loadBatches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to process payroll.");
    } finally {
      setRunning(false);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  // Latest batch stats
  const latestBatch = batches[0];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
              <BadgeIndianRupee size={15} />
              Staff Payroll & HRMS
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Payroll Management</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Monthly salary computation with EPF, ESI, Professional Tax, TDS & LOP deductions
            </p>
          </div>
          <button
            onClick={loadBatches}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-xs">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          {error}
        </div>
      )}

      {/* ── KPI Cards (from latest batch) ── */}
      {latestBatch && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Gross Pay" value={currency(latestBatch.total_gross_pay)} sub={`${MONTH_NAMES[latestBatch.month]} ${latestBatch.year}`} icon={TrendingUp} color="border-emerald-100" />
          <StatCard label="Net Disbursed" value={currency(latestBatch.total_net_pay)} sub={`${latestBatch.staff_count} staff`} icon={Wallet} color="border-cyan-100" />
          <StatCard label="EPF + ESI + PT" value={currency(latestBatch.total_epf + latestBatch.total_esi + latestBatch.total_pt)} sub="Statutory deductions" icon={ShieldCheck} color="border-amber-100" />
          <StatCard label="LOP Deductions" value={currency(latestBatch.total_lop_deductions)} sub="Absence-based" icon={CalendarDays} color="border-rose-100" />
        </div>
      )}

      {/* ── Run Payroll Panel ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
          <RotateCcw size={15} className="text-cyan-600" />
          <span>Process Monthly Payroll</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="text-xs font-bold text-slate-700">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Working Days</label>
            <input
              type="number"
              min="1"
              max="31"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="mt-1 block w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </div>
          <button
            onClick={handleRunPayroll}
            disabled={running}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <IndianRupee size={15} />}
            {running ? "Processing…" : "Process / Recalculate Payroll"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          This computes EPF, ESI, PT, TDS and attendance-based LOP deductions for all active staff. Already-generated batches will be recalculated.
        </p>
      </div>

      {/* ── Batch History Table ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <ClipboardList size={15} className="text-cyan-600" />
            Payroll Batch History
          </div>
          <span className="text-xs text-slate-400">{batches.length} cycle{batches.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-cyan-600" />
          </div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center">
            <IndianRupee size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">No payroll batches found</p>
            <p className="text-xs text-slate-400 mt-1">Use the panel above to process your first monthly payroll.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Month / Year", "Staff", "Gross Pay", "Deductions", "Net Pay", "EPF", "LOP", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const { cls, label } = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
                  return (
                    <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{MONTH_NAMES[b.month]} {b.year}</div>
                        <div className="text-[11px] text-slate-400">{b.batch_code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-semibold text-slate-700">
                          <Users size={12} /> {b.staff_count}
                        </div>
                        <div className="text-[11px] text-slate-400">{b.teaching_staff_count}T · {b.non_teaching_staff_count}NT</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{currency(b.total_gross_pay)}</td>
                      <td className="px-4 py-3 font-semibold text-rose-700 tabular-nums">{currency(b.total_deductions)}</td>
                      <td className="px-4 py-3 font-black text-emerald-700 tabular-nums">{currency(b.total_net_pay)}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums text-xs">{currency(b.total_epf)}</td>
                      <td className="px-4 py-3 text-rose-600 tabular-nums text-xs">{currency(b.total_lop_deductions)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/payroll/${b._id}`}
                          className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700"
                        >
                          Details <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

