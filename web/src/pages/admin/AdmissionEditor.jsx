import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminService } from "../../api/adminService";
import { uploadAvatarToR2 } from "../../api/r2Upload";

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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploadStatus, setAvatarUploadStatus] = useState("idle");
  const [avatarUploadError, setAvatarUploadError] = useState("");
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
        setAvatarUrl(student?.user_id?.avatar || "");
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

    if (avatarFile && avatarUploadStatus === "uploading") {
      setError("Avatar is still uploading. Please wait.");
      return;
    }

    if (avatarFile && avatarUploadStatus === "failed") {
      setError("Avatar upload failed. Please select an image again.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const nextAvatar = avatarUrl;

      await adminService.upsertStudentAdmission(studentId, {
        ...form,
        avatar: nextAvatar || undefined,
        admission_status: "approved",
      });
      if (nextAvatar) {
        setAvatarUrl(nextAvatar);
      }
      setAvatarFile(null);
      setAvatarUploadStatus("idle");
      setAvatarUploadError("");
      setMessage("Admission form saved and approved.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save admission form.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">Loading admission form...</p>
      </div>
    );
  }

  if (error && !studentId) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm font-medium text-rose-700">{error}</p>
      </div>
    );
  }

  const relationshipWarning = form.primary_guardian_relationship && !RELATIONSHIP_OPTIONS.includes(form.primary_guardian_relationship);
  const genderWarning = form.gender && !GENDER_OPTIONS.includes(form.gender);

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarUploadError("");

    if (!file) {
      setAvatarUploadStatus("idle");
      return;
    }

    setAvatarUploadStatus("uploading");
    try {
      const uploadedUrl = await uploadAvatarToR2(file, studentName || "student");
      setAvatarUrl(uploadedUrl);
      setAvatarUploadStatus("uploaded");
    } catch (uploadErr) {
      setAvatarUploadStatus("failed");
      setAvatarUploadError(uploadErr?.message || "Avatar upload failed");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Edit Admission Form</h2>
          <p className="mt-1 text-sm text-slate-600">{studentName || "Student"}</p>
        </div>
        <Link
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          to="/admin/users"
        >
          Back
        </Link>
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <form className="space-y-6" onSubmit={save}>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Student Information</h3>

          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Avatar</p>
            <div className="flex flex-wrap items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Student avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
                  {studentName ? studentName[0]?.toUpperCase() : "S"}
                </div>
              )}
              <div className="min-w-55 flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Upload / Replace Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {avatarFile ? `Selected: ${avatarFile.name}` : "Current avatar is shown above."}
                </p>
                {avatarUploadStatus === "uploading" ? <p className="mt-1 text-xs text-blue-600">Uploading avatar...</p> : null}
                {avatarUploadStatus === "uploaded" ? <p className="mt-1 text-xs text-emerald-600">Avatar uploaded successfully.</p> : null}
                {avatarUploadStatus === "failed" ? <p className="mt-1 text-xs text-rose-600">{avatarUploadError || "Avatar upload failed."}</p> : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Gender</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.gender} onChange={(e) => setField("gender", e.target.value.toLowerCase().trim())} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Date of Birth</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.date_of_birth || ""} onChange={(e) => setField("date_of_birth", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Class Applying</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.class_applying || ""} onChange={(e) => setField("class_applying", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Blood Group</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.blood_group || ""} onChange={(e) => setField("blood_group", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Aadhar Number</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.aadhar_number || ""} onChange={(e) => setField("aadhar_number", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Zip Code</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.zip_code || ""} onChange={(e) => setField("zip_code", e.target.value)} />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Address</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.address || ""} onChange={(e) => setField("address", e.target.value)} />
          </label>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">City</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.city || ""} onChange={(e) => setField("city", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">State</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.state || ""} onChange={(e) => setField("state", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Previous School</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.previous_school || ""} onChange={(e) => setField("previous_school", e.target.value)} />
            </label>
          </div>

          {genderWarning ? <p className="mt-2 text-sm text-rose-600">Use: male, female, or other.</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Guardian Details</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Primary Guardian Name</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.primary_guardian_name || ""} onChange={(e) => setField("primary_guardian_name", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Relationship</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.primary_guardian_relationship || ""}
                onChange={(e) => setField("primary_guardian_relationship", e.target.value.toLowerCase().trim())}
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Primary Guardian Phone</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.primary_guardian_phone || ""} onChange={(e) => setField("primary_guardian_phone", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Primary Guardian Email</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.primary_guardian_email || ""} onChange={(e) => setField("primary_guardian_email", e.target.value)} />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Primary Guardian Address</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.primary_guardian_address || ""} onChange={(e) => setField("primary_guardian_address", e.target.value)} />
          </label>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Secondary Guardian Name</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.secondary_guardian_name || ""} onChange={(e) => setField("secondary_guardian_name", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Secondary Relationship</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.secondary_guardian_relationship || ""} onChange={(e) => setField("secondary_guardian_relationship", e.target.value.toLowerCase().trim())} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Secondary Guardian Phone</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.secondary_guardian_phone || ""} onChange={(e) => setField("secondary_guardian_phone", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Secondary Guardian Email</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.secondary_guardian_email || ""} onChange={(e) => setField("secondary_guardian_email", e.target.value)} />
            </label>
          </div>

          {relationshipWarning ? <p className="mt-2 text-sm text-rose-600">Primary relationship: mother, father, or other.</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Medical and Documents</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Emergency Contact Name</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.emergency_contact_name || ""} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Emergency Contact Relationship</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.emergency_contact_relationship || ""} onChange={(e) => setField("emergency_contact_relationship", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Emergency Contact Phone</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.emergency_contact_phone || ""} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Physician Name</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.physician_name || ""} onChange={(e) => setField("physician_name", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Physician Phone</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.physician_phone || ""} onChange={(e) => setField("physician_phone", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Insurance Provider</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.health_insurance_provider || ""} onChange={(e) => setField("health_insurance_provider", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Policy Number</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.policy_number || ""} onChange={(e) => setField("policy_number", e.target.value)} />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Medical Conditions</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.medical_conditions || ""} onChange={(e) => setField("medical_conditions", e.target.value)} />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Allergies</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.allergies_list || ""} onChange={(e) => setField("allergies_list", e.target.value)} />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Other Documents</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.docs_other || ""} onChange={(e) => setField("docs_other", e.target.value)} />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
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
              <label key={key} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => setField(key, e.target.checked)}
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>
        </article>

        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Admission Form"}
        </button>
      </form>
    </section>
  );
}

export default AdmissionEditor;
