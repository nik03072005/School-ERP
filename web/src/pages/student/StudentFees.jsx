import { useEffect, useState } from "react";
import { Wallet, ChevronDown, Receipt } from "lucide-react";
import { feeService } from "../../api/feeService";
import FeeReceiptModal from "../../components/FeeReceiptModal";

const STATUS_COLORS = {
  pending: "bg-slate-200 text-slate-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
  waived: "bg-slate-200 text-slate-500",
};

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function StudentFees() {
  const [studentFees, setStudentFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    Promise.all([feeService.getMyFee(), feeService.getMyPayments()])
      .then(([feeData, paymentData]) => {
        setStudentFees(feeData.studentFees || []);
        setPayments(paymentData.payments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const current = studentFees[0];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Fees</h1>
            <p className="text-sm text-slate-500">
              {current ? `Academic Year ${current.academic_year}` : "No fee record yet"}
            </p>
          </div>
        </div>
      </div>

      {studentFees.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-20">
          <Wallet size={32} className="text-slate-300" />
          <p className="text-slate-500">No fee assignment found</p>
          <p className="text-xs text-slate-400">Your fee details will appear here once the school assigns them</p>
        </div>
      ) : (
        <>
          {current && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Net Payable", value: current.net_payable },
                { label: "Paid", value: current.total_paid },
                { label: "Due", value: current.total_due },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{currency(s.value)}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-400">Status</p>
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[current.status] || STATUS_COLORS.pending}`}>
                  {current.status}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {studentFees.map((sf) => {
              const isOpen = expanded === sf._id;
              return (
                <div key={sf._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <button
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setExpanded((p) => (p === sf._id ? null : sf._id))}
                  >
                    <div>
                      <p className="font-bold text-slate-900">Academic Year {sf.academic_year}</p>
                      <p className="text-xs text-slate-400">Net Payable: {currency(sf.net_payable)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[sf.status] || STATUS_COLORS.pending}`}>
                        {sf.status}
                      </span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-400">
                            <th className="pb-2 font-semibold">Installment</th>
                            <th className="pb-2 font-semibold">Due Date</th>
                            <th className="pb-2 font-semibold text-right">Amount Due</th>
                            <th className="pb-2 font-semibold text-right">Late Fee</th>
                            <th className="pb-2 font-semibold text-right">Paid</th>
                            <th className="pb-2 font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {sf.installments.map((i) => (
                            <tr key={i._id || i.name}>
                              <td className="py-2 text-slate-700">{i.name}</td>
                              <td className="py-2 text-slate-500">{fmtDate(i.due_date)}</td>
                              <td className="py-2 text-right font-semibold text-slate-900">{currency(i.amount_due)}</td>
                              <td className="py-2 text-right text-rose-600">{i.late_fee_applied > 0 ? currency(i.late_fee_applied) : "—"}</td>
                              <td className="py-2 text-right text-slate-700">{currency(i.amount_paid)}</td>
                              <td className="py-2 text-right">
                                <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[i.status] || STATUS_COLORS.pending}`}>
                                  {i.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {sf.discounts?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {sf.discounts.map((d, i) => (
                            <p key={i} className="rounded-xl bg-cyan-50 px-3 py-1.5 text-xs text-cyan-800">
                              {d.label}: {d.amount > 0 ? currency(d.amount) : ""} {d.percentage > 0 ? `${d.percentage}%` : ""} off
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Payment History</p>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-400">No payments recorded yet</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div>
                      <p className="font-mono text-xs text-slate-400">{p.receipt_number}</p>
                      <p className="text-sm font-semibold text-slate-800">{currency(p.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {fmtDate(p.payment_date)} · {p.payment_mode?.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {p.status}
                      </span>
                      <button
                        onClick={() => setViewingReceipt(p)}
                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                      >
                        <Receipt size={12} /> Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {viewingReceipt && <FeeReceiptModal payment={viewingReceipt} onClose={() => setViewingReceipt(null)} />}
    </div>
  );
}
