import { useEffect, useState } from "react";
import { Wallet, TrendingUp, AlertTriangle, Users2 } from "lucide-react";
import { feeService } from "../../../api/feeService";
import { setupService } from "../../../api/setupService";
import FeeReceiptModal from "../../../components/FeeReceiptModal";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Collection</h1>
        <p className="text-sm text-slate-500">Dashboard summary and collection register</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: "summary", label: "Summary" },
          { key: "register", label: "Collection Register" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-cyan-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-5">
          {summaryLoading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-cyan-600">
                    <Wallet size={16} /> <span className="text-xs font-semibold uppercase tracking-wide">Collected</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{currency(summary?.totals.collected)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-rose-600">
                    <AlertTriangle size={16} /> <span className="text-xs font-semibold uppercase tracking-wide">Outstanding</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{currency(summary?.totals.outstanding)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-emerald-600">
                    <TrendingUp size={16} /> <span className="text-xs font-semibold uppercase tracking-wide">Collection %</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{summary?.totals.collectionPercentage ?? 0}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-slate-600">
                    <Users2 size={16} /> <span className="text-xs font-semibold uppercase tracking-wide">Students / Overdue</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {summary?.totals.studentCount ?? 0} <span className="text-sm font-medium text-rose-600">/ {summary?.totals.overdueCount ?? 0}</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Students</th>
                      <th>Net Payable</th>
                      <th>Collected</th>
                      <th>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.classWise || []).map((c) => (
                      <tr key={c.className}>
                        <td className="font-semibold text-slate-800">{c.className}</td>
                        <td>{c.students}</td>
                        <td>{currency(c.netPayable)}</td>
                        <td>{currency(c.collected)}</td>
                        <td className="font-semibold text-rose-600">{currency(c.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "register" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className="w-auto" />
            <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className="w-auto" />
            <select value={filters.payment_mode} onChange={(e) => setFilters((f) => ({ ...f, payment_mode: e.target.value }))} className="w-auto">
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="dd">Demand Draft</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            <select value={filters.class_id} onChange={(e) => setFilters((f) => ({ ...f, class_id: e.target.value }))} className="w-auto">
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
            Total Collected (filtered): {currency(totalCollected)}
          </div>

          {registerLoading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
              No payments match these filters
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const student = p.student_id;
                    const name = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();
                    return (
                      <tr key={p._id}>
                        <td className="font-mono text-xs">{p.receipt_number}</td>
                        <td>{name || "—"}</td>
                        <td>
                          {student?.class_id?.name} {student?.section_id ? `· ${student.section_id.name}` : ""}
                        </td>
                        <td className="font-semibold text-slate-800">{currency(p.amount)}</td>
                        <td className="capitalize">{p.payment_mode?.replace("_", " ")}</td>
                        <td>{fmtDate(p.payment_date)}</td>
                        <td>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setViewingReceipt(p)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                          >
                            Receipt
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
      )}

      {viewingReceipt && <FeeReceiptModal payment={viewingReceipt} onClose={() => setViewingReceipt(null)} />}
    </div>
  );
}
