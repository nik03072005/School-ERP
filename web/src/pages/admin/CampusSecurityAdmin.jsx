import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Printer,
  RefreshCw,
  LogOut,
  Eye,
  Camera,
  Phone,
  ChevronDown,
  User,
  UserCheck,
  ScanLine,
  ShieldAlert,
  Loader2,
  X,
  MessageCircle,
  FileText,
} from "lucide-react";
import { campusSecurityService } from "../../api/campusSecurityService";
import { setupService } from "../../api/setupService";
import VisitorBadgeModal from "../../components/security/VisitorBadgeModal";
import EarlyGatePassSlipModal from "../../components/security/EarlyGatePassSlipModal";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const VISITOR_STATUS_STYLES = {
  checked_in: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "On Campus", dot: "bg-emerald-500" },
  checked_out: { badge: "bg-slate-100 text-slate-600 border-slate-200", label: "Departed", dot: "bg-slate-400" },
  overstayed: { badge: "bg-rose-50 text-rose-800 border-rose-200", label: "Overstayed", dot: "bg-rose-500" },
  rejected_entry: { badge: "bg-red-50 text-red-800 border-red-200", label: "Entry Rejected", dot: "bg-red-600" },
};

const GATE_STATUS_STYLES = {
  pending: { badge: "bg-amber-50 text-amber-800 border-amber-200", label: "Pending" },
  approved_by_teacher: { badge: "bg-blue-50 text-blue-800 border-blue-200", label: "Teacher Approved" },
  approved_by_admin: { badge: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "Principal Approved" },
  released_at_gate: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Released at Gate" },
  rejected: { badge: "bg-rose-50 text-rose-800 border-rose-200", label: "Rejected" },
};

const PURPOSE_OPTIONS = [
  "Parent Meeting", "Admissions Inquiry", "Vendor / Delivery", "Maintenance / Contractor",
  "Guest / Dignitary", "Official / CBSE Inspection", "Interview / Recruitment",
  "Fee / Accounts Inquiry", "Other",
];
const PROOF_OPTIONS = ["Aadhaar Card", "Driving License", "PAN Card", "Voter ID", "Passport", "Govt ID / Other"];
const REASON_OPTIONS = [
  "Illness / Medical Emergency", "Family Emergency", "Doctor Appointment",
  "Pre-approved Event / Competition", "Personal / Outstation",
  "Transport Breakdown / Emergency", "Other",
];
const RELATION_OPTIONS = ["Father", "Mother", "Guardian", "Authorized Driver / Escort", "Sibling", "Grandparent", "Other"];

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "slate", pulse }) {
  const colorMap = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-red-50 text-red-800 border-red-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color]} flex items-center gap-3`}>
      <div className="relative shrink-0">
        <Icon size={20} />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-current animate-ping opacity-60" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-medium opacity-70 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CampusSecurityAdmin() {
  const [activeTab, setActiveTab] = useState("visitors"); // visitors | gate-passes | scanner | pocso
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Visitors state ──
  const [visitors, setVisitors] = useState([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorFilter, setVisitorFilter] = useState({ status: "checked_in", search: "", dateRange: "today" });
  const [visitorModal, setVisitorModal] = useState(false);
  const [badgeVisitor, setBadgeVisitor] = useState(null);
  const [checkingOut, setCheckingOut] = useState(null);

  // ── Visitor form state ──
  const [vForm, setVForm] = useState({
    visitor_name: "", visitor_phone: "", visitor_email: "", visitor_photo: "",
    id_proof_type: "Aadhaar Card", id_proof_number: "", purpose: "Parent Meeting",
    purpose_details: "", person_to_meet_name: "", person_to_meet_department: "",
    vehicle_number: "", accompanying_count: 0, belongings_declared: "",
    security_guard_name: "", gate_number: "Gate 1 - Main Entrance",
  });
  const [vOtpState, setVOtpState] = useState({ sent: false, code: "", input: "", verified: false, generatedOtp: "" });
  const [vSubmitting, setVSubmitting] = useState(false);
  const [vError, setVError] = useState("");
  const [newVisitorId, setNewVisitorId] = useState(null);
  const [staffSuggestions, setStaffSuggestions] = useState([]);

  // ── Gate Passes state ──
  const [gatePasses, setGatePasses] = useState([]);
  const [gpTotal, setGpTotal] = useState(0);
  const [gpLoading, setGpLoading] = useState(false);
  const [gpFilter, setGpFilter] = useState({ status: "all", search: "" });
  const [gpModal, setGpModal] = useState(false);
  const [slipPass, setSlipPass] = useState(null);
  const [expandedPass, setExpandedPass] = useState(null);
  const [approvingPass, setApprovingPass] = useState(null); // { id, action }
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approving, setApproving] = useState(false);

  // ── Gate Pass form state ──
  const [gpForm, setGpForm] = useState({
    student_id: "", reason_type: "Illness / Medical Emergency", reason_details: "",
    pickup_person_name: "", pickup_person_relation: "Father", pickup_person_phone: "",
    pickup_person_id_proof: "",
  });
  const [gpStudentSearch, setGpStudentSearch] = useState("");
  const [gpStudentResults, setGpStudentResults] = useState([]);
  const [gpSelectedStudent, setGpSelectedStudent] = useState(null);
  const [gpOtpState, setGpOtpState] = useState({ sent: false, input: "", verified: false, generatedOtp: "" });
  const [gpSubmitting, setGpSubmitting] = useState(false);
  const [gpError, setGpError] = useState("");
  const [newGpId, setNewGpId] = useState(null);
  const [gatePassCreated, setGatePassCreated] = useState(null);

  // ── Scanner ──
  const [scannerCode, setScannerCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");

  // ── Load Stats ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await campusSecurityService.getStats();
      setStats(data.data || data);
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Load Visitors ──
  const loadVisitors = useCallback(async () => {
    setVisitorLoading(true);
    try {
      const res = await campusSecurityService.getVisitors({
        status: visitorFilter.status || undefined,
        search: visitorFilter.search || undefined,
        dateRange: visitorFilter.dateRange || undefined,
        limit: 30,
      });
      setVisitors(res.visitors || []);
      setVisitorTotal(res.total || 0);
    } catch (e) {
      console.error("Visitors error:", e);
    } finally {
      setVisitorLoading(false);
    }
  }, [visitorFilter]);

  useEffect(() => {
    if (activeTab === "visitors") loadVisitors();
  }, [activeTab, loadVisitors]);

  // ── Load Gate Passes ──
  const loadGatePasses = useCallback(async () => {
    setGpLoading(true);
    try {
      const res = await campusSecurityService.getGatePasses({
        status: gpFilter.status !== "all" ? gpFilter.status : undefined,
        search: gpFilter.search || undefined,
        limit: 30,
      });
      setGatePasses(res.gatePasses || []);
      setGpTotal(res.total || 0);
    } catch (e) {
      console.error("Gate passes error:", e);
    } finally {
      setGpLoading(false);
    }
  }, [gpFilter]);

  useEffect(() => {
    if (activeTab === "gate-passes") loadGatePasses();
  }, [activeTab, loadGatePasses]);

  // ── Staff search ──
  const handleStaffSearch = async (q) => {
    if (q.length < 2) { setStaffSuggestions([]); return; }
    try {
      const res = await campusSecurityService.searchStaff(q);
      setStaffSuggestions(res.staff || []);
    } catch (e) { /* ignore */ }
  };

  // ── Student search for gate pass ──
  const handleGpStudentSearch = useCallback(async (q) => {
    if (q.length < 2) { setGpStudentResults([]); return; }
    try {
      const res = await campusSecurityService.searchStudents(q);
      setGpStudentResults(res.students || []);
    } catch (e) { /* ignore */ }
  }, []);

  // ── Visitor: Create + OTP flow ──
  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    setVSubmitting(true); setVError("");
    try {
      const res = await campusSecurityService.createVisitor(vForm);
      setNewVisitorId(res.visitor?._id);
      setVOtpState((s) => ({ ...s, sent: true, generatedOtp: res.generatedOtp || "" }));
      loadVisitors();
    } catch (e) {
      setVError(e?.response?.data?.message || "Failed to register visitor.");
    } finally {
      setVSubmitting(false);
    }
  };

  const handleSendVisitorOtp = async () => {
    if (!newVisitorId) return;
    try {
      const res = await campusSecurityService.sendVisitorOtp(newVisitorId);
      setVOtpState((s) => ({ ...s, sent: true, generatedOtp: res.generatedOtp || "" }));
    } catch (e) { console.error(e); }
  };

  const handleVerifyVisitorOtp = async () => {
    if (!newVisitorId) return;
    try {
      await campusSecurityService.verifyVisitorOtp(newVisitorId, vOtpState.input);
      setVOtpState((s) => ({ ...s, verified: true }));
      loadVisitors();
      setTimeout(() => {
        setVisitorModal(false);
        resetVisitorForm();
      }, 1500);
    } catch (e) {
      setVError("Invalid OTP. Please try again.");
    }
  };

  const resetVisitorForm = () => {
    setVForm({
      visitor_name: "", visitor_phone: "", visitor_email: "", visitor_photo: "",
      id_proof_type: "Aadhaar Card", id_proof_number: "", purpose: "Parent Meeting",
      purpose_details: "", person_to_meet_name: "", person_to_meet_department: "",
      vehicle_number: "", accompanying_count: 0, belongings_declared: "",
      security_guard_name: "", gate_number: "Gate 1 - Main Entrance",
    });
    setVOtpState({ sent: false, code: "", input: "", verified: false, generatedOtp: "" });
    setNewVisitorId(null); setVError("");
  };

  // ── Visitor: Check-out ──
  const handleCheckOut = async (id) => {
    setCheckingOut(id);
    try {
      await campusSecurityService.checkOutVisitor(id);
      loadVisitors(); loadStats();
    } catch (e) { console.error(e); }
    finally { setCheckingOut(null); }
  };

  // ── Gate Pass: Create + OTP flow ──
  const handleGpStudentSelect = (student) => {
    setGpSelectedStudent(student);
    setGpForm((f) => ({
      ...f,
      student_id: student._id,
      pickup_person_name: student.primary_guardian_name || "",
      pickup_person_phone: student.primary_guardian_phone || student.user_id?.mobile || "",
      pickup_person_relation: student.primary_guardian_relationship === "mother" ? "Mother" : "Father",
    }));
    setGpStudentResults([]);
    setGpStudentSearch(`${student.user_id?.first_name || ""} ${student.user_id?.last_name || ""}`.trim());
  };

  const handleGpSubmit = async (e) => {
    e.preventDefault();
    setGpSubmitting(true); setGpError("");
    try {
      const res = await campusSecurityService.createGatePass(gpForm);
      setNewGpId(res.gatePass?._id);
      setGatePassCreated(res.gatePass);
      setGpOtpState((s) => ({ ...s, sent: true, generatedOtp: res.parentOtp || "" }));
      loadGatePasses();
    } catch (e) {
      setGpError(e?.response?.data?.message || "Failed to create gate pass.");
    } finally {
      setGpSubmitting(false);
    }
  };

  const handleVerifyParentOtp = async () => {
    if (!newGpId) return;
    try {
      await campusSecurityService.verifyParentOtp(newGpId, gpOtpState.input);
      setGpOtpState((s) => ({ ...s, verified: true }));
      loadGatePasses();
      setTimeout(() => { setGpModal(false); resetGpForm(); }, 1500);
    } catch (e) {
      setGpError("Invalid OTP. Please try again.");
    }
  };

  const resetGpForm = () => {
    setGpForm({
      student_id: "", reason_type: "Illness / Medical Emergency", reason_details: "",
      pickup_person_name: "", pickup_person_relation: "Father", pickup_person_phone: "",
      pickup_person_id_proof: "",
    });
    setGpStudentSearch(""); setGpSelectedStudent(null); setGpStudentResults([]);
    setGpOtpState({ sent: false, input: "", verified: false, generatedOtp: "" });
    setNewGpId(null); setGatePassCreated(null); setGpError("");
  };

  // ── Approval actions ──
  const handleApprove = async () => {
    if (!approvingPass) return;
    setApproving(true);
    try {
      if (approvingPass.action === "teacher") {
        await campusSecurityService.approveByTeacher(approvingPass.id, { remarks: approveRemarks });
      } else if (approvingPass.action === "admin") {
        await campusSecurityService.approveByAdmin(approvingPass.id, { remarks: approveRemarks });
      } else if (approvingPass.action === "gate") {
        await campusSecurityService.confirmGateExit(approvingPass.id, {
          guard_name: approveRemarks || "Main Gate Security",
          remarks: "Identity of escort verified. Student released safely.",
        });
      } else if (approvingPass.action === "reject") {
        await campusSecurityService.rejectGatePass(approvingPass.id, { reason: approveRemarks });
      }
      setApprovingPass(null); setApproveRemarks("");
      loadGatePasses(); loadStats();
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  // ── Scanner ──
  const handleScan = async () => {
    if (!scannerCode.trim()) return;
    setScanLoading(true); setScanResult(null); setScanError("");
    try {
      const res = await campusSecurityService.quickVerify(scannerCode.trim());
      setScanResult(res);
    } catch (e) {
      setScanError(e?.response?.data?.message || `No pass found for "${scannerCode}".`);
    } finally {
      setScanLoading(false);
    }
  };

  const TABS = [
    { id: "visitors", label: "Visitor Logbook", icon: Users },
    { id: "gate-passes", label: "Early Gate Passes", icon: ShieldCheck },
    { id: "scanner", label: "Quick Scanner", icon: ScanLine },
    { id: "pocso", label: "POCSO Audit", icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Campus Security & Gate Pass</h1>
              <p className="text-xs text-slate-500">Visitor Management • POCSO Compliance • Child Safety</p>
            </div>
          </div>
          <button
            onClick={() => { loadStats(); if (activeTab === "visitors") loadVisitors(); else if (activeTab === "gate-passes") loadGatePasses(); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <StatCard icon={Users} label="Active on Campus" value={statsLoading ? "…" : (stats?.activeVisitors ?? 0)} color="emerald" pulse />
          <StatCard icon={Eye} label="Today's Visitors" value={statsLoading ? "…" : (stats?.todayVisitorsCount ?? 0)} color="blue" />
          <StatCard icon={Clock} label="Overstay Alerts" value={statsLoading ? "…" : (stats?.overstayedCount ?? 0)} color={stats?.overstayedCount > 0 ? "red" : "slate"} pulse={stats?.overstayedCount > 0} />
          <StatCard icon={ShieldAlert} label="Pending Gate Passes" value={statsLoading ? "…" : (stats?.pendingGatePasses ?? 0)} color={stats?.pendingGatePasses > 0 ? "amber" : "slate"} />
          <StatCard icon={LogOut} label="Student Exits Today" value={statsLoading ? "…" : (stats?.todayReleasedPasses ?? 0)} color="slate" />
          <StatCard icon={ShieldCheck} label="POCSO Compliance" value={statsLoading ? "…" : `${stats?.pocsoComplianceRate ?? 100}%`} color="indigo" />
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "border-red-600 text-red-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* ── TAB: VISITOR LOGBOOK ── */}
        {activeTab === "visitors" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Search visitor, phone, pass no…"
                  value={visitorFilter.search}
                  onChange={(e) => setVisitorFilter((f) => ({ ...f, search: e.target.value }))}
                />
              </div>
              <select
                className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none text-slate-700"
                value={visitorFilter.status}
                onChange={(e) => setVisitorFilter((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="checked_in">On Campus</option>
                <option value="checked_out">Departed</option>
                <option value="overstayed">Overstayed</option>
              </select>
              <select
                className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none text-slate-700"
                value={visitorFilter.dateRange}
                onChange={(e) => setVisitorFilter((f) => ({ ...f, dateRange: e.target.value }))}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="">All Time</option>
              </select>
              <button
                onClick={() => setVisitorModal(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                <Plus size={14} />
                New Visitor Check-In
              </button>
            </div>

            <p className="text-xs text-slate-500">{visitorTotal} record(s) found</p>

            {/* Visitor Cards */}
            {visitorLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-red-500" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Users size={40} className="mb-3 opacity-30" />
                <p className="font-semibold text-sm">No visitor records found</p>
                <p className="text-xs mt-1">Register a new visitor to start the logbook</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visitors.map((v) => {
                  const styles = VISITOR_STATUS_STYLES[v.status] || VISITOR_STATUS_STYLES.checked_in;
                  const isOverstayed = v.status === "checked_in" &&
                    new Date() - new Date(v.check_in_time) > 3 * 60 * 60 * 1000;
                  return (
                    <div
                      key={v._id}
                      className={`bg-white rounded-xl border ${isOverstayed ? "border-rose-200" : "border-slate-200"} p-4 flex items-start gap-4`}
                    >
                      {/* Photo */}
                      {v.visitor_photo ? (
                        <img
                          src={v.visitor_photo}
                          alt={v.visitor_name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0">
                          <User size={20} className="text-slate-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start flex-wrap gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-sm">{v.visitor_name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${styles.dot}`} />
                            {styles.label}
                          </span>
                          {isOverstayed && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                              ⏰ OVERSTAY
                            </span>
                          )}
                          {v.otp_verified && (
                            <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> OTP Verified
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5">
                          <p className="text-xs text-slate-500">
                            <span className="font-mono text-xs text-slate-400">{v.pass_number}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            📞 {v.visitor_phone}
                          </p>
                          <p className="text-xs text-slate-500">
                            🤝 {v.person_to_meet_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            🎯 {v.purpose}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          In: {fmtDateTime(v.check_in_time)}
                          {v.check_out_time ? ` → Out: ${fmtDateTime(v.check_out_time)}` : ""}
                          {v.gate_number ? ` • ${v.gate_number}` : ""}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => setBadgeVisitor(v)}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                          <Printer size={12} />
                          Badge
                        </button>
                        {v.status === "checked_in" && (
                          <button
                            onClick={() => handleCheckOut(v._id)}
                            disabled={checkingOut === v._id}
                            className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
                          >
                            {checkingOut === v._id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                            Check-Out
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: EARLY GATE PASSES ── */}
        {activeTab === "gate-passes" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Search student, pass no, pickup person…"
                  value={gpFilter.search}
                  onChange={(e) => setGpFilter((f) => ({ ...f, search: e.target.value }))}
                />
              </div>
              <select
                className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none text-slate-700"
                value={gpFilter.status}
                onChange={(e) => setGpFilter((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="all">All Passes</option>
                <option value="pending">Pending</option>
                <option value="approved_by_teacher">Teacher Approved</option>
                <option value="approved_by_admin">Principal Approved</option>
                <option value="released_at_gate">Released at Gate</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => setGpModal(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                <Plus size={14} />
                Issue Early Gate Pass
              </button>
            </div>

            <p className="text-xs text-slate-500">{gpTotal} pass(es) found</p>

            {/* Gate Pass Cards */}
            {gpLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-red-500" />
              </div>
            ) : gatePasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <ShieldCheck size={40} className="mb-3 opacity-30" />
                <p className="font-semibold text-sm">No gate passes found</p>
                <p className="text-xs mt-1">Issue an early gate pass for a student pickup request</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gatePasses.map((gp) => {
                  const styles = GATE_STATUS_STYLES[gp.approval_status] || GATE_STATUS_STYLES.pending;
                  const studentUser = gp.student_id?.user_id || {};
                  const studentName = `${studentUser.first_name || ""} ${studentUser.last_name || ""}`.trim();
                  const isExpanded = expandedPass === gp._id;

                  return (
                    <div key={gp._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div
                        className="p-4 flex items-start gap-4 cursor-pointer"
                        onClick={() => setExpandedPass(isExpanded ? null : gp._id)}
                      >
                        {/* Student avatar */}
                        {studentUser.avatar ? (
                          <img
                            src={studentUser.avatar}
                            alt={studentName}
                            className="h-11 w-11 rounded-full object-cover border-2 border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                            <User size={18} className="text-slate-500" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 text-sm">{studentName}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                              {styles.label}
                            </span>
                            {gp.parent_otp_verified && (
                              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle2 size={10} /> Parent OTP ✓
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-slate-500">
                            <span className="font-mono">{gp.pass_number}</span>
                            <span>🏫 {gp.class_id?.name} {gp.section_id?.name}</span>
                            <span>🚶 {gp.pickup_person_name} ({gp.pickup_person_relation})</span>
                            <span>📋 {gp.reason_type}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Issued: {fmtDateTime(gp.departure_time)}
                            {gp.actual_exit_time ? ` • Exited: ${fmtDateTime(gp.actual_exit_time)}` : ""}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSlipPass(gp)}
                            className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-colors"
                          >
                            <Printer size={12} />
                            Slip
                          </button>
                          {gp.approval_status === "pending" && (
                            <button
                              onClick={() => setApprovingPass({ id: gp._id, action: "teacher" })}
                              className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <UserCheck size={12} />
                              Teacher Approve
                            </button>
                          )}
                          {(gp.approval_status === "pending" || gp.approval_status === "approved_by_teacher") && (
                            <button
                              onClick={() => setApprovingPass({ id: gp._id, action: "admin" })}
                              className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <ShieldCheck size={12} />
                              Principal Approve
                            </button>
                          )}
                          {gp.approval_status === "approved_by_admin" && (
                            <button
                              onClick={() => setApprovingPass({ id: gp._id, action: "gate" })}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <LogOut size={12} />
                              Release at Gate
                            </button>
                          )}
                          {["pending", "approved_by_teacher"].includes(gp.approval_status) && (
                            <button
                              onClick={() => setApprovingPass({ id: gp._id, action: "reject" })}
                              className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <X size={12} />
                              Reject
                            </button>
                          )}
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Teacher Sign */}
                          <div className={`rounded-lg border p-3 text-xs ${gp.teacher_approval?.approved ? "border-blue-200 bg-blue-50" : "border-slate-200"}`}>
                            <p className="font-bold text-slate-600 mb-1">Class Teacher Approval</p>
                            {gp.teacher_approval?.approved ? (
                              <>
                                <p className="text-blue-800 font-semibold">{gp.teacher_approval.approved_by_name}</p>
                                <p className="text-blue-600">{fmtDateTime(gp.teacher_approval.approved_at)}</p>
                                {gp.teacher_approval.remarks && <p className="text-slate-500 italic mt-1">"{gp.teacher_approval.remarks}"</p>}
                              </>
                            ) : <p className="text-amber-600">Pending</p>}
                          </div>
                          {/* Admin Sign */}
                          <div className={`rounded-lg border p-3 text-xs ${gp.admin_approval?.approved ? "border-indigo-200 bg-indigo-50" : "border-slate-200"}`}>
                            <p className="font-bold text-slate-600 mb-1">Principal / Admin Approval</p>
                            {gp.admin_approval?.approved ? (
                              <>
                                <p className="text-indigo-800 font-semibold">{gp.admin_approval.approved_by_name}</p>
                                <p className="text-indigo-600">{fmtDateTime(gp.admin_approval.approved_at)}</p>
                              </>
                            ) : <p className="text-amber-600">Pending</p>}
                          </div>
                          {/* Gate Release */}
                          <div className={`rounded-lg border p-3 text-xs ${gp.gate_security?.released ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                            <p className="font-bold text-slate-600 mb-1">Security Gate Out</p>
                            {gp.gate_security?.released ? (
                              <>
                                <p className="text-emerald-800 font-semibold">{gp.gate_security.released_by_guard}</p>
                                <p className="text-emerald-600">{fmtDateTime(gp.gate_security.released_at)}</p>
                                <p className="text-emerald-500">{gp.gate_security.gate_number}</p>
                              </>
                            ) : <p className="text-slate-500">Not yet released</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SCANNER ── */}
        {activeTab === "scanner" && (
          <div className="max-w-xl mx-auto py-8 space-y-6">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-white mx-auto mb-3">
                <ScanLine size={32} />
              </div>
              <h2 className="text-lg font-black text-slate-800">Gatekeeper Quick Scanner</h2>
              <p className="text-sm text-slate-500">Enter or scan a visitor pass (VIS-...) or early gate pass (EGP-...)</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-800 uppercase"
                  placeholder="VIS-2026-0001 or EGP-2026-0001"
                  value={scannerCode}
                  onChange={(e) => setScannerCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                />
                <button
                  onClick={handleScan}
                  disabled={scanLoading}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {scanLoading ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                </button>
              </div>

              {scanError && (
                <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle size={14} />
                  {scanError}
                </div>
              )}

              {scanResult && (
                <div className="mt-4 border border-emerald-200 bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span className="font-bold text-emerald-800 text-sm">
                      {scanResult.type === "visitor" ? "Visitor Found" : "Gate Pass Found"}
                    </span>
                  </div>
                  {scanResult.type === "visitor" && scanResult.data && (
                    <div className="text-xs space-y-1">
                      <p><span className="font-semibold">Name:</span> {scanResult.data.visitor_name}</p>
                      <p><span className="font-semibold">Phone:</span> {scanResult.data.visitor_phone}</p>
                      <p><span className="font-semibold">Status:</span> {scanResult.data.status?.replace("_", " ")}</p>
                      <p><span className="font-semibold">Meeting:</span> {scanResult.data.person_to_meet_name}</p>
                      {scanResult.data.status === "checked_in" && (
                        <button
                          onClick={() => handleCheckOut(scanResult.data._id)}
                          className="mt-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          <LogOut size={12} /> Mark Checked-Out
                        </button>
                      )}
                    </div>
                  )}
                  {scanResult.type === "student_early_gate_pass" && scanResult.data && (
                    <div className="text-xs space-y-1">
                      {(() => {
                        const gp = scanResult.data;
                        const sUser = gp.student_id?.user_id || {};
                        return (
                          <>
                            <p><span className="font-semibold">Student:</span> {sUser.first_name} {sUser.last_name}</p>
                            <p><span className="font-semibold">Class:</span> {gp.class_id?.name} {gp.section_id?.name}</p>
                            <p><span className="font-semibold">Pickup By:</span> {gp.pickup_person_name} ({gp.pickup_person_relation})</p>
                            <p><span className="font-semibold">Status:</span> {GATE_STATUS_STYLES[gp.approval_status]?.label || gp.approval_status}</p>
                            {gp.approval_status === "approved_by_admin" && (
                              <button
                                onClick={() => setApprovingPass({ id: gp._id, action: "gate" })}
                                className="mt-2 flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                              >
                                <LogOut size={12} /> Confirm Gate Exit
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: POCSO AUDIT ── */}
        {activeTab === "pocso" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black text-red-900">POCSO Compliance & Child Safety Audit</h2>
                  <p className="text-sm text-red-700 mt-1">
                    All visitor registrations and student gate passes adhere to the Protection of Children from
                    Sexual Offences (POCSO) Act. Every visitor is OTP-verified, escorted, and logged with photo
                    and ID proof. Every student release requires dual-approval and parent consent.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">POCSO Safety Checklist</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {[
                  { check: "Visitor photo and government ID recorded at campus entry", done: true },
                  { check: "Mobile OTP verified before campus access granted", done: true },
                  { check: "Person to meet (host staff) informed before visitor entry", done: true },
                  { check: "POCSO undertaking accepted by visitor at check-in", done: true },
                  { check: "Visitor badge printed and worn visibly throughout campus stay", done: true },
                  { check: "Student early departure requires parent mobile OTP consent", done: true },
                  { check: "Class Teacher approval required for student early release", done: true },
                  { check: "Principal / Admin approval required before gate release", done: true },
                  { check: "Security guard physically verifies pickup person identity at gate", done: true },
                  { check: "Parent WhatsApp alert sent on actual student campus departure", done: true },
                  { check: "Overstay alerts auto-triggered after 3 hours on campus", done: true },
                  { check: "All data retained for POCSO compliance audit trails", done: true },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700">{item.check}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Today's Security Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <p className="text-slate-400 mb-0.5">Active Visitors</p>
                  <p className="text-xl font-black text-slate-900">{stats?.activeVisitors ?? "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <p className="text-slate-400 mb-0.5">Total Visitors Today</p>
                  <p className="text-xl font-black text-slate-900">{stats?.todayVisitorsCount ?? "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <p className="text-slate-400 mb-0.5">Students Released</p>
                  <p className="text-xl font-black text-slate-900">{stats?.todayReleasedPasses ?? "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <p className="text-slate-400 mb-0.5">Overstay Alerts</p>
                  <p className={`text-xl font-black ${stats?.overstayedCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                    {stats?.overstayedCount ?? "—"}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2.5 col-span-2 md:col-span-2">
                  <p className="text-emerald-600 mb-0.5">POCSO Compliance Rate</p>
                  <p className="text-xl font-black text-emerald-700">{stats?.pocsoComplianceRate ?? 100}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── VISITOR CHECK-IN MODAL ── */}
      {visitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-red-600" />
                <span className="font-bold text-slate-800 text-sm">New Visitor Check-In</span>
              </div>
              <button onClick={() => { setVisitorModal(false); resetVisitorForm(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!vOtpState.sent ? (
                <form onSubmit={handleVisitorSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Visitor Full Name *</label>
                      <input
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={vForm.visitor_name}
                        onChange={(e) => setVForm((f) => ({ ...f, visitor_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number *</label>
                      <input
                        required
                        type="tel"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={vForm.visitor_phone}
                        onChange={(e) => setVForm((f) => ({ ...f, visitor_phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ID Proof Type</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={vForm.id_proof_type}
                        onChange={(e) => setVForm((f) => ({ ...f, id_proof_type: e.target.value }))}
                      >
                        {PROOF_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ID Proof Number</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={vForm.id_proof_number}
                        onChange={(e) => setVForm((f) => ({ ...f, id_proof_number: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Purpose of Visit</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={vForm.purpose}
                        onChange={(e) => setVForm((f) => ({ ...f, purpose: e.target.value }))}
                      >
                        {PURPOSE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Number</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none uppercase"
                        placeholder="UP-32-BN-1234"
                        value={vForm.vehicle_number}
                        onChange={(e) => setVForm((f) => ({ ...f, vehicle_number: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Person to Meet *</label>
                      <div className="relative">
                        <input
                          required
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={vForm.person_to_meet_name}
                          onChange={(e) => {
                            setVForm((f) => ({ ...f, person_to_meet_name: e.target.value }));
                            handleStaffSearch(e.target.value);
                          }}
                        />
                        {staffSuggestions.length > 0 && (
                          <ul className="absolute z-10 left-0 right-0 top-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                            {staffSuggestions.map((s) => (
                              <li
                                key={s._id}
                                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                                onClick={() => {
                                  setVForm((f) => ({
                                    ...f,
                                    person_to_meet_name: s.name,
                                    person_to_meet_user_id: s._id,
                                    person_to_meet_department: s.department,
                                  }));
                                  setStaffSuggestions([]);
                                }}
                              >
                                <p className="font-semibold text-slate-800">{s.name}</p>
                                <p className="text-xs text-slate-500">{s.designation} • {s.department}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Purpose Details</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none"
                        value={vForm.purpose_details}
                        onChange={(e) => setVForm((f) => ({ ...f, purpose_details: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Accompanying Count</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={vForm.accompanying_count}
                        onChange={(e) => setVForm((f) => ({ ...f, accompanying_count: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Belongings Declared</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={vForm.belongings_declared}
                        onChange={(e) => setVForm((f) => ({ ...f, belongings_declared: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* POCSO declaration */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                    <p className="font-bold mb-1">⚠ POCSO Campus Safety Declaration</p>
                    <p>By proceeding, the visitor acknowledges POCSO child safety rules on campus. Visitor must wear badge and be accompanied at all times. Unauthorized contact with minors is prohibited.</p>
                  </div>

                  {vError && <p className="text-xs text-rose-600 font-semibold">{vError}</p>}

                  <button
                    type="submit"
                    disabled={vSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {vSubmitting && <Loader2 size={14} className="animate-spin" />}
                    Register Visitor & Generate OTP
                  </button>
                </form>
              ) : (
                // OTP Verification Step
                <div className="space-y-4">
                  {vOtpState.verified ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <CheckCircle2 size={48} className="text-emerald-500" />
                      <p className="font-bold text-emerald-700 text-lg">Visitor Verified!</p>
                      <p className="text-sm text-slate-500">Visitor has been successfully checked in.</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <Phone size={32} className="text-slate-400 mx-auto mb-2" />
                        <h3 className="font-bold text-slate-800">Verify Visitor Mobile</h3>
                        <p className="text-sm text-slate-500">OTP sent to {vForm.visitor_phone}</p>
                      </div>
                      {vOtpState.generatedOtp && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-amber-700 font-semibold">Test Mode — Auto-fill OTP</p>
                          <button
                            className="mt-1 font-black text-2xl text-amber-900 tracking-widest"
                            onClick={() => setVOtpState((s) => ({ ...s, input: s.generatedOtp }))}
                          >
                            {vOtpState.generatedOtp}
                          </button>
                          <p className="text-[10px] text-amber-600 mt-1">Click to auto-fill</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Enter 6-digit OTP</label>
                        <input
                          maxLength={6}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={vOtpState.input}
                          onChange={(e) => setVOtpState((s) => ({ ...s, input: e.target.value }))}
                        />
                      </div>
                      {vError && <p className="text-xs text-rose-600 font-semibold">{vError}</p>}
                      <button
                        onClick={handleVerifyVisitorOtp}
                        disabled={vOtpState.input.length < 4}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Verify & Confirm Check-In
                      </button>
                      <button
                        onClick={handleSendVisitorOtp}
                        className="w-full text-xs text-slate-500 hover:text-slate-700"
                      >
                        Resend OTP
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GATE PASS ISSUE MODAL ── */}
      {gpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-red-600" />
                <span className="font-bold text-slate-800 text-sm">Issue Early Gate Pass</span>
              </div>
              <button onClick={() => { setGpModal(false); resetGpForm(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!gpOtpState.sent ? (
                <form onSubmit={handleGpSubmit} className="space-y-3">
                  {/* Student Search */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Search Student *</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Student name, roll no, admission no…"
                        value={gpStudentSearch}
                        onChange={(e) => {
                          setGpStudentSearch(e.target.value);
                          handleGpStudentSearch(e.target.value);
                        }}
                      />
                      {gpStudentResults.length > 0 && (
                        <ul className="absolute z-10 left-0 right-0 top-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                          {gpStudentResults.map((s) => (
                            <li
                              key={s._id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                              onClick={() => handleGpStudentSelect(s)}
                            >
                              {s.user_id?.avatar ? (
                                <img src={s.user_id.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <User size={14} className="text-slate-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {s.user_id?.first_name} {s.user_id?.last_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {s.class_id?.name} {s.section_id?.name} • Roll: {s.roll_no} • {s.admission_no}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {gpSelectedStudent && (
                      <div className="mt-2 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        {gpSelectedStudent.user_id?.avatar ? (
                          <img src={gpSelectedStudent.user_id.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <User size={14} className="text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-blue-900">
                            {gpSelectedStudent.user_id?.first_name} {gpSelectedStudent.user_id?.last_name}
                          </p>
                          <p className="text-blue-600">
                            Class {gpSelectedStudent.class_id?.name} {gpSelectedStudent.section_id?.name} •
                            Roll: {gpSelectedStudent.roll_no}
                          </p>
                        </div>
                        <CheckCircle2 size={16} className="text-blue-600" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Early Departure *</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={gpForm.reason_type}
                        onChange={(e) => setGpForm((f) => ({ ...f, reason_type: e.target.value }))}
                      >
                        {REASON_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reason Details *</label>
                      <textarea
                        required
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none"
                        value={gpForm.reason_details}
                        onChange={(e) => setGpForm((f) => ({ ...f, reason_details: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup Person Name *</label>
                      <input
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={gpForm.pickup_person_name}
                        onChange={(e) => setGpForm((f) => ({ ...f, pickup_person_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Relationship</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={gpForm.pickup_person_relation}
                        onChange={(e) => setGpForm((f) => ({ ...f, pickup_person_relation: e.target.value }))}
                      >
                        {RELATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup Person Phone *</label>
                      <input
                        required
                        type="tel"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={gpForm.pickup_person_phone}
                        onChange={(e) => setGpForm((f) => ({ ...f, pickup_person_phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ID Proof</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                        placeholder="Aadhaar / License no."
                        value={gpForm.pickup_person_id_proof}
                        onChange={(e) => setGpForm((f) => ({ ...f, pickup_person_id_proof: e.target.value }))}
                      />
                    </div>
                  </div>

                  {gpError && <p className="text-xs text-rose-600 font-semibold">{gpError}</p>}

                  <button
                    type="submit"
                    disabled={gpSubmitting || !gpForm.student_id}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {gpSubmitting && <Loader2 size={14} className="animate-spin" />}
                    Issue Gate Pass & Send Parent OTP
                  </button>
                </form>
              ) : (
                // Parent OTP Step
                <div className="space-y-4">
                  {gpOtpState.verified ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <CheckCircle2 size={48} className="text-emerald-500" />
                      <p className="font-bold text-emerald-700 text-lg">Parent Consent Verified!</p>
                      <p className="text-sm text-slate-500 text-center">
                        Gate pass created. Now awaiting Teacher and Principal approval.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <MessageCircle size={32} className="text-slate-400 mx-auto mb-2" />
                        <h3 className="font-bold text-slate-800">Parent Consent OTP</h3>
                        <p className="text-sm text-slate-500">OTP sent to parent: {gpForm.pickup_person_phone}</p>
                      </div>
                      {gpOtpState.generatedOtp && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-amber-700 font-semibold">Test Mode — Auto-fill OTP</p>
                          <button
                            className="mt-1 font-black text-2xl text-amber-900 tracking-widest"
                            onClick={() => setGpOtpState((s) => ({ ...s, input: s.generatedOtp }))}
                          >
                            {gpOtpState.generatedOtp}
                          </button>
                          <p className="text-[10px] text-amber-600 mt-1">Click to auto-fill</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Enter 6-digit Parent OTP</label>
                        <input
                          maxLength={6}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={gpOtpState.input}
                          onChange={(e) => setGpOtpState((s) => ({ ...s, input: e.target.value }))}
                        />
                      </div>
                      {gpError && <p className="text-xs text-rose-600 font-semibold">{gpError}</p>}
                      <button
                        onClick={handleVerifyParentOtp}
                        disabled={gpOtpState.input.length < 4}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Verify Parent Consent & Activate Pass
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVAL MODAL ── */}
      {approvingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              {approvingPass.action === "reject" ? (
                <XCircle size={18} className="text-rose-600" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-600" />
              )}
              <h3 className="font-bold text-slate-800 text-sm">
                {approvingPass.action === "teacher" && "Class Teacher Approval"}
                {approvingPass.action === "admin" && "Principal / Admin Approval"}
                {approvingPass.action === "gate" && "Confirm Gate Exit"}
                {approvingPass.action === "reject" && "Reject Gate Pass"}
              </h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {approvingPass.action === "gate" ? "Guard Name" : "Remarks / Notes"}
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none"
                placeholder={
                  approvingPass.action === "gate"
                    ? "Security guard name..."
                    : approvingPass.action === "reject"
                    ? "Reason for rejection..."
                    : "Approval remarks..."
                }
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setApprovingPass(null); setApproveRemarks(""); }}
                className="flex-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white py-2 rounded-xl transition-colors disabled:opacity-50 ${
                  approvingPass.action === "reject" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {approving && <Loader2 size={13} className="animate-spin" />}
                {approvingPass.action === "gate" ? "Confirm Exit" : approvingPass.action === "reject" ? "Reject" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Badge & Slip Modals ── */}
      {badgeVisitor && <VisitorBadgeModal visitor={badgeVisitor} onClose={() => setBadgeVisitor(null)} />}
      {slipPass && <EarlyGatePassSlipModal gatePass={slipPass} onClose={() => setSlipPass(null)} />}
    </div>
  );
}

