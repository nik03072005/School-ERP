import { useState } from "react";
import { X, Printer, CheckCircle2, IndianRupee, Building2, ShieldCheck, FileText, Banknote } from "lucide-react";
import { currency, numberToWords, MONTH_NAMES } from "../../utils/indianCurrency";

const PRINT_STYLE = `
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    body * { visibility: hidden !important; }
    #payslip-printable, #payslip-printable * { visibility: visible !important; }
    #payslip-printable {
      position: absolute !important; left: 0 !important; top: 0 !important;
      width: 100% !important; margin: 0 !important; padding: 0 !important;
      background: white !important; box-shadow: none !important;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
  }
`;

const Row = ({ label, value, bold, colored }) => (
  <tr className={`border-b border-slate-100 ${colored ? "bg-emerald-50" : ""}`}>
    <td className={`py-1.5 pr-3 text-xs ${bold ? "font-black text-slate-900" : "text-slate-600"}`}>{label}</td>
    <td className={`py-1.5 text-right text-xs tabular-nums ${bold ? "font-black text-slate-900" : "text-slate-800"}`}>{value}</td>
  </tr>
);

export default function PayslipModal({ slip, onClose }) {
  const [printing, setPrinting] = useState(false);

  if (!slip) return null;

  const monthLabel = `${MONTH_NAMES[slip.month] || slip.month} ${slip.year}`;

  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "__payslip-print-style__";
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    setPrinting(true);
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
      setPrinting(false);
    }, 80);
  };

  const staffTypeLabel = slip.staff_type === "teaching_staff" ? "Teaching Staff" : "Non-Teaching Staff";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[96vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* ── Toolbar (hidden on print) ── */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-cyan-600" />
            <span className="text-sm font-black text-slate-800">Salary Slip — {monthLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-60"
            >
              <Printer size={14} />
              {printing ? "Preparing…" : "Print / Save PDF"}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Printable Payslip ── */}
        <div id="payslip-printable" className="p-6">

          {/* School Header */}
          <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-cyan-800 px-6 py-4 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-black">
                  KG
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-wide">KIDZ GALAXY INTERNATIONAL SCHOOL</h1>
                  <p className="text-xs text-white/80">Affiliated to CBSE, New Delhi | Affiliation No. 2130512</p>
                  <p className="text-xs text-white/70">Sector 62, Noida, Uttar Pradesh – 201301 | HRMS Payroll Division</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-cyan-700 px-6 py-2 text-white">
              <span className="text-sm font-extrabold tracking-widest uppercase">Salary Slip</span>
              <span className="text-sm font-bold">{monthLabel}</span>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
              <div className="border-r border-slate-200 p-4 space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700 mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Employee Information
                </div>
                {[
                  ["Slip Number", slip.slip_number],
                  ["Employee Code", slip.employee_code],
                  ["Name", slip.employee_name],
                  ["Designation", slip.designation],
                  ["Department", slip.department],
                  ["Staff Type", staffTypeLabel],
                  ["Date of Joining", slip.joining_date ? new Date(slip.joining_date).toLocaleDateString("en-IN") : "—"],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-2 text-xs">
                    <span className="w-32 shrink-0 text-slate-500">{l}:</span>
                    <span className="font-semibold text-slate-900 break-all">{v || "—"}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700 mb-3 flex items-center gap-1.5">
                  <Building2 size={13} /> Banking & Statutory IDs
                </div>
                {[
                  ["Bank Name", slip.bank_name],
                  ["Account No.", slip.bank_account_no],
                  ["IFSC Code", slip.bank_ifsc],
                  ["PAN Number", slip.pan_number],
                  ["UAN Number", slip.uan_number],
                  ["PF Account", slip.pf_account_no],
                  ["ESIC No.", slip.esi_number || "Not Applicable"],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-2 text-xs">
                    <span className="w-32 shrink-0 text-slate-500">{l}:</span>
                    <span className="font-semibold text-slate-900 break-all">{v || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                Attendance Summary — {monthLabel}
              </div>
              <div className="grid grid-cols-6 gap-2 text-center">
                {[
                  ["Calendar Days", slip.calendar_days],
                  ["Working Days", slip.working_days],
                  ["Days Present", slip.present_days],
                  ["Paid Leaves", slip.approved_leaves],
                  ["Half Days", slip.half_days],
                  ["LOP Days", slip.lop_days],
                ].map(([l, v]) => (
                  <div key={l} className={`rounded-lg border px-2 py-2 ${l === "LOP Days" && v > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
                    <div className={`text-lg font-black tabular-nums ${l === "LOP Days" && v > 0 ? "text-rose-600" : "text-slate-800"}`}>{v}</div>
                    <div className="text-[9px] font-semibold uppercase text-slate-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
              {/* Earnings */}
              <div className="border-r border-slate-200 p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-1.5">
                  <IndianRupee size={13} /> Earnings
                </div>
                <table className="w-full">
                  <tbody>
                    <Row label="Basic Salary" value={currency(slip.basic_salary)} />
                    <Row label="Dearness Allowance (DA)" value={currency(slip.da)} />
                    <Row label="House Rent Allowance (HRA)" value={currency(slip.hra)} />
                    <Row label="Conveyance Allowance" value={currency(slip.conveyance_allowance)} />
                    <Row label="Medical Allowance" value={currency(slip.medical_allowance)} />
                    <Row label="Special Allowance" value={currency(slip.special_allowance)} />
                    {slip.bonus > 0 && <Row label="Bonus / Incentive" value={currency(slip.bonus)} />}
                    {slip.overtime_pay > 0 && <Row label="Overtime Pay" value={currency(slip.overtime_pay)} />}
                    <Row label="Gross Earnings" value={currency(slip.gross_earnings)} bold colored />
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div className="p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-rose-700 mb-3 flex items-center gap-1.5">
                  <Banknote size={13} /> Deductions
                </div>
                <table className="w-full">
                  <tbody>
                    <Row label="EPF (Employee) — 12%" value={currency(slip.epf_employee)} />
                    <Row label="EPF (Employer Ref) — 12%" value={currency(slip.epf_employer)} />
                    <Row label="ESI (Employee) — 0.75%" value={currency(slip.esi_employee)} />
                    <Row label="ESI (Employer Ref) — 3.25%" value={currency(slip.esi_employer)} />
                    <Row label="Professional Tax (PT)" value={currency(slip.professional_tax)} />
                    <Row label="TDS (Income Tax)" value={currency(slip.tds)} />
                    {slip.lop_deduction > 0 && <Row label={`LOP Deduction (${slip.lop_days} day${slip.lop_days !== 1 ? "s" : ""})`} value={currency(slip.lop_deduction)} />}
                    {slip.other_deductions > 0 && <Row label="Other Deductions" value={currency(slip.other_deductions)} />}
                    <Row label="Total Deductions" value={currency(slip.total_deductions)} bold colored />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Pay Banner */}
            <div className="bg-gradient-to-r from-emerald-700 to-cyan-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">Net Salary Payable</div>
                  <div className="mt-1 text-2xl font-black tabular-nums">{currency(slip.net_salary)}</div>
                  <div className="mt-1 text-xs text-emerald-100 italic">
                    {slip.net_salary_words || numberToWords(slip.net_salary)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                    slip.status === "paid" ? "bg-emerald-900/60 text-emerald-100" :
                    slip.status === "approved" ? "bg-cyan-900/60 text-cyan-100" :
                    "bg-slate-700/60 text-slate-200"
                  }`}>
                    <CheckCircle2 size={13} />
                    {slip.status === "paid" ? "PAID" : slip.status === "approved" ? "APPROVED" : "PROCESSED"}
                  </div>
                  {slip.payment_date && (
                    <div className="mt-1 text-xs text-emerald-100">
                      Paid: {new Date(slip.payment_date).toLocaleDateString("en-IN")}
                    </div>
                  )}
                  {slip.transaction_reference && (
                    <div className="text-xs text-emerald-100">Ref: {slip.transaction_reference}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature Row */}
            <div className="grid grid-cols-3 gap-0 border-t border-slate-200 text-center">
              {["Employee Signature", "Accounts Department", "Principal / Director"].map((label) => (
                <div key={label} className="border-r border-slate-200 last:border-0 px-4 py-4">
                  <div className="h-8 mb-2 border-b border-dashed border-slate-300" />
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-2 text-center">
              <p className="text-[9px] text-slate-400">
                This is a computer-generated salary statement and does not require a physical signature. | {monthLabel} | {slip.slip_number}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

