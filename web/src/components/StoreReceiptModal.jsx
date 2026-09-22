import { Printer, X, CheckCircle2, ShoppingBag, ShieldCheck } from "lucide-react";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const UNITS = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWordsIndian(amount) {
  const n = Math.floor(Number(amount || 0));
  if (n === 0) return "Rupees Zero Only";

  function convertChunk(num) {
    if (num === 0) return "";
    let str = "";
    if (Math.floor(num / 10000000) > 0) {
      str += convertChunk(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      str += convertChunk(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      str += convertChunk(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
      str += convertChunk(Math.floor(num / 100)) + " Hundred ";
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        str += UNITS[num] + " ";
      } else {
        str += TENS[Math.floor(num / 10)] + " ";
        if (num % 10 > 0) str += UNITS[num % 10] + " ";
      }
    }
    return str.trim();
  }

  const words = convertChunk(n);
  return `Rupees ${words} Only`;
}

const PRINT_STYLE = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    body * {
      visibility: hidden !important;
    }
    #store-receipt-printable, #store-receipt-printable * {
      visibility: visible !important;
    }
    #store-receipt-printable {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

export default function StoreReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const student = sale.student_id;
  const user = student?.user_id;
  const studentName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Student";
  const className = student?.class_id?.name || "—";
  const sectionName = student?.section_id?.name || "";
  const rollNo = student?.roll_no || "—";
  const admissionNo = student?.admission_no || "—";

  const distributionLabel = {
    admission_kit: "Admission Starter Kit",
    session_start: "Session Start Distribution",
    ad_hoc_sale: "Direct Counter Sale",
    replacement: "Uniform / Book Replacement",
    lab_issue: "Lab Kit & Apparatus Issue",
  }[sale.distribution_type] || sale.distribution_type;

  const paymentModeLabel = {
    cash: "Cash Settlement",
    upi: "UPI / Digital Transfer",
    card: "Debit / Credit Card",
    bank_transfer: "Bank Transfer",
    included_in_admission_fee: "Included in Admission Fee Package",
    billed_to_ledger: "Billed to Student Fee Ledger",
    complimentary: "Complimentary / Institutional Grant",
  }[sale.payment_mode] || sale.payment_mode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <style>{PRINT_STYLE}</style>

      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <ShoppingBag size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Store Voucher & Material Receipt</h2>
              <p className="text-xs text-slate-500">Official proof of uniform, books, and store issue</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Printer size={14} />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Printable Voucher Content ── */}
        <div id="store-receipt-printable" className="p-8 font-sans text-slate-900 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-cyan-700">
                Kidz Galaxy Educational Campus
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                School Store, Uniform & Book Dispensary
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Central Academic Dispensary • Station Road, Civil Lines • Ph: +91 98765 43210
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Voucher
              </span>
              <div className="mt-2 text-sm font-black text-slate-900">
                {sale.sale_number}
              </div>
              <div className="text-xs text-slate-500">
                Date: {new Date(sale.sale_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Student & Distribution Meta Box */}
          <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Student Name:</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{studentName}</div>
              <div className="mt-2 text-slate-500 font-medium">Class & Section:</div>
              <div className="font-semibold text-slate-800">
                {className} {sectionName ? `(${sectionName})` : ""}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-500 font-medium">Admission No:</div>
                  <div className="font-bold text-slate-900">{admissionNo}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Roll No:</div>
                  <div className="font-bold text-slate-900">{rollNo}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-slate-500 font-medium">Distribution Type:</div>
                <div className="font-semibold text-cyan-700">{distributionLabel}</div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description / SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.item_name}</div>
                      {item.sku_code && (
                        <div className="text-[10px] text-slate-500">SKU: {item.sku_code}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize text-slate-600 font-medium">
                        {item.category?.replace("_", " ") || "Item"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {currency(item.unit_price)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {currency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Settlement Calculation */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-6 border-t-2 border-slate-200 pt-4">
            <div className="text-xs space-y-1.5 sm:max-w-xs">
              <div>
                <span className="text-slate-500 font-medium">Payment Channel: </span>
                <span className="font-bold text-slate-800">{paymentModeLabel}</span>
              </div>
              {sale.transaction_ref && (
                <div>
                  <span className="text-slate-500 font-medium">Reference / UTR: </span>
                  <span className="font-mono text-slate-700">{sale.transaction_ref}</span>
                </div>
              )}
              {sale.remarks && (
                <div>
                  <span className="text-slate-500 font-medium">Notes: </span>
                  <span className="text-slate-600 italic">{sale.remarks}</span>
                </div>
              )}
              <div className="pt-2 text-[11px] text-slate-600 italic">
                Amount in Words: <span className="font-semibold text-slate-800">{numberToWordsIndian(sale.payable_amount)}</span>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Total:</span>
                <span className="font-semibold">{currency(sale.subtotal)}</span>
              </div>
              {sale.discount_total > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Concession:</span>
                  <span className="font-semibold">- {currency(sale.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                <span>Net Payable:</span>
                <span className="text-cyan-800">{currency(sale.payable_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Amount Realized:</span>
                <span className="font-bold text-emerald-700">{currency(sale.paid_amount || sale.payable_amount)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="mt-12 grid grid-cols-2 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
            <div>
              <div className="mx-auto w-44 border-b border-dashed border-slate-400 pb-1 font-bold text-slate-800">
                {sale.issued_by ? `${sale.issued_by.first_name || ""} ${sale.issued_by.last_name || ""}`.trim() : "Store Administrator"}
              </div>
              <div className="mt-1 text-[11px]">Dispensary Officer / Store Incharge</div>
            </div>
            <div>
              <div className="mx-auto w-44 border-b border-dashed border-slate-400 pb-1 font-bold text-slate-800">
                &nbsp;
              </div>
              <div className="mt-1 text-[11px]">Receiver (Parent / Student Signature)</div>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            * Items once issued in verified condition can only be exchanged within 7 days with this original receipt.
          </div>
        </div>
      </div>
    </div>
  );
}

