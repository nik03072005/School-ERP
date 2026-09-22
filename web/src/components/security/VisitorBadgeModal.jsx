import { useEffect, useRef } from "react";
import {
  X,
  Printer,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Clock,
} from "lucide-react";
import { campusSecurityService } from "../../api/campusSecurityService";

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function VisitorBadgeModal({ visitor, onClose }) {
  const printRef = useRef(null);

  // Trap focus on mount
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handlePrint = async () => {
    window.print();
    try {
      await campusSecurityService.recordBadgePrint(visitor._id);
    } catch (e) {
      console.warn("Could not record badge print:", e.message);
    }
  };

  if (!visitor) return null;

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #visitor-badge-print, #visitor-badge-print * { visibility: visible !important; }
          #visitor-badge-print {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span className="font-semibold text-slate-800 text-sm">Visitor Badge</span>
              <span className="ml-1 text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                {visitor.pass_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Printer size={14} />
                Print Badge
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Badge Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            <div
              id="visitor-badge-print"
              ref={printRef}
              className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Badge Header */}
              <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
                      <ShieldCheck size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.2em] text-red-200 uppercase">
                        Kidz Galaxy School
                      </p>
                      <h2 className="text-lg font-black leading-tight">VISITOR PASS</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-red-200 font-medium">Pass No.</p>
                    <p className="text-sm font-black font-mono tracking-wide">{visitor.pass_number}</p>
                  </div>
                </div>
              </div>

              {/* Visitor Photo + Name */}
              <div className="flex flex-col items-center gap-3 pt-5 pb-3 px-5">
                {visitor.visitor_photo ? (
                  <img
                    src={visitor.visitor_photo}
                    alt={visitor.visitor_name}
                    className="h-20 w-20 rounded-full object-cover border-4 border-red-100 shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-slate-100 border-4 border-red-100 flex items-center justify-center">
                    <User size={32} className="text-slate-400" />
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900">{visitor.visitor_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {visitor.id_proof_type}
                    {visitor.id_proof_number ? ` • ${visitor.id_proof_number}` : ""}
                  </p>
                </div>
              </div>

              {/* OTP Status Banner */}
              <div className="mx-4 mb-4">
                {visitor.otp_verified ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Mobile OTP Verified</p>
                      <p className="text-[10px] text-emerald-600">
                        {formatDateTime(visitor.otp_verified_at)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <p className="text-xs font-semibold text-amber-800">OTP Verification Pending</p>
                  </div>
                )}
              </div>

              {/* Visit Details Grid */}
              <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Purpose</p>
                  <p className="text-xs font-semibold text-slate-800">{visitor.purpose}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Accompanying</p>
                  <p className="text-xs font-semibold text-slate-800">
                    {visitor.accompanying_count > 0 ? `${visitor.accompanying_count} person(s)` : "Self"}
                  </p>
                </div>
                <div className="col-span-2 bg-blue-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-blue-400 mb-0.5">Meeting With</p>
                  <p className="text-xs font-semibold text-blue-900">{visitor.person_to_meet_name}</p>
                  {visitor.person_to_meet_department && (
                    <p className="text-[10px] text-blue-600">{visitor.person_to_meet_department}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                    <Clock size={9} className="inline mr-0.5" />Check-In
                  </p>
                  <p className="text-xs font-semibold text-slate-800">
                    {visitor.check_in_time
                      ? new Date(visitor.check_in_time).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Date</p>
                  <p className="text-xs font-semibold text-slate-800">
                    {visitor.check_in_time
                      ? new Date(visitor.check_in_time).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                {visitor.vehicle_number && (
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Vehicle</p>
                    <p className="text-xs font-semibold text-slate-800">{visitor.vehicle_number}</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Gate</p>
                  <p className="text-xs font-semibold text-slate-800">{visitor.gate_number || "Gate 1"}</p>
                </div>
              </div>

              {/* POCSO Notice */}
              <div className="mx-4 mt-2 mb-4">
                <div className="border border-red-200 bg-red-50 rounded-lg px-3 py-2">
                  <p className="text-[9px] font-black text-red-800 uppercase tracking-wide mb-1">
                    ⚠ POCSO Child Safety Protocol Active
                  </p>
                  <p className="text-[9px] text-red-700 leading-relaxed">
                    This visit is recorded under POCSO Child Safety Protocol. Escort on campus is mandatory at all times.
                    Unauthorized contact with minors is strictly prohibited and punishable under applicable law.
                    Badge must be worn visibly throughout campus stay.
                  </p>
                </div>
              </div>

              {/* Barcode placeholder */}
              <div className="mx-4 mb-4 border border-slate-200 rounded-lg px-4 py-3 flex flex-col items-center">
                <div className="flex items-end gap-px mb-2">
                  {Array.from(visitor.pass_number || "VIS-2026-0000").map((ch, i) => (
                    <div
                      key={i}
                      className="bg-slate-800"
                      style={{
                        width: ch === "-" ? "3px" : "2px",
                        height: `${18 + ((i * 7 + 11) % 14)}px`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-slate-500 tracking-[0.35em]">{visitor.pass_number}</p>
              </div>

              {/* Footer */}
              <div className="bg-slate-800 text-white text-center px-4 py-2">
                <p className="text-[9px] tracking-wide">
                  Kidz Galaxy School • Campus Security Management System • POCSO Compliant
                </p>
                {visitor.security_guard_name && (
                  <p className="text-[8px] text-slate-400 mt-0.5">Verified by: {visitor.security_guard_name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

