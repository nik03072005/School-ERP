import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminService } from "../../api/adminService";

const RELATIONSHIP_OPTIONS = ["mother", "father", "other"];
const GENDER_OPTIONS = ["male", "female", "other"];

const EMPTY_FORM = {
  gender: "",
  date_of_birth: "",
  class_applying: "",
  blood_group: "",
  aadhar_number: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  previous_school: "",
  transport_required: false,
  pickup_drop_address: "",
  primary_guardian_name: "",
  primary_guardian_relationship: "",
  primary_guardian_phone: "",
  primary_guardian_email: "",
  primary_guardian_address: "",
  secondary_guardian_name: "",
  secondary_guardian_relationship: "",
  secondary_guardian_phone: "",
  secondary_guardian_email: "",
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_phone: "",
  has_allergies: false,
  allergies_list: "",
  has_medical_conditions: false,
  medical_conditions: "",
  physician_name: "",
  physician_phone: "",
  health_insurance_provider: "",
  policy_number: "",
  docs_birth_certificate: false,
  docs_vaccination_card: false,
  docs_aadhar_card: false,
  docs_address_proof: false,
  docs_photograph: false,
  docs_other: "",
};

function AdmissionEditor() {
  const { userId } = useParams();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const { student } = await adminService.getStudentAdmissionByUser(userId);
        setStudentId(student._id);
        setStudentName(`${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim());
        setForm((prev) => ({ ...prev, ...student }));
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load admission form.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const save = async (event) => {
    event.preventDefault();
    if (!studentId) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await adminService.upsertStudentAdmission(studentId, {
        ...form,
        admission_status: "approved",
      });
      setMessage("Admission form saved and approved.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save admission form.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="panel loading-panel"><div className="loader" /></div>;
  }

  if (error && !studentId) {
    return <div className="panel"><p className="alert error">{error}</p></div>;
  }

  const relationshipWarning = form.primary_guardian_relationship && !RELATIONSHIP_OPTIONS.includes(form.primary_guardian_relationship);
  const genderWarning = form.gender && !GENDER_OPTIONS.includes(form.gender);

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>Edit Admission Form</h2>
          <p>{studentName || "Student"}</p>
        </div>
        <Link className="btn btn-ghost" to="/admin/users">
          Back
        </Link>
      </div>

      {message ? <p className="alert success">{message}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <form className="editor-form" onSubmit={save}>
        <article className="form-section">
          <h3>Student Information</h3>
          <div className="form-grid">
            <label>
              Gender
              <input value={form.gender} onChange={(e) => setField("gender", e.target.value.toLowerCase().trim())} />
            </label>
            <label>
              Date of Birth
              <input value={form.date_of_birth || ""} onChange={(e) => setField("date_of_birth", e.target.value)} />
            </label>
            <label>
              Class Applying
              <input value={form.class_applying || ""} onChange={(e) => setField("class_applying", e.target.value)} />
            </label>
            <label>
              Blood Group
              <input value={form.blood_group || ""} onChange={(e) => setField("blood_group", e.target.value)} />
            </label>
            <label>
              Aadhar Number
              <input value={form.aadhar_number || ""} onChange={(e) => setField("aadhar_number", e.target.value)} />
            </label>
            <label>
              Zip Code
              <input value={form.zip_code || ""} onChange={(e) => setField("zip_code", e.target.value)} />
            </label>
          </div>
          <label>
            Address
            <textarea rows={2} value={form.address || ""} onChange={(e) => setField("address", e.target.value)} />
          </label>
          <div className="form-grid">
            <label>
              City
              <input value={form.city || ""} onChange={(e) => setField("city", e.target.value)} />
            </label>
            <label>
              State
              <input value={form.state || ""} onChange={(e) => setField("state", e.target.value)} />
            </label>
            <label>
              Previous School
              <input value={form.previous_school || ""} onChange={(e) => setField("previous_school", e.target.value)} />
            </label>
          </div>
          {genderWarning ? <p className="hint-error">Use: male, female, or other.</p> : null}
        </article>

        <article className="form-section">
          <h3>Guardian Details</h3>
          <div className="form-grid">
            <label>
              Primary Guardian Name
              <input value={form.primary_guardian_name || ""} onChange={(e) => setField("primary_guardian_name", e.target.value)} />
            </label>
            <label>
              Relationship
              <input
                value={form.primary_guardian_relationship || ""}
                onChange={(e) => setField("primary_guardian_relationship", e.target.value.toLowerCase().trim())}
              />
            </label>
            <label>
              Primary Guardian Phone
              <input value={form.primary_guardian_phone || ""} onChange={(e) => setField("primary_guardian_phone", e.target.value)} />
            </label>
            <label>
              Primary Guardian Email
              <input value={form.primary_guardian_email || ""} onChange={(e) => setField("primary_guardian_email", e.target.value)} />
            </label>
          </div>
          <label>
            Primary Guardian Address
            <textarea rows={2} value={form.primary_guardian_address || ""} onChange={(e) => setField("primary_guardian_address", e.target.value)} />
          </label>
          <div className="form-grid">
            <label>
              Secondary Guardian Name
              <input value={form.secondary_guardian_name || ""} onChange={(e) => setField("secondary_guardian_name", e.target.value)} />
            </label>
            <label>
              Secondary Relationship
              <input value={form.secondary_guardian_relationship || ""} onChange={(e) => setField("secondary_guardian_relationship", e.target.value.toLowerCase().trim())} />
            </label>
            <label>
              Secondary Guardian Phone
              <input value={form.secondary_guardian_phone || ""} onChange={(e) => setField("secondary_guardian_phone", e.target.value)} />
            </label>
            <label>
              Secondary Guardian Email
              <input value={form.secondary_guardian_email || ""} onChange={(e) => setField("secondary_guardian_email", e.target.value)} />
            </label>
          </div>
          {relationshipWarning ? <p className="hint-error">Primary relationship: mother, father, or other.</p> : null}
        </article>

        <article className="form-section">
          <h3>Medical and Documents</h3>
          <div className="form-grid">
            <label>
              Emergency Contact Name
              <input value={form.emergency_contact_name || ""} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
            </label>
            <label>
              Emergency Contact Relationship
              <input value={form.emergency_contact_relationship || ""} onChange={(e) => setField("emergency_contact_relationship", e.target.value)} />
            </label>
            <label>
              Emergency Contact Phone
              <input value={form.emergency_contact_phone || ""} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
            </label>
            <label>
              Physician Name
              <input value={form.physician_name || ""} onChange={(e) => setField("physician_name", e.target.value)} />
            </label>
            <label>
              Physician Phone
              <input value={form.physician_phone || ""} onChange={(e) => setField("physician_phone", e.target.value)} />
            </label>
            <label>
              Insurance Provider
              <input value={form.health_insurance_provider || ""} onChange={(e) => setField("health_insurance_provider", e.target.value)} />
            </label>
            <label>
              Policy Number
              <input value={form.policy_number || ""} onChange={(e) => setField("policy_number", e.target.value)} />
            </label>
          </div>
          <label>
            Medical Conditions
            <textarea rows={2} value={form.medical_conditions || ""} onChange={(e) => setField("medical_conditions", e.target.value)} />
          </label>
          <label>
            Allergies
            <textarea rows={2} value={form.allergies_list || ""} onChange={(e) => setField("allergies_list", e.target.value)} />
          </label>
          <label>
            Other Documents
            <textarea rows={2} value={form.docs_other || ""} onChange={(e) => setField("docs_other", e.target.value)} />
          </label>

          <div className="toggle-grid">
            {[
              ["Transport Required", "transport_required"],
              ["Has Allergies", "has_allergies"],
              ["Has Medical Conditions", "has_medical_conditions"],
              ["Birth Certificate", "docs_birth_certificate"],
              ["Vaccination Card", "docs_vaccination_card"],
              ["Aadhar Card", "docs_aadhar_card"],
              ["Address Proof", "docs_address_proof"],
              ["Photograph", "docs_photograph"],
            ].map(([label, key]) => (
              <label key={key} className="toggle-item">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => setField(key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </article>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Admission Form"}
        </button>
      </form>
    </section>
  );
}

export default AdmissionEditor;
