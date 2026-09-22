import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  UserCheck,
  Loader2,
  Printer,
  ChevronDown,
  RefreshCw,
  XCircle,
  X,
} from "lucide-react";
import { campusSecurityService } from "../../api/campusSecurityService";
import EarlyGatePassSlipModal from "../../components/security/EarlyGatePassSlipModal";

const GATE_STATUS_STYLES = {
  pending: { badge: "bg-amber-50 text-amber-800 border-amber-200", label: "Pending Approval" },
  approved_by_teacher: { badge: "bg-blue-50 text-blue-800 border-blue-200", label: "Teacher Approved" },
  approved_by_admin: { badge: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "Principal Approved" },
  released_at_gate: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Released at Gate" },
  rejected: { badge: "bg-rose-50 text-rose-800 border-rose-200", label: "Rejected" },
};

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function TeacherGatePassAdmin() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [slipPass, setSlipPass] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejecting, setRejecting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await campusSecurityService.getTeacherPasses();
      setPasses(res.gatePasses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    if (!approvingId) return;
    setApproving(true);
    try {
      await campusSecurityService.approveByTeacher(approvingId, { remarks: approveRemarks });
      setApprovingId(null);
      setApproveRemarks("");
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setRejecting(true);
    try {
      await campusSecurityService.rejectGatePass(rejectingId, { reason: approveRemarks });
      setRejectingId(null);
      setApproveRemarks("");
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setRejecting(false);
    }
  };

  const pending = passes.filter((p) => p.approval_status === "pending");
  const others = passes.filter((p) => p.approval_status !== "pending");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Gate Pass Approvals</h1>
            <p className="text-xs text-slate-500">Review early departure requests for your class students</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-violet-500" />
          </div>
        ) : passes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <ShieldCheck size={44} className="mb-3 opacity-30" />
            <p className="font-semibold text-sm">No gate pass requests</p>
            <p className="text-xs mt-1 text-center">Early departure requests for your class will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending queue */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={15} className="text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-800">
                    Awaiting Your Approval ({pending.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pending.map((gp) => <PassCard key={gp._id} gp={gp} expanded={expanded} setExpanded={setExpanded} setSlipPass={setSlipPass} setApprovingId={setApprovingId} setRejectingId={setRejectingId} />)}
                </div>
              </div>
            )}

            {/* Already processed */}
            {others.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-3">Recent Gate Passes</h2>
                <div className="space-y-3">
                  {others.map((gp) => <PassCard key={gp._id} gp={gp} expanded={expanded} setExpanded={setExpanded} setSlipPass={setSlipPass} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Class Teacher Approval</h3>
            </div>
            <p className="text-xs text-slate-500">
              As the Class Teacher, your digital signature confirms you have reviewed this early departure request and found it valid.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks (Optional)</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none"
                placeholder="e.g. Appointment prescription verified. Class work notes given."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setApprovingId(null); setApproveRemarks(""); }} className="flex-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={approving} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-xl transition-colors disabled:opacity-50">
                {approving && <Loader2 size={13} className="animate-spin" />}
                Sign & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <XCircle size={18} className="text-rose-600" />
              <h3 className="font-bold text-slate-800 text-sm">Reject Gate Pass Request</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Rejection *</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none"
                placeholder="e.g. Pickup person not matching registered guardian records."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRejectingId(null); setApproveRemarks(""); }} className="flex-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleReject} disabled={rejecting} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 py-2 rounded-xl transition-colors disabled:opacity-50">
                {rejecting && <Loader2 size={13} className="animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {slipPass && <EarlyGatePassSlipModal gatePass={slipPass} onClose={() => setSlipPass(null)} />}
    </div>
  );
}

function PassCard({ gp, expanded, setExpanded, setSlipPass, setApprovingId, setRejectingId }) {
  const styles = GATE_STATUS_STYLES[gp.approval_status] || GATE_STATUS_STYLES.pending;
  const studentUser = gp.student_id?.user_id || {};
  const studentName = `${studentUser.first_name || ""} ${studentUser.last_name || ""}`.trim();
  const isExpanded = expanded === gp._id;
  const isPending = gp.approval_status === "pending";

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${isPending ? "border-amber-200 shadow-sm shadow-amber-100" : "border-slate-200"}`}>
      <div
        className="p-4 flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(isExpanded ? null : gp._id)}
      >
        {/* Avatar */}
        {studentUser.avatar ? (
          <img src={studentUser.avatar} className="h-11 w-11 rounded-full object-cover border-2 border-slate-100 shrink-0" alt="" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User size={18} className="text-slate-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-sm">{studentName}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
              {styles.label}
            </span>
            {gp.parent_otp_verified && (
              <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
                <CheckCircle2 size={10} /> Parent OTP ✓
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>🏫 {gp.class_id?.name} {gp.section_id?.name} • <span className="font-mono">{gp.pass_number}</span></p>
            <p>📋 {gp.reason_type}</p>
            <p>🚶 Pickup: {gp.pickup_person_name} ({gp.pickup_person_relation}) • {gp.pickup_person_phone}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requested: {fmtDateTime(gp.departure_time)}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSlipPass(gp)}
            className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5"
          >
            <Printer size={12} className="inline mr-1" />
            Slip
          </button>
          {isPending && setApprovingId && (
            <>
              <button
                onClick={() => setApprovingId(gp._id)}
                className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5"
              >
                <UserCheck size={12} className="inline mr-1" />
                Approve
              </button>
              <button
                onClick={() => setRejectingId(gp._id)}
                className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg px-2.5 py-1.5"
              >
                <X size={12} className="inline mr-1" />
                Reject
              </button>
            </>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Expanded reason details */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-2">
          <div>
            <p className="font-semibold text-slate-500">Reason Details</p>
            <p>{gp.reason_details}</p>
          </div>
          {gp.pickup_person_id_proof && (
            <div>
              <p className="font-semibold text-slate-500">Pickup Person ID Proof</p>
              <p>{gp.pickup_person_id_proof}</p>
            </div>
          )}
          {gp.teacher_approval?.approved && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
              <p className="font-semibold text-blue-700">Teacher Approved by {gp.teacher_approval.approved_by_name}</p>
              <p className="text-blue-500">{fmtDateTime(gp.teacher_approval.approved_at)}</p>
            </div>
          )}
          {gp.admin_approval?.approved && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2">
              <p className="font-semibold text-indigo-700">Principal Approved by {gp.admin_approval.approved_by_name}</p>
              <p className="text-indigo-500">{fmtDateTime(gp.admin_approval.approved_at)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

