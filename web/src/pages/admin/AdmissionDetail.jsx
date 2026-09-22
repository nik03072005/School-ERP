import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileEdit,
  FileText,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import StatusBadge from "../../components/admin/StatusBadge";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

function DetailField({ label, value, isLink = false }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      {isLink && typeof value === "string" && value.startsWith("http") ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex items-center gap-1 text-xs font-bold text-cyan-700 hover:underline"
        >
          <span>View Document</span>
          <ExternalLink size={12} />
        </a>
      ) : (
        <p className="mt-0.5 text-xs font-bold text-slate-800">{String(display)}</p>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
        {Icon && <Icon size={16} className="text-cyan-600" />}
        <span>{title}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function AdmissionDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError("");
      const data = await adminService.getStudentAdmission(studentId);
      setStudent(data.student);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admission details.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const user = useMemo(() => student?.user_id || {}, [student]);

  const applyDecision = async (type) => {
    if (!studentId) return;

    setActionLoading(true);
    try {
      if (type === "approve") {
        await adminService.approveAdmission(studentId);
        setStudent((prev) => ({ ...prev, admission_status: "approved" }));
      } else {
        await adminService.rejectAdmission(studentId);
        setStudent((prev) => ({ ...prev, admission_status: "rejected" }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      setDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-xs font-bold text-slate-500">Loading applicant dossier...</p>
        </div>
      </div>
    );
  }

  if (!student || error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xs">
        <ShieldAlert size={36} className="mx-auto text-rose-500 mb-2" />
        <p className="text-sm font-bold text-slate-800">{error || "Admission record not found."}</p>
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft size={14} />
          <span>Back to User Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Dossier Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-lg font-black text-white shadow-md shadow-cyan-600/20">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {user.first_name} {user.last_name}
                </h1>
                <StatusBadge status={student.admission_status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  {user.email}
                </span>
                {user.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {user.mobile}
                  </span>
                )}
                {student.admission_no && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                    ADM: {student.admission_no}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </Link>

            <Link
              to={`/admin/admissions/edit/${user._id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <FileEdit size={13} />
              <span>Edit Application</span>
            </Link>

            {student.admission_status === "approved" && (
              <Link
                to={`/admin/tc-generator?studentId=${student._id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
              >
                <Award size={14} />
                <span>Generate TC</span>
              </Link>
            )}

            {student.admission_status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setDialog("approve")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve Admission</span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setDialog("reject")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  <XCircle size={14} />
                  <span>Reject Admission</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Cards ── */}
      <div className="space-y-4">
        <SectionCard title="Student Profile & Demographics" icon={User}>
          <DetailField label="Admission Number" value={student.admission_no} />
          <DetailField label="Legal Full Name" value={`${user.first_name || ""} ${user.last_name || ""}`.trim()} />
          <DetailField label="Gender" value={student.gender} />
          <DetailField label="Date of Birth" value={student.date_of_birth} />
          <DetailField label="Class Applying" value={student.class_applying} />
          <DetailField label="Blood Group" value={student.blood_group} />
          <DetailField label="Aadhaar UID" value={student.aadhar_number} />
          <DetailField label="Residential Address" value={student.address} />
          <DetailField label="City" value={student.city} />
          <DetailField label="State / Province" value={student.state} />
          <DetailField label="Postal / ZIP Code" value={student.zip_code} />
          <DetailField label="Previous Institution" value={student.previous_school} />
          <DetailField label="School Transport Required" value={student.transport_required} />
          <DetailField label="Pickup / Drop Location" value={student.pickup_drop_address} />
        </SectionCard>

        <SectionCard title="Primary Guardian Details" icon={Users}>
          <DetailField label="Guardian Name" value={student.primary_guardian_name} />
          <DetailField label="Relationship" value={student.primary_guardian_relationship} />
          <DetailField label="Primary Phone" value={student.primary_guardian_phone} />
          <DetailField label="Email Address" value={student.primary_guardian_email} />
          <DetailField label="Permanent Address" value={student.primary_guardian_address} />
        </SectionCard>

        <SectionCard title="Secondary Guardian Details" icon={Users}>
          <DetailField label="Guardian Name" value={student.secondary_guardian_name} />
          <DetailField label="Relationship" value={student.secondary_guardian_relationship} />
          <DetailField label="Phone Number" value={student.secondary_guardian_phone} />
          <DetailField label="Email Address" value={student.secondary_guardian_email} />
        </SectionCard>

        <SectionCard title="Medical Profile & Emergency Contacts" icon={HeartPulse}>
          <DetailField label="Known Allergies" value={student.has_allergies} />
          <DetailField label="Allergy Notes" value={student.allergies_list} />
          <DetailField label="Chronic Medical Conditions" value={student.has_medical_conditions} />
          <DetailField label="Medical Details" value={student.medical_conditions} />
          <DetailField label="Family Physician" value={student.physician_name} />
          <DetailField label="Physician Contact" value={student.physician_phone} />
          <DetailField label="Health Insurance Provider" value={student.health_insurance_provider} />
          <DetailField label="Policy / Member ID" value={student.policy_number} />
        </SectionCard>

        <SectionCard title="Submitted Verification Documents" icon={FileCheck}>
          <DetailField label="Birth Certificate" value={student.docs_birth_certificate} isLink />
          <DetailField label="Vaccination Records" value={student.docs_vaccination_card} isLink />
          <DetailField label="Aadhaar Card" value={student.docs_aadhar_card} isLink />
          <DetailField label="Address Proof" value={student.docs_address_proof} isLink />
          <DetailField label="Passport Photograph" value={student.docs_photograph} isLink />
          <DetailField label="Other Supporting Documents" value={student.docs_other} isLink />
        </SectionCard>
      </div>

      {/* Decision Dialog */}
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog === "approve" ? "Approve Student Admission" : "Reject Admission Application"}
        message={
          dialog === "approve"
            ? `Are you sure you want to approve the admission application for ${user.first_name} ${user.last_name}? This registers them as an approved student.`
            : `Are you sure you want to reject this application? The applicant will be notified to review and resubmit their application details.`
        }
        confirmText={dialog === "approve" ? "Confirm Approval" : "Confirm Rejection"}
        variant={dialog === "approve" ? "default" : "danger"}
        onCancel={() => setDialog(null)}
        onConfirm={() => applyDecision(dialog)}
      />
    </div>
  );
}

export default AdmissionDetail;
