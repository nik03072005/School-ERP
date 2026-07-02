import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminService } from "../../api/adminService";
import StatusBadge from "../../components/admin/StatusBadge";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{String(display)}</strong>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <article className="detail-block">
      <h3>{title}</h3>
      <div>{children}</div>
    </article>
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
    return <div className="panel loading-panel"><div className="loader" /></div>;
  }

  if (!student || error) {
    return (
      <div className="panel">
        <p className="alert error">{error || "Admission details not found."}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate("/admin/users")}>Back</button>
      </div>
    );
  }

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>
            {user.first_name} {user.last_name}
          </h2>
          <p>{user.email}</p>
        </div>
        <StatusBadge status={student.admission_status} />
      </div>

      <div className="detail-grid">
        <Block title="Student Information">
          <DetailRow label="Admission Number" value={student.admission_no} />
          <DetailRow label="Full Name" value={`${user.first_name || ""} ${user.last_name || ""}`.trim()} />
          <DetailRow label="Mobile" value={user.mobile} />
          <DetailRow label="Gender" value={student.gender} />
          <DetailRow label="Date of Birth" value={student.date_of_birth} />
          <DetailRow label="Class Applying" value={student.class_applying} />
          <DetailRow label="Blood Group" value={student.blood_group} />
          <DetailRow label="Aadhar Number" value={student.aadhar_number} />
          <DetailRow label="Address" value={student.address} />
          <DetailRow label="City" value={student.city} />
          <DetailRow label="State" value={student.state} />
          <DetailRow label="Zip Code" value={student.zip_code} />
          <DetailRow label="Previous School" value={student.previous_school} />
          <DetailRow label="Transport Required" value={student.transport_required} />
          <DetailRow label="Pickup / Drop Address" value={student.pickup_drop_address} />
        </Block>

        <Block title="Primary Guardian">
          <DetailRow label="Name" value={student.primary_guardian_name} />
          <DetailRow label="Relationship" value={student.primary_guardian_relationship} />
          <DetailRow label="Phone" value={student.primary_guardian_phone} />
          <DetailRow label="Email" value={student.primary_guardian_email} />
          <DetailRow label="Address" value={student.primary_guardian_address} />
        </Block>

        <Block title="Secondary Guardian">
          <DetailRow label="Name" value={student.secondary_guardian_name} />
          <DetailRow label="Relationship" value={student.secondary_guardian_relationship} />
          <DetailRow label="Phone" value={student.secondary_guardian_phone} />
          <DetailRow label="Email" value={student.secondary_guardian_email} />
        </Block>

        <Block title="Medical Information">
          <DetailRow label="Has Allergies" value={student.has_allergies} />
          <DetailRow label="Allergies List" value={student.allergies_list} />
          <DetailRow label="Has Medical Conditions" value={student.has_medical_conditions} />
          <DetailRow label="Medical Conditions" value={student.medical_conditions} />
          <DetailRow label="Physician" value={student.physician_name} />
          <DetailRow label="Physician Phone" value={student.physician_phone} />
          <DetailRow label="Insurance" value={student.health_insurance_provider} />
          <DetailRow label="Policy Number" value={student.policy_number} />
        </Block>

        <Block title="Documents">
          <DetailRow label="Birth Certificate" value={student.docs_birth_certificate} />
          <DetailRow label="Vaccination Card" value={student.docs_vaccination_card} />
          <DetailRow label="Aadhar Card" value={student.docs_aadhar_card} />
          <DetailRow label="Address Proof" value={student.docs_address_proof} />
          <DetailRow label="Photograph" value={student.docs_photograph} />
          <DetailRow label="Other" value={student.docs_other} />
        </Block>
      </div>

      <div className="panel actions-panel">
        <Link className="btn btn-ghost" to="/admin/users">
          Back to Management
        </Link>
        <Link className="btn btn-secondary" to={`/admin/admissions/edit/${user._id}`}>
          Edit Form
        </Link>
        {student.admission_status === "pending" && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={actionLoading}
              onClick={() => setDialog("approve")}
            >
              Approve Admission
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={actionLoading}
              onClick={() => setDialog("reject")}
            >
              Reject Admission
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog === "approve" ? "Approve admission" : "Reject admission"}
        message={
          dialog === "approve"
            ? "This will approve the student's admission form."
            : "This will reject the form so the student can resubmit."
        }
        confirmText={dialog === "approve" ? "Approve" : "Reject"}
        variant={dialog === "approve" ? "default" : "danger"}
        onCancel={() => setDialog(null)}
        onConfirm={() => applyDecision(dialog)}
      />
    </section>
  );
}

export default AdmissionDetail;
