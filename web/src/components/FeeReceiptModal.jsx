import { X, Printer } from "lucide-react";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// A print-only stylesheet scoped to #fee-receipt-print so window.print() only
// renders the receipt, not the surrounding dashboard chrome.
const PRINT_STYLE = `
  @media print {
    body * { visibility: hidden; }
    #fee-receipt-print, #fee-receipt-print * { visibility: visible; }
    #fee-receipt-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  }
`;

export default function FeeReceiptModal({ payment, onClose }) {
  if (!payment) return null;

  const student = payment.student_id;
  const studentName = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <style>{PRINT_STYLE}</style>
      <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between print:hidden">
          <h2 className="text-lg font-bold text-slate-900">Fee Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition"
            >
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose}>
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div id="fee-receipt-print" className="space-y-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fee Payment Receipt</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{payment.receipt_number}</p>
            {payment.status === "cancelled" && (
              <p className="mt-1 text-sm font-semibold text-rose-600">CANCELLED</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Student</p>
              <p className="font-semibold text-slate-800">{studentName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Admission No.</p>
              <p className="font-semibold text-slate-800">{student?.admission_no || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Class</p>
              <p className="font-semibold text-slate-800">
                {student?.class_id?.name} {student?.section_id ? `· ${student.section_id.name}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Payment Date</p>
              <p className="font-semibold text-slate-800">
                {new Date(payment.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Mode</p>
              <p className="font-semibold text-slate-800 capitalize">{payment.payment_mode?.replace("_", " ")}</p>
            </div>
            {payment.transaction_ref && (
              <div>
                <p className="text-xs text-slate-400">Reference</p>
                <p className="font-semibold text-slate-800">{payment.transaction_ref}</p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Allocations</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {payment.allocations?.map((a, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-slate-700">{a.installment_name}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-900">{currency(a.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold">
                  <td className="pt-2 text-slate-900">Total Paid</td>
                  <td className="pt-2 text-right text-slate-900">{currency(payment.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {payment.remarks && (
            <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <span className="font-semibold">Remarks:</span> {payment.remarks}
            </p>
          )}

          <p className="text-center text-xs text-slate-400">
            Collected by {payment.collected_by?.first_name} {payment.collected_by?.last_name}
          </p>
        </div>
      </div>
    </div>
  );
}
