import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgePercent,
  Receipt,
  Send,
  Ban,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  CreditCard,
  User,
} from "lucide-react";
import { feeService } from "../../../api/feeService";
import FeeReceiptModal from "../../../components/FeeReceiptModal";

const STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-700 border border-slate-200",
  partial: "bg-amber-50 text-amber-800 border border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue: "bg-rose-50 text-rose-700 border border-rose-200",
  waived: "bg-slate-100 text-slate-500 border border-slate-200",
};

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const emptyDiscountForm = { label: "", type: "scholarship", amount: "", percentage: "", remarks: "" };
const emptyPaymentForm = { payment_mode: "cash", transaction_ref: "", remarks: "", payment_date: "" };

export default function StudentFeeDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [studentFees, setStudentFees] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const [savingDiscount, setSavingDiscount] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [selectedInstallments, setSelectedInstallments] = useState({});
  const [savingPayment, setSavingPayment] = useState(false);

  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    loadAll();
  }, [studentId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { studentFees } = await feeService.getStudentFee(studentId);
      setStudentFees(studentFees || []);
      if (studentFees?.length) setSelectedYear(studentFees[0].academic_year);
      const { payments } = await feeService.getPayments({ student_id: studentId });
      setPayments(payments || []);
    } finally {
      setLoading(false);
    }
  };

  const studentFee = studentFees.find((sf) => sf.academic_year === selectedYear) || studentFees[0];
  const student = studentFee?.student_id;
  const studentName = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();

  const openDiscount = () => {
    setDiscountForm(emptyDiscountForm);
    setError("");
    setShowDiscount(true);
  };

  const handleAddDiscount = async (e) => {
    e.preventDefault();
    if (!discountForm.label.trim()) return;
    setSavingDiscount(true);
    setError("");
    try {
      await feeService.addDiscount(studentFee._id, {
        ...discountForm,
        amount: Number(discountForm.amount) || 0,
        percentage: Number(discountForm.percentage) || 0,
      });
      setShowDiscount(false);
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to apply discount");
    } finally {
      setSavingDiscount(false);
    }
  };

  const openPayment = () => {
    setPaymentForm({ ...emptyPaymentForm, payment_date: new Date().toISOString().slice(0, 10) });
    setSelectedInstallments({});
    setError("");
    setShowPayment(true);
  };

  const toggleInstallment = (installment) => {
    setSelectedInstallments((prev) => {
      const next = { ...prev };
      if (next[installment.name] !== undefined) {
        delete next[installment.name];
      } else {
        const remaining = Math.max(
          0,
          installment.amount_due + (installment.late_fee_applied || 0) - installment.amount_paid
        );
        next[installment.name] = remaining;
      }
      return next;
    });
  };

  const setInstallmentAmount = (name, value) =>
    setSelectedInstallments((prev) => ({ ...prev, [name]: value }));

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const allocations = Object.entries(selectedInstallments)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([installment_name, amount]) => ({ installment_name, amount: Number(amount) }));

    if (allocations.length === 0) {
      setError("Select at least one installment and specify an amount");
      return;
    }

    setSavingPayment(true);
    setError("");
    try {
      const res = await feeService.recordPayment({
        student_fee_id: studentFee._id,
        allocations,
        ...paymentForm,
      });
      setShowPayment(false);
      await loadAll();
      if (res?.payment) {
        setViewingReceipt({
          ...res.payment,
          student_id: student,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCancelPayment = async (payment) => {
    const reason = prompt("Reason for voiding / cancelling this receipt payment voucher?");
    if (reason === null) return;
    try {
      await feeService.cancelPayment(payment._id, { reason });
      loadAll();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel payment");
    }
  };

  const handleReminder = async () => {
    try {
      const { message } = await feeService.sendFeeReminder(studentFee._id);
      alert(message);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send reminder");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
          <p className="mt-2 text-xs font-bold text-slate-500">Loading student fee ledger...</p>
        </div>
      </div>
    );
  }

  if (!studentFee) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={13} /> Back to Fee Accounts
        </button>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">
          <Wallet size={36} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No active fee schedules assigned</p>
          <p className="text-xs text-slate-400 mt-1">
            Assign a fee structure from the Fee Assignments panel first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header Hero Banner ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {studentName || "Student Account"}
              </h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                {student?.admission_no || "ADM"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {student?.class_id?.name} {student?.section_id ? `&bull; Section ${student.section_id.name}` : ""} &bull;{" "}
              Session {studentFee.academic_year}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {studentFees.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-0 w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
            >
              {studentFees.map((sf) => (
                <option key={sf._id} value={sf.academic_year}>
                  AY {sf.academic_year}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={openDiscount}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
          >
            <BadgePercent size={14} />
            <span>Discount / Grant</span>
          </button>

          <button
            type="button"
            onClick={handleReminder}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
          >
            <Send size={14} />
            <span>WhatsApp Alert</span>
          </button>

          <button
            type="button"
            onClick={openPayment}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600"
          >
            <Receipt size={14} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* ── 5 Metric Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Gross Fees", value: studentFee.gross_amount, color: "text-slate-900" },
          { label: "Concessions", value: studentFee.total_discount, color: "text-cyan-700" },
          { label: "Net Payable", value: studentFee.net_payable, color: "text-slate-900" },
          { label: "Total Paid", value: studentFee.total_paid, color: "text-emerald-600" },
          { label: "Current Balance", value: studentFee.total_due, color: "text-rose-600 font-black" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
            <p className={`mt-1.5 text-lg font-bold ${s.color}`}>{currency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* ── Discounts & Grants List (if any) ── */}
      {studentFee.discounts?.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-3">
            Applied Scholarships & Concessions
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {studentFee.discounts.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50/40 p-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{d.label}</p>
                  <p className="text-[10px] uppercase text-cyan-800 font-semibold">{d.type}</p>
                </div>
                <span className="font-black text-cyan-900">
                  {d.amount > 0 ? currency(d.amount) : ""} {d.percentage > 0 ? `${d.percentage}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Installment Schedule Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
            Term & Installment Schedules
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Installment Term</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Base Fee</th>
                <th className="px-4 py-3">Late Surcharge</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Remaining Due</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(studentFee.installments || []).map((inst, i) => {
                const remaining = Math.max(
                  0,
                  inst.amount_due + (inst.late_fee_applied || 0) - inst.amount_paid
                );
                return (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{inst.name}</td>
                    <td className="px-4 py-3.5 text-slate-500">{fmtDate(inst.due_date)}</td>
                    <td className="px-4 py-3.5 text-slate-800">{currency(inst.amount_due)}</td>
                    <td className="px-4 py-3.5 text-amber-700">
                      {inst.late_fee_applied > 0 ? currency(inst.late_fee_applied) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-emerald-700 font-semibold">{currency(inst.amount_paid)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{currency(remaining)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_COLORS[inst.status] || STATUS_COLORS.pending
                        }`}
                      >
                        {inst.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Vouchers History ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
            Payment Receipts & Vouchers ({payments.length})
          </h3>
        </div>
        {payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No payments have been recorded for this student account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Receipt #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Payment Channel</th>
                  <th className="px-4 py-3">Transaction Ref</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-800">
                      {p.receipt_number}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{fmtDate(p.payment_date)}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">{currency(p.amount)}</td>
                    <td className="px-4 py-3.5 capitalize">{p.payment_mode?.replace("_", " ")}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                      {p.transaction_ref || "—"}
                    </td>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
                        >
                          <Receipt size={12} />
                          <span>Receipt</span>
                        </button>
                        {p.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => handleCancelPayment(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Ban size={12} />
                            <span>Void</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Record Payment Modal ── */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Record Fee Collection</h3>
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Select Installment(s) & Amount Paid
                </label>
                {(studentFee.installments || []).map((inst) => {
                  const isSelected = selectedInstallments[inst.name] !== undefined;
                  const remaining = Math.max(
                    0,
                    inst.amount_due + (inst.late_fee_applied || 0) - inst.amount_paid
                  );
                  return (
                    <div
                      key={inst.name}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-50/50"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInstallment(inst)}
                          className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{inst.name}</p>
                          <p className="text-[10px] text-slate-400">Balance: {currency(remaining)}</p>
                        </div>
                      </label>

                      {isSelected && (
                        <input
                          type="number"
                          min={1}
                          max={remaining}
                          value={selectedInstallments[inst.name] || ""}
                          onChange={(e) => setInstallmentAmount(inst.name, e.target.value)}
                          className="mt-0 w-28 rounded-lg border border-cyan-300 bg-white px-2 py-1 text-xs text-slate-900"
                          placeholder="Amount"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Channel</label>
                  <select
                    value={paymentForm.payment_mode}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, payment_mode: e.target.value }))}
                    className="mt-1"
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="dd">Demand Draft</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Transaction Reference / Cheque No</label>
                <input
                  value={paymentForm.transaction_ref}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, transaction_ref: e.target.value }))}
                  placeholder="Optional reference number"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {savingPayment ? "Recording..." : "Record & Generate Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Discount Modal ── */}
      {showDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Apply Concession / Scholarship</h3>
              <button
                type="button"
                onClick={() => setShowDiscount(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDiscount} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Concession Label *</label>
                <input
                  required
                  placeholder="e.g. Merit Scholarship, Sibling Discount"
                  value={discountForm.label}
                  onChange={(e) => setDiscountForm((f) => ({ ...f, label: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Category Type</label>
                <select
                  value={discountForm.type}
                  onChange={(e) => setDiscountForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1"
                >
                  <option value="scholarship">Scholarship</option>
                  <option value="sibling">Sibling Discount</option>
                  <option value="staff_child">Staff Child Concession</option>
                  <option value="special">Special Consideration</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Fixed Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={discountForm.amount}
                    onChange={(e) => setDiscountForm((f) => ({ ...f, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">OR Percentage (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={discountForm.percentage}
                    onChange={(e) => setDiscountForm((f) => ({ ...f, percentage: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscount(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDiscount}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {savingDiscount ? "Applying..." : "Apply Grant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingReceipt && (
        <FeeReceiptModal payment={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      )}
    </div>
  );
}
