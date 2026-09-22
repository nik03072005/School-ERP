import { useEffect, useState } from "react";
import { Wallet, TrendingUp, AlertTriangle, Users2, Receipt, Calendar, Filter, FileText } from "lucide-react";
import { feeService } from "../../../api/feeService";
import { setupService } from "../../../api/setupService";
import FeeReceiptModal from "../../../components/FeeReceiptModal";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function FeeCollectionAdmin() {
  const [tab, setTab] = useState("summary");

  // Summary tab
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Register tab
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", payment_mode: "", class_id: "" });
  const [payments, setPayments] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [registerLoading, setRegisterLoading] = useState(true);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
    loadSummary();
  }, []);

  useEffect(() => {
    if (tab === "register") loadRegister();
  }, [tab, filters]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const data = await feeService.getFeeSummary();
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadRegister = async () => {
    setRegisterLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.payment_mode) params.payment_mode = filters.payment_mode;
      if (filters.class_id) params.class_id = filters.class_id;
      const { payments, totalCollected } = await feeService.getPayments(params);
      setPayments(payments || []);
      setTotalCollected(totalCollected || 0);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Wallet size={15} />
            Institutional Cashflow & Receipts
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Fee Collection</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time analytics on revenue realizations, outstanding dues, payment channels, and receipt vouchers.
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "summary", label: "Executive Summary & Class Ledger", icon: TrendingUp },
          { key: "register", label: "Fee Payment Register", icon: Receipt },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} className={isActive ? "text-cyan-400" : "text-slate-400"} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Summary Tab ── */}
      {tab === "summary" && (
        <div className="space-y-6">
          {summaryLoading ? (
            <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <div className="text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
                <p className="mt-2 text-xs font-bold text-slate-500">Compiling financial metrics...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Collected</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Wallet size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {currency(summary?.totals.collected)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Realized to Bank</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-rose-600">
                    {currency(summary?.totals.outstanding)}
                  </p>
                  <p className="mt-1 text-[11px] text-rose-500 font-semibold">Pending Realization</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Realization Rate</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-cyan-700">
                    {summary?.totals.collectionPercentage ?? 0}%
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-cyan-600 rounded-full"
                      style={{ width: `${Math.min(summary?.totals.collectionPercentage ?? 0, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Students / Overdue</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Users2 size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {summary?.totals.studentCount ?? 0}{" "}
                    <span className="text-xs font-bold text-rose-600">
                      / {summary?.totals.overdueCount ?? 0} overdue
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Total Enrolled Accounts</p>
                </div>
              </div>

              {/* Class-wise Realization Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                    Class-wise Realization Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Class Standard</th>
                        <th className="px-4 py-3">Students</th>
                        <th className="px-4 py-3">Net Payable</th>
                        <th className="px-4 py-3">Total Collected</th>
                        <th className="px-4 py-3">Pending Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(summary?.classWise || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            No class fee summaries recorded.
                          </td>
                        </tr>
                      ) : (
                        (summary?.classWise || []).map((c) => (
                          <tr key={c.className} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-3.5 font-bold text-slate-900">{c.className}</td>
                            <td className="px-4 py-3.5">{c.students} Students</td>
                            <td className="px-4 py-3.5 text-slate-700">{currency(c.netPayable)}</td>
                            <td className="px-4 py-3.5 font-semibold text-emerald-700">
                              {currency(c.collected)}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-rose-600">
                              {currency(c.outstanding)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Payment Register Tab ── */}
      {tab === "register" && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="mt-0 w-auto rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
              />
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="mt-0 w-auto rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
              />
              <select
                value={filters.payment_mode}
                onChange={(e) => setFilters((f) => ({ ...f, payment_mode: e.target.value }))}
                className="mt-0 w-auto rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="">All Payment Channels</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="dd">Demand Draft</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filters.class_id}
                onChange={(e) => setFilters((f) => ({ ...f, class_id: e.target.value }))}
                className="mt-0 w-auto rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="">All Academic Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="ml-auto rounded-xl bg-cyan-50 border border-cyan-200 px-3.5 py-1.5 text-xs font-bold text-cyan-800">
                Filtered Realization: {currency(totalCollected)}
              </div>
            </div>
          </div>

          {/* Transactions Register Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {registerLoading ? (
              <div className="py-20 text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
                <p className="mt-2 text-xs font-bold text-slate-500">Loading collection transactions...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No payment transactions match the active criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Receipt Number</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Amount Paid</th>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Transaction Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Receipt Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.map((p) => {
                      const student = p.student_id;
                      const name = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();
                      return (
                        <tr key={p._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-800">
                            {p.receipt_number}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">{name || "—"}</td>
                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                              {student?.class_id?.name} {student?.section_id ? `· ${student.section_id.name}` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-extrabold text-emerald-700">{currency(p.amount)}</td>
                          <td className="px-4 py-3.5 capitalize font-medium text-slate-700">
                            {p.payment_mode?.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{fmtDate(p.payment_date)}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                p.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingReceipt(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
                            >
                              <Receipt size={12} />
                              <span>View Receipt</span>
                            </button>
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
      )}

      {viewingReceipt && (
        <FeeReceiptModal payment={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      )}
    </div>
  );
}
