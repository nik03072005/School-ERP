import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Phone,
  ChevronDown,
  Printer,
  Loader2,
  FileText,
} from "lucide-react";
import { campusSecurityService } from "../../api/campusSecurityService";
import EarlyGatePassSlipModal from "../../components/security/EarlyGatePassSlipModal";

const GATE_STATUS_CONFIG = {
  pending: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    label: "Pending Approval",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  approved_by_teacher: {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    label: "Teacher Approved",
    icon: CheckCircle2,
    iconColor: "text-blue-500",
  },
  approved_by_admin: {
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    label: "Principal Approved — Ready at Gate",
    icon: CheckCircle2,
    iconColor: "text-indigo-500",
  },
  released_at_gate: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "Released at Gate ✓",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  rejected: {
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    label: "Rejected",
    icon: XCircle,
    iconColor: "text-rose-500",
  },
};

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// Approval progress tracker
function ApprovalProgress({ gp }) {
  const steps = [
    { label: "Parent OTP", done: gp.parent_otp_verified, info: gp.parent_otp_verified ? fmtDateTime(gp.parent_otp_verified_at) : "Pending" },
    { label: "Class Teacher", done: gp.teacher_approval?.approved, info: gp.teacher_approval?.approved_by_name || "Pending" },
    { label: "Principal", done: gp.admin_approval?.approved, info: gp.admin_approval?.approved_by_name || "Pending" },
    { label: "Gate Released", done: gp.gate_security?.released, info: gp.gate_security?.released_at ? fmtDateTime(gp.gate_security.released_at) : "Pending" },
  ];

  return (
    <div className="flex items-start gap-1 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center mb-1 ${step.done ? "bg-emerald-500" : "bg-slate-200"}`}>
            {step.done ? (
              <CheckCircle2 size={12} className="text-white" />
            ) : (
              <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className={`absolute`} />
          )}
          <p className={`text-[9px] text-center font-semibold ${step.done ? "text-emerald-700" : "text-slate-400"}`}>
            {step.label}
          </p>
          <p className="text-[8px] text-center text-slate-400 max-w-[60px] truncate">{step.info}</p>
        </div>
      ))}
    </div>
  );
}

export default function StudentGatePass() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [slipPass, setSlipPass] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await campusSecurityService.getMyPasses();
        setPasses(res.gatePasses || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const active = passes.filter((p) =>
    ["pending", "approved_by_teacher", "approved_by_admin"].includes(p.approval_status)
  );
  const past = passes.filter((p) =>
    ["released_at_gate", "rejected"].includes(p.approval_status)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">My Gate Passes</h1>
            <p className="text-xs text-slate-500">View early departure authorizations and POCSO-compliant pickup records</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : passes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <ShieldCheck size={32} className="opacity-40" />
            </div>
            <p className="font-semibold text-sm">No gate passes issued yet</p>
            <p className="text-xs mt-1 text-center max-w-xs">
              If your parent or guardian requests your early departure from school, the authorization pass will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active / In Progress */}
            {active.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-800">Active Requests ({active.length})</h2>
                </div>
                <div className="space-y-3">
                  {active.map((gp) => (
                    <GatePassCard
                      key={gp._id}
                      gp={gp}
                      expanded={expanded}
                      setExpanded={setExpanded}
                      onPrint={() => setSlipPass(gp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past passes */}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-3">Past Gate Passes</h2>
                <div className="space-y-3">
                  {past.map((gp) => (
                    <GatePassCard
                      key={gp._id}
                      gp={gp}
                      expanded={expanded}
                      setExpanded={setExpanded}
                      onPrint={() => setSlipPass(gp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* POCSO notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800 mb-1">POCSO Child Safety Protection</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    All gate passes are issued under the Protection of Children from Sexual Offences (POCSO) Act.
                    Your school ensures that every student departure is authorized by both parents/guardian and school
                    authority before you leave campus. This keeps you safe at all times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {slipPass && (
        <EarlyGatePassSlipModal gatePass={slipPass} onClose={() => setSlipPass(null)} />
      )}
    </div>
  );
}

function GatePassCard({ gp, expanded, setExpanded, onPrint }) {
  const config = GATE_STATUS_CONFIG[gp.approval_status] || GATE_STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const isExpanded = expanded === gp._id;

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${
      gp.approval_status === "released_at_gate"
        ? "border-emerald-200"
        : gp.approval_status === "rejected"
        ? "border-rose-200"
        : gp.approval_status === "pending"
        ? "border-amber-200"
        : "border-slate-200"
    }`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(isExpanded ? null : gp._id)}
      >
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              gp.approval_status === "released_at_gate" ? "bg-emerald-50" :
              gp.approval_status === "rejected" ? "bg-rose-50" :
              gp.approval_status === "pending" ? "bg-amber-50" : "bg-blue-50"
            }`}>
              <StatusIcon size={18} className={config.iconColor} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">{gp.pass_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onPrint(); }}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Printer size={12} />
              Slip
            </button>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Reason + Date */}
        <div className="mt-3 space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {gp.reason_type}
          </p>
          <p className="text-xs text-slate-500">{gp.reason_details}</p>
          <p className="text-[11px] text-slate-400">
            📅 {fmtDate(gp.departure_time)}
            {gp.actual_exit_time ? ` • Exited at ${new Date(gp.actual_exit_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </div>

        {/* Pickup Person */}
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <User size={12} className="text-slate-400 shrink-0" />
          <span>
            <span className="font-semibold">{gp.pickup_person_name}</span>
            <span className="text-slate-400"> ({gp.pickup_person_relation})</span>
          </span>
          <span className="text-slate-300">•</span>
          <Phone size={11} className="text-slate-400" />
          <span>{gp.pickup_person_phone}</span>
        </div>

        {/* Progress Tracker */}
        <ApprovalProgress gp={gp} />
      </div>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3 text-xs">
          {/* Parent consent */}
          <div>
            <p className="font-semibold text-slate-600 mb-1">Parent / Guardian Consent</p>
            {gp.parent_otp_verified ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <p className="text-emerald-800 font-semibold">Mobile OTP Verified — {fmtDateTime(gp.parent_otp_verified_at)}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={13} className="text-amber-600" />
                <p className="text-amber-800 font-semibold">Consent Pending</p>
              </div>
            )}
          </div>

          {/* Approval status details */}
          {gp.teacher_approval?.approved && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="font-semibold text-blue-800">✅ Class Teacher</p>
              <p className="text-blue-700">{gp.teacher_approval.approved_by_name}</p>
              <p className="text-blue-500">{fmtDateTime(gp.teacher_approval.approved_at)}</p>
              {gp.teacher_approval.remarks && <p className="text-slate-500 italic mt-0.5">"{gp.teacher_approval.remarks}"</p>}
            </div>
          )}

          {gp.admin_approval?.approved && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              <p className="font-semibold text-indigo-800">✅ Principal / School Authority</p>
              <p className="text-indigo-700">{gp.admin_approval.approved_by_name}</p>
              <p className="text-indigo-500">{fmtDateTime(gp.admin_approval.approved_at)}</p>
            </div>
          )}

          {gp.gate_security?.released && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <p className="font-semibold text-emerald-800">🚪 Released at Gate</p>
              <p className="text-emerald-700">Guard: {gp.gate_security.released_by_guard}</p>
              <p className="text-emerald-600">{gp.gate_security.gate_number} • {fmtDateTime(gp.gate_security.released_at)}</p>
            </div>
          )}

          {gp.approval_status === "rejected" && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <p className="font-semibold text-rose-800">❌ Pass Rejected</p>
              {gp.rejection_reason && <p className="text-rose-600 mt-0.5">{gp.rejection_reason}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

