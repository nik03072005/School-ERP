import { useState } from "react";
import { X, Printer, CheckCircle2, ShieldCheck, FileText, School, Download, Sparkles } from "lucide-react";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const UNITS = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelfth", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
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

// Print stylesheet ensuring clean vector receipt printing without UI elements
const PRINT_STYLE = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    body * {
      visibility: hidden !important;
    }
    #fee-receipt-printable, #fee-receipt-printable * {
      visibility: visible !important;
    }
    #fee-receipt-printable {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      box-shadow: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

function SingleReceiptSlip({ payment, copyTitle, student, studentName, parentName, sessionText }) {
  const isCancelled = payment.status === "cancelled";

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm print:rounded-none print:border print:border-slate-800 print:p-5">
      {/* Subtle background watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
        <img src="/KG-LOGO.png" alt="" className="h-72 w-72 object-contain grayscale" />
      </div>

      {/* Copy Badge / Header Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white print:border print:border-black print:bg-white print:text-black">
            {copyTitle}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            Session: <strong className="text-slate-800">{sessionText}</strong>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 print:border-slate-400 print:bg-white print:text-black">
            Receipt #{payment.receipt_number || "RCP-PENDING"}
          </span>
        </div>
      </div>

      {/* School Header */}
      <div className="mt-3 flex items-center justify-between gap-4 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <img
            src="/KG-LOGO.png"
            alt="School Logo"
            className="h-14 w-14 rounded-xl object-contain border border-slate-100 p-1 bg-white shadow-xs print:border-none"
          />
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900 sm:text-lg">
              Kidz Galaxy International School
            </h1>
            <p className="text-[10px] font-semibold text-slate-600">
              Affiliated to CBSE / State Board &bull; Affiliation No: 2133890 &bull; School Code: 71234
            </p>
            <p className="text-[9px] text-slate-500">
              Knowledge Corridor Campus, City Center &bull; Ph: +91 98765 43210 &bull; accounts@kidzgalaxy.org
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white print:border print:border-black print:bg-black print:text-white">
            Fee Receipt
          </span>
        </div>
      </div>

      {/* Student & Payment Metadata Box */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs print:bg-white print:border-slate-400">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Student Name:</span>
          <p className="font-bold text-slate-900">{studentName || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Admission No:</span>
          <p className="font-mono font-bold text-slate-900">{student?.admission_no || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Class & Section:</span>
          <p className="font-semibold text-slate-800">
            {student?.class_id?.name || "—"} {student?.section_id?.name ? `· Sec ${student.section_id.name}` : ""}
            {student?.roll_no ? ` (Roll: ${student.roll_no})` : ""}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Father / Guardian:</span>
          <p className="font-semibold text-slate-800">{parentName || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Payment Date:</span>
          <p className="font-semibold text-slate-800">
            {payment.payment_date
              ? new Date(payment.payment_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Payment Mode:</span>
          <p className="font-bold text-slate-900 capitalize">
            {payment.payment_mode?.replace("_", " ") || "Cash"}
            {payment.transaction_ref ? ` (${payment.transaction_ref})` : ""}
          </p>
        </div>
      </div>

      {/* Allocations / Particulars Table */}
      <div className="mt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 print:bg-slate-200">
              <th className="py-2 px-3 text-left w-12">#</th>
              <th className="py-2 px-3 text-left">Fee Particulars / Installment</th>
              <th className="py-2 px-3 text-right w-36">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payment.allocations && payment.allocations.length > 0 ? (
              payment.allocations.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{a.installment_name}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{currency(a.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 px-3 font-mono text-slate-400">1</td>
                <td className="py-2 px-3 font-medium text-slate-800">School Academic Fee Installment</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">{currency(payment.amount)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50 font-black text-slate-900 print:bg-white">
              <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider text-xs">
                Total Amount Received:
              </td>
              <td className="py-2 px-3 text-right text-sm font-black text-emerald-800 print:text-black">
                {currency(payment.amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in Words */}
      <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Amount in words: </span>
        <span className="font-bold italic text-slate-900">{numberToWordsIndian(payment.amount)}</span>
      </div>

      {/* Remarks if any */}
      {payment.remarks && (
        <div className="mt-2 rounded-lg bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 text-xs text-amber-900">
          <span className="font-bold">Remarks:</span> {payment.remarks}
        </div>
      )}

      {/* Official Signatures & Paid Stamp Section */}
      <div className="mt-5 flex items-end justify-between border-t border-dashed border-slate-300 pt-4">
        {/* Depositor Signature */}
        <div className="text-center w-36">
          <div className="h-9"></div>
          <div className="border-t border-slate-400 pt-1">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Depositor Signature</p>
          </div>
        </div>

        {/* Circular Paid Stamp Emblem */}
        <div className="flex flex-col items-center">
          {isCancelled ? (
            <div className="rounded-xl border-2 border-dashed border-rose-600 bg-rose-50 px-4 py-1 text-center font-black text-rose-700">
              <p className="text-xs">VOID / CANCELLED</p>
              {payment.cancelled_reason && (
                <p className="text-[9px] font-medium text-rose-600">{payment.cancelled_reason}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3.5 py-1 text-emerald-800 shadow-xs print:border-black print:text-black">
              <CheckCircle2 size={14} className="text-emerald-600 print:text-black" />
              <span className="text-[11px] font-black tracking-wider uppercase">PAID & VERIFIED</span>
            </div>
          )}
          <p className="mt-1 text-[9px] text-slate-400 print:text-slate-600">
            Cashier: {payment.collected_by?.first_name ? `${payment.collected_by.first_name} ${payment.collected_by.last_name || ""}` : "Accounts Office"}
          </p>
        </div>

        {/* Accounts Officer Signature */}
        <div className="text-center w-40">
          <div className="h-9 flex items-center justify-center">
            <span className="font-serif italic text-xs text-cyan-800 font-bold opacity-80 print:text-black">
              Authorized Accounts
            </span>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Accounts Officer / Cashier</p>
          </div>
        </div>
      </div>

      {/* Bottom Disclaimer */}
      <div className="mt-3 border-t border-slate-100 pt-2 text-center text-[9px] text-slate-400 print:text-slate-500">
        This is an official computer-generated receipt issued by Kidz Galaxy ERP. Subject to realization of Cheque / DD.
      </div>
    </div>
  );
}

export default function FeeReceiptModal({ payment, onClose }) {
  const [printMode, setPrintMode] = useState("student"); // 'student', 'school', 'twin'

  if (!payment) return null;

  const student = payment.student_id;
  const studentName = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();
  const parentName =
    student?.father_name ||
    student?.mother_name ||
    student?.primary_guardian_name ||
    "Parent / Guardian";

  const sessionText = "2025-2026";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <style>{PRINT_STYLE}</style>

      <div className="my-6 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 print:m-0 print:p-0 print:shadow-none print:ring-0">
        {/* Modal Top Control Bar (Hidden during printing) */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
              <FileText size={15} />
              <span>Official Institutional Receipt</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Fee Voucher &bull; #{payment.receipt_number || "New"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Selector Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintMode("student")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  printMode === "student" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Student Copy
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("school")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  printMode === "school" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                School Copy
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("twin")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  printMode === "twin" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Twin Print (Dual)
              </button>
            </div>

            {/* Print Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition"
            >
              <Printer size={15} />
              <span>Print Receipt</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div id="fee-receipt-printable" className="space-y-6">
          {printMode === "twin" ? (
            <>
              {/* Twin: Student Copy */}
              <SingleReceiptSlip
                payment={payment}
                copyTitle="STUDENT COPY"
                student={student}
                studentName={studentName}
                parentName={parentName}
                sessionText={sessionText}
              />
              {/* Divider for cutting in twin print */}
              <div className="relative border-t-2 border-dashed border-slate-300 py-1 text-center">
                <span className="bg-white px-3 text-[10px] font-mono uppercase text-slate-400">
                  ✂ Cut along line &bull; Accounts Record Voucher ✂
                </span>
              </div>
              {/* Twin: School Copy */}
              <SingleReceiptSlip
                payment={payment}
                copyTitle="SCHOOL / ACCOUNTS COPY"
                student={student}
                studentName={studentName}
                parentName={parentName}
                sessionText={sessionText}
              />
            </>
          ) : (
            <SingleReceiptSlip
              payment={payment}
              copyTitle={printMode === "school" ? "SCHOOL / ACCOUNTS COPY" : "STUDENT COPY"}
              student={student}
              studentName={studentName}
              parentName={parentName}
              sessionText={sessionText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
