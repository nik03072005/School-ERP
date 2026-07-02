import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BadgePercent, Receipt, Send, Ban } from "lucide-react";
import { feeService } from "../../../api/feeService";
import FeeReceiptModal from "../../../components/FeeReceiptModal";

const STATUS_COLORS = {
  pending: "bg-slate-200 text-slate-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
  waived: "bg-slate-200 text-slate-500",
};

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

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
        const remaining = Math.max(0, installment.amount_due + installment.late_fee_applied - installment.amount_paid);
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
      setError("Select at least one installment and enter an amount");
      return;
    }

    setSavingPayment(true);
    setError("");
    try {
      await feeService.recordPayment({
        student_fee_id: studentFee._id,
        allocations,
        ...paymentForm,
      });
      setShowPayment(false);
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCancelPayment = async (payment) => {
    const reason = prompt("Reason for cancelling this payment?");
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
    return <p className="text-slate-400 text-sm">Loading…</p>;
  }

  if (!studentFee) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          No fee assignment found for this student
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{studentName || "Student"}</h1>
          <p className="text-sm text-slate-500">
            {student?.admission_no} · {student?.class_id?.name} {student?.section_id ? `· ${student.section_id.name}` : ""} ·{" "}
            {studentFee.academic_year}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {studentFees.length > 1 && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-auto">
              {studentFees.map((sf) => (
                <option key={sf._id} value={sf.academic_year}>
                  {sf.academic_year}
                </option>
              ))}
            </select>
          )}
          <button onClick={openDiscount} className="flex items-center gap-1 rounded-xl bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition">
            <BadgePercent size={15} /> Discount
          </button>
          <button onClick={handleReminder} className="flex items-center gap-1 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition">
            <Send size={15} /> Send Reminder
          </button>
          <button onClick={openPayment} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition">
            <Receipt size={15} /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Gross Amount", value: studentFee.gross_amount },
          { label: "Discount", value: studentFee.total_discount },
          { label: "Net Payable", value: studentFee.net_payable },
          { label: "Paid", value: studentFee.total_paid },
          { label: "Due", value: studentFee.total_due },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{currency(s.value)}</p>
          </div>
        ))}
      </div>

      {studentFee.discounts?.length > 0 && (
        <div className="panel">
          <p className="mb-2 text-sm font-semibold text-slate-700">Discounts / Scholarships</p>
          <div className="space-y-1 text-sm">
            {studentFee.discounts.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-700">
                  {d.label} <span className="text-xs text-slate-400">({d.type})</span>
                </span>
                <span className="font-semibold text-slate-800">
                  {d.amount > 0 ? currency(d.amount) : ""} {d.percentage > 0 ? `${d.percentage}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Amount Due</th>
              <th>Late Fee</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {studentFee.installments.map((i) => (
              <tr key={i._id || i.name}>
                <td className="font-semibold text-slate-800">{i.name}</td>
                <td>{fmtDate(i.due_date)}</td>
                <td>{currency(i.amount_due)}</td>
                <td>{i.late_fee_applied > 0 ? currency(i.late_fee_applied) : "—"}</td>
                <td>{currency(i.amount_paid)}</td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[i.status] || STATUS_COLORS.pending}`}>
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Payment History</p>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-400">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="font-mono text-xs">{p.receipt_number}</td>
                    <td>{fmtDate(p.payment_date)}</td>
                    <td className="font-semibold text-slate-800">{currency(p.amount)}</td>
                    <td className="capitalize">{p.payment_mode?.replace("_", " ")}</td>
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
                      <div className="flex gap-2">
                        <button onClick={() => setViewingReceipt(p)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition">
                          Receipt
                        </button>
                        {p.status === "completed" && (
                          <button
                            onClick={() => handleCancelPayment(p)}
                            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
                          >
                            <Ban size={12} /> Cancel
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

      {showDiscount && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Apply Discount / Scholarship</h2>
            {error && <div className="alert error">{error}</div>}
            <form onSubmit={handleAddDiscount} className="space-y-4">
              <div>
                <label>Label *</label>
                <input required value={discountForm.label} onChange={(e) => setDiscountForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Sibling Discount" />
              </div>
              <div>
                <label>Type</label>
                <select value={discountForm.type} onChange={(e) => setDiscountForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="scholarship">Scholarship</option>
                  <option value="sibling">Sibling</option>
                  <option value="staff_ward">Staff Ward</option>
                  <option value="rte">RTE</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Flat Amount</label>
                  <input type="number" min={0} value={discountForm.amount} onChange={(e) => setDiscountForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label>Percentage</label>
                  <input type="number" min={0} max={100} value={discountForm.percentage} onChange={(e) => setDiscountForm((f) => ({ ...f, percentage: e.target.value }))} />
                </div>
              </div>
              <div>
                <label>Remarks</label>
                <textarea rows={2} value={discountForm.remarks} onChange={(e) => setDiscountForm((f) => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDiscount(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={savingDiscount} className="btn btn-primary">
                  {savingDiscount ? "Saving…" : "Apply Discount"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Record Payment</h2>
            {error && <div className="alert error">{error}</div>}
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="mb-2 block">Installments</label>
                <div className="space-y-2">
                  {studentFee.installments
                    .filter((i) => i.status !== "paid" && i.status !== "waived")
                    .map((i) => (
                      <div key={i.name} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <input
                          type="checkbox"
                          className="mt-0 w-auto"
                          checked={selectedInstallments[i.name] !== undefined}
                          onChange={() => toggleInstallment(i)}
                        />
                        <span className="flex-1 text-sm text-slate-700">
                          {i.name} <span className="text-xs text-slate-400">(due {currency(i.amount_due + i.late_fee_applied - i.amount_paid)})</span>
                        </span>
                        {selectedInstallments[i.name] !== undefined && (
                          <input
                            type="number"
                            min={0}
                            className="w-28"
                            value={selectedInstallments[i.name]}
                            onChange={(e) => setInstallmentAmount(i.name, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Payment Mode *</label>
                  <select required value={paymentForm.payment_mode} onChange={(e) => setPaymentForm((f) => ({ ...f, payment_mode: e.target.value }))}>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="dd">Demand Draft</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label>Payment Date</label>
                  <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label>Transaction Reference</label>
                <input value={paymentForm.transaction_ref} onChange={(e) => setPaymentForm((f) => ({ ...f, transaction_ref: e.target.value }))} placeholder="Cheque no. / UTR / Txn ID" />
              </div>
              <div>
                <label>Remarks</label>
                <textarea rows={2} value={paymentForm.remarks} onChange={(e) => setPaymentForm((f) => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPayment(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={savingPayment} className="btn btn-primary">
                  {savingPayment ? "Saving…" : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingReceipt && <FeeReceiptModal payment={viewingReceipt} onClose={() => setViewingReceipt(null)} />}
    </div>
  );
}
