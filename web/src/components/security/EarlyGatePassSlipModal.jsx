import { useEffect } from "react";
import {
  X,
  Printer,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";

const fmt = (d, opts = {}) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...opts }) : "—";

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const STATUS_LABEL = {
  pending: "Pending Approval",
  approved_by_teacher: "Teacher Approved",
  approved_by_admin: "Principal Approved — Ready for Gate",
  released_at_gate: "Released at Gate",
  rejected: "Rejected",
};

export default function EarlyGatePassSlipModal({ gatePass, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!gatePass) return null;

  const studentUser = gatePass.student_id?.user_id || {};
  const studentName = `${studentUser.first_name || ""} ${studentUser.last_name || ""}`.trim();
  const className = gatePass.class_id?.name || "—";
  const sectionName = gatePass.section_id?.name || "—";

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #early-gate-pass-print, #early-gate-pass-print * { visibility: visible !important; }
          #early-gate-pass-print {
            position: fixed !important;
            inset: 0 !important;
            padding: 1.5cm !important;
            background: white !important;
            width: 100% !important;
            font-size: 11pt !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span className="font-semibold text-slate-800 text-sm">Early Departure Slip</span>
              <span className="ml-1 text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                {gatePass.pass_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Printer size={14} />
                Print Slip
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Slip Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            <div
              id="early-gate-pass-print"
              className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* School Header */}
              <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b-2 border-slate-800">
                <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-black text-slate-900 leading-tight">Kidz Galaxy School</h1>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Campus Safety &amp; POCSO Compliance Department
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Gomti Nagar Extension, Lucknow, Uttar Pradesh — 226010
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pass No.</p>
                  <p className="text-base font-black font-mono text-slate-900">{gatePass.pass_number}</p>
                  <p className="text-[10px] text-slate-500">{fmt(gatePass.departure_time)}</p>
                </div>
              </div>

              {/* Document Title */}
              <div className="bg-slate-800 text-white text-center py-2.5 px-4">
                <h2 className="text-sm font-black tracking-wider uppercase">
                  Student Early Departure Authorization Slip
                </h2>
              </div>

              {/* Status */}
              <div className="flex justify-center py-2 border-b border-slate-100 bg-slate-50">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    gatePass.approval_status === "released_at_gate"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : gatePass.approval_status === "approved_by_admin"
                      ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                      : gatePass.approval_status === "approved_by_teacher"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : gatePass.approval_status === "rejected"
                      ? "bg-rose-50 text-rose-800 border-rose-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {STATUS_LABEL[gatePass.approval_status] || gatePass.approval_status}
                </span>
              </div>

              {/* Section 1: Student Details */}
              <div className="px-6 pt-4 pb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  ① Student Details
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Student Name</p>
                    <p className="text-sm font-bold text-slate-900">{studentName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Class &amp; Section</p>
                    <p className="text-sm font-bold text-slate-900">{className} – {sectionName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Admission No.</p>
                    <p className="text-sm font-bold text-slate-900">
                      {gatePass.student_id?.admission_no || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Roll No.</p>
                    <p className="text-sm font-bold text-slate-900">
                      {gatePass.student_id?.roll_no || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mx-6 border-t border-dashed border-slate-200" />

              {/* Section 2: Reason */}
              <div className="mx-6 my-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">
                  ② Reason for Early Departure
                </p>
                <p className="text-xs font-bold text-amber-900">{gatePass.reason_type}</p>
                {gatePass.reason_details && (
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">{gatePass.reason_details}</p>
                )}
              </div>

              {/* Section 3: Pickup Person */}
              <div className="mx-6 mb-3 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  ③ Authorized Pickup Person
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <div>
                    <p className="text-[9px] text-slate-400">Name</p>
                    <p className="text-xs font-bold text-slate-900">{gatePass.pickup_person_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">Relationship</p>
                    <p className="text-xs font-bold text-slate-900">{gatePass.pickup_person_relation}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">Mobile</p>
                    <p className="text-xs font-bold text-slate-900">{gatePass.pickup_person_phone}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">ID Proof</p>
                    <p className="text-xs font-bold text-slate-900">{gatePass.pickup_person_id_proof || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Parent Consent */}
              <div className="mx-6 mb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  ④ Parent / Guardian Consent
                </p>
                {gatePass.parent_otp_verified ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">
                        Parent Mobile OTP Verified
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        {fmtTime(gatePass.parent_otp_verified_at)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-800">Parental Consent Pending</p>
                  </div>
                )}
              </div>

              {/* Section 5: Approval Chain */}
              <div className="mx-6 mb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  ⑤ Approval & Authorization Chain
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {/* Class Teacher */}
                  <div
                    className={`rounded-lg border px-3 py-2.5 flex flex-col ${
                      gatePass.teacher_approval?.approved
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1">
                      Class Teacher
                    </p>
                    {gatePass.teacher_approval?.approved ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-600 mb-1" />
                        <p className="text-[10px] font-bold text-emerald-900">
                          {gatePass.teacher_approval.approved_by_name}
                        </p>
                        <p className="text-[9px] text-emerald-600">
                          {fmtTime(gatePass.teacher_approval.approved_at)}
                        </p>
                        {gatePass.teacher_approval.remarks && (
                          <p className="text-[9px] text-slate-500 mt-1 italic">
                            "{gatePass.teacher_approval.remarks}"
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-semibold">Pending</p>
                    )}
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <p className="text-[8px] text-slate-400 italic">Signature</p>
                      <div className="h-4" />
                    </div>
                  </div>

                  {/* Principal */}
                  <div
                    className={`rounded-lg border px-3 py-2.5 flex flex-col ${
                      gatePass.admin_approval?.approved
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1">
                      Principal / HoS
                    </p>
                    {gatePass.admin_approval?.approved ? (
                      <>
                        <CheckCircle2 size={13} className="text-indigo-600 mb-1" />
                        <p className="text-[10px] font-bold text-indigo-900">
                          {gatePass.admin_approval.approved_by_name}
                        </p>
                        <p className="text-[9px] text-indigo-600">
                          {fmtTime(gatePass.admin_approval.approved_at)}
                        </p>
                        {gatePass.admin_approval.remarks && (
                          <p className="text-[9px] text-slate-500 mt-1 italic">
                            "{gatePass.admin_approval.remarks}"
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-semibold">Pending</p>
                    )}
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <p className="text-[8px] text-slate-400 italic">Signature &amp; Stamp</p>
                      <div className="h-4" />
                    </div>
                  </div>

                  {/* Gate Security */}
                  <div
                    className={`rounded-lg border px-3 py-2.5 flex flex-col ${
                      gatePass.gate_security?.released
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1">
                      Security Gate Out
                    </p>
                    {gatePass.gate_security?.released ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-600 mb-1" />
                        <p className="text-[10px] font-bold text-emerald-900">
                          {gatePass.gate_security.released_by_guard}
                        </p>
                        <p className="text-[9px] text-emerald-600">
                          {fmtTime(gatePass.gate_security.released_at)}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {gatePass.gate_security.gate_number}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-500 font-semibold">Not Yet Released</p>
                    )}
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <p className="text-[8px] text-slate-400 italic">Guard Signature</p>
                      <div className="h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: POCSO Notice */}
              <div className="mx-6 mb-4">
                <div className="border-2 border-red-300 bg-red-50 rounded-lg px-4 py-3">
                  <p className="text-[9px] font-black text-red-800 uppercase tracking-wide mb-1">
                    ⚠ POCSO Child Safety Notice — Protection of Children from Sexual Offences Act
                  </p>
                  <p className="text-[9px] text-red-700 leading-relaxed">
                    This document is issued under POCSO compliance by the Campus Safety Department. The school
                    management physically verifies the identity of the authorized pickup person before releasing
                    any student. Any unauthorized attempt to take a child from school premises without this
                    authorized slip will be treated as a criminal offense and immediately reported to the Police
                    and Child Welfare Committee (CWC).
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
                <p className="text-[9px] text-slate-400">
                  Printed: {new Date().toLocaleString("en-IN")}
                </p>
                <div className="text-center">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-500 mx-auto mb-0.5 flex items-center justify-center">
                    <ShieldCheck size={14} className="text-slate-400" />
                  </div>
                  <p className="text-[8px] text-slate-500">School Seal</p>
                </div>
                <p className="text-[9px] text-slate-400">Computer-generated slip</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

