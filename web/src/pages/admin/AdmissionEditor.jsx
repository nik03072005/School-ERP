import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminService } from "../../api/adminService";
import { uploadAvatarToR2 } from "../../api/r2Upload";
import { setupService } from "../../api/setupService";

const RELATIONSHIP_OPTIONS = ["mother", "father", "other"];
const GENDER_OPTIONS = ["male", "female", "other"];

const REQUIRED_FIELDS = new Set([
  "admission_no", "gender", "date_of_birth", "class_applying",
  "class_id", "section_id", "address", "city",
  "primary_guardian_name", "primary_guardian_relationship", "primary_guardian_phone",
]);

const EMPTY_FORM = {
  admission_no: "",
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

function Label({ text, fieldKey }) {
  return (
    <span className="mb-1 block text-sm font-medium text-slate-700">
      {text}
      {REQUIRED_FIELDS.has(fieldKey) && <span className="ml-0.5 text-rose-500">*</span>}
    </span>
  );
}

function inputCls(errors, key) {
  return `w-full rounded-md border px-3 py-2 text-sm ${errors[key] ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500" : "border-slate-300"}`;
}

function selectCls(errors, key) {
  return `w-full rounded-md border bg-white px-3 py-2 text-sm ${errors[key] ? "border-rose-500 bg-rose-50" : "border-slate-300"}`;
}

function AdmissionEditor() {
  const { userId } = useParams();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [form, setFormState] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploadStatus, setAvatarUploadStatus] = useState("idle");
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const setField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  useEffect(() => {
    const load = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const [admissionRes, classRes, sectionRes] = await Promise.all([
          adminService.getStudentAdmissionByUser(userId),
          setupService.listClasses({ is_active: true }),
          setupService.listSections({ is_active: true }),
        ]);
        const { student } = admissionRes;
        setStudentId(student._id);
        setStudentName(`${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim());
        setAvatarUrl(student?.user_id?.avatar || "");
        setFormState((prev) => ({ ...prev, ...student }));
        setClasses(classRes.classes || []);
        setSections(sectionRes.sections || []);
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

    // Validate required fields
    const fieldErrors = {};
    for (const key of REQUIRED_FIELDS) {
      const val = form[key];
      if (val === undefined || val === null || (typeof val === "string" && !val.trim())) {
        fieldErrors[key] = true;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setError("Please fill in all required fields marked with *.");
      return;
    }
    setErrors({});

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
  const selectedClassId = String(form.class_id || "");
  const filteredSections = sections.filter((section) => String(section.class_id?._id || section.class_id || "") === selectedClassId);

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
              <Label text="Admission Number" fieldKey="admission_no" />
              <input className={inputCls(errors, "admission_no")} value={form.admission_no || ""} onChange={(e) => setField("admission_no", e.target.value)} placeholder="e.g. ADM-2024-001" />
              {errors.admission_no && <p className="mt-1 text-xs text-rose-600">Admission number is required.</p>}
            </label>
            <label>
              <Label text="Gender" fieldKey="gender" />
              <select className={selectCls(errors, "gender")} value={form.gender} onChange={(e) => setField("gender", e.target.value.toLowerCase().trim())}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              {errors.gender && <p className="mt-1 text-xs text-rose-600">Gender is required.</p>}
            </label>
            <label>
              <Label text="Date of Birth" fieldKey="date_of_birth" />
              <input type="date" className={inputCls(errors, "date_of_birth")} value={form.date_of_birth || ""} onChange={(e) => setField("date_of_birth", e.target.value)} />
              {errors.date_of_birth && <p className="mt-1 text-xs text-rose-600">Date of birth is required.</p>}
            </label>
            <label>
              <Label text="Class Applying" fieldKey="class_applying" />
              <select
                className={selectCls(errors, "class_applying")}
                value={form.class_applying || ""}
                onChange={(e) => setField("class_applying", e.target.value)}
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.class_applying && <p className="mt-1 text-xs text-rose-600">Class applying is required.</p>}
            </label>
            <label>
              <Label text="Assign Class" fieldKey="class_id" />
              <select
                className={selectCls(errors, "class_id")}
                value={form.class_id || ""}
                onChange={(e) => {
                  const nextClassId = e.target.value;
                  setField("class_id", nextClassId);
                  setField("class_applying", classes.find((item) => String(item._id) === String(nextClassId))?.name || "");
                  setField("section_id", "");
                }}
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.class_id && <p className="mt-1 text-xs text-rose-600">Class assignment is required.</p>}
            </label>
            <label>
              <Label text="Assign Section" fieldKey="section_id" />
              <select
                className={selectCls(errors, "section_id")}
                value={form.section_id || ""}
                onChange={(e) => setField("section_id", e.target.value)}
                disabled={!form.class_id}
              >
                <option value="">Select section</option>
                {filteredSections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
              {errors.section_id && <p className="mt-1 text-xs text-rose-600">Section assignment is required.</p>}
            </label>
            <label>
              <Label text="Blood Group" fieldKey="blood_group" />
              <input className={inputCls(errors, "blood_group")} value={form.blood_group || ""} onChange={(e) => setField("blood_group", e.target.value)} />
            </label>
            <label>
              <Label text="Aadhar Number" fieldKey="aadhar_number" />
              <input className={inputCls(errors, "aadhar_number")} value={form.aadhar_number || ""} onChange={(e) => setField("aadhar_number", e.target.value)} />
            </label>
            <label>
              <Label text="Zip Code" fieldKey="zip_code" />
              <input className={inputCls(errors, "zip_code")} value={form.zip_code || ""} onChange={(e) => setField("zip_code", e.target.value)} />
            </label>
          </div>

          <label className="mt-3 block">
            <Label text="Address" fieldKey="address" />
            <textarea className={`w-full rounded-md border px-3 py-2 text-sm ${errors.address ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500" : "border-slate-300"}`} rows={2} value={form.address || ""} onChange={(e) => setField("address", e.target.value)} />
            {errors.address && <p className="mt-1 text-xs text-rose-600">Address is required.</p>}
          </label>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <Label text="City" fieldKey="city" />
              <input className={inputCls(errors, "city")} value={form.city || ""} onChange={(e) => setField("city", e.target.value)} />
              {errors.city && <p className="mt-1 text-xs text-rose-600">City is required.</p>}
            </label>
            <label>
              <Label text="State" fieldKey="state" />
              <input className={inputCls(errors, "state")} value={form.state || ""} onChange={(e) => setField("state", e.target.value)} />
            </label>
            <label>
              <Label text="Previous School" fieldKey="previous_school" />
              <input className={inputCls(errors, "previous_school")} value={form.previous_school || ""} onChange={(e) => setField("previous_school", e.target.value)} />
            </label>
          </div>

          {genderWarning ? <p className="mt-2 text-sm text-rose-600">Use: male, female, or other.</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Guardian Details</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <Label text="Primary Guardian Name" fieldKey="primary_guardian_name" />
              <input className={inputCls(errors, "primary_guardian_name")} value={form.primary_guardian_name || ""} onChange={(e) => setField("primary_guardian_name", e.target.value)} />
              {errors.primary_guardian_name && <p className="mt-1 text-xs text-rose-600">Guardian name is required.</p>}
            </label>
            <label>
              <Label text="Relationship" fieldKey="primary_guardian_relationship" />
              <select className={selectCls(errors, "primary_guardian_relationship")}
                value={form.primary_guardian_relationship || ""}
                onChange={(e) => setField("primary_guardian_relationship", e.target.value.toLowerCase().trim())}>
                <option value="">Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              {errors.primary_guardian_relationship && <p className="mt-1 text-xs text-rose-600">Relationship is required.</p>}
            </label>
            <label>
              <Label text="Primary Guardian Phone" fieldKey="primary_guardian_phone" />
              <input className={inputCls(errors, "primary_guardian_phone")} value={form.primary_guardian_phone || ""} onChange={(e) => setField("primary_guardian_phone", e.target.value)} />
              {errors.primary_guardian_phone
                ? <p className="mt-1 text-xs text-rose-600">Phone number is required.</p>
                : <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><span>📲</span> WhatsApp notifications (attendance, notices, fees) will be sent to this number.</p>}
            </label>
            <label>
              <Label text="Primary Guardian Email" fieldKey="primary_guardian_email" />
              <input className={inputCls(errors, "primary_guardian_email")} value={form.primary_guardian_email || ""} onChange={(e) => setField("primary_guardian_email", e.target.value)} />
            </label>
          </div>

          <label className="mt-3 block">
            <Label text="Primary Guardian Address" fieldKey="primary_guardian_address" />
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.primary_guardian_address || ""} onChange={(e) => setField("primary_guardian_address", e.target.value)} />
          </label>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <Label text="Secondary Guardian Name" fieldKey="secondary_guardian_name" />
              <input className={inputCls(errors, "secondary_guardian_name")} value={form.secondary_guardian_name || ""} onChange={(e) => setField("secondary_guardian_name", e.target.value)} />
            </label>
            <label>
              <Label text="Secondary Relationship" fieldKey="secondary_guardian_relationship" />
              <select className={selectCls(errors, "secondary_guardian_relationship")} value={form.secondary_guardian_relationship || ""} onChange={(e) => setField("secondary_guardian_relationship", e.target.value.toLowerCase().trim())}>
                <option value="">Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <Label text="Secondary Guardian Phone" fieldKey="secondary_guardian_phone" />
              <input className={inputCls(errors, "secondary_guardian_phone")} value={form.secondary_guardian_phone || ""} onChange={(e) => setField("secondary_guardian_phone", e.target.value)} />
            </label>
            <label>
              <Label text="Secondary Guardian Email" fieldKey="secondary_guardian_email" />
              <input className={inputCls(errors, "secondary_guardian_email")} value={form.secondary_guardian_email || ""} onChange={(e) => setField("secondary_guardian_email", e.target.value)} />
            </label>
          </div>

          {relationshipWarning ? <p className="mt-2 text-sm text-rose-600">Primary relationship: mother, father, or other.</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Medical and Documents</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <Label text="Emergency Contact Name" fieldKey="emergency_contact_name" />
              <input className={inputCls(errors, "emergency_contact_name")} value={form.emergency_contact_name || ""} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
            </label>
            <label>
              <Label text="Emergency Contact Relationship" fieldKey="emergency_contact_relationship" />
              <select className={selectCls(errors, "emergency_contact_relationship")} value={form.emergency_contact_relationship || ""} onChange={(e) => setField("emergency_contact_relationship", e.target.value)}>
                <option value="">Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <Label text="Emergency Contact Phone" fieldKey="emergency_contact_phone" />
              <input className={inputCls(errors, "emergency_contact_phone")} value={form.emergency_contact_phone || ""} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
            </label>
            <label>
              <Label text="Physician Name" fieldKey="physician_name" />
              <input className={inputCls(errors, "physician_name")} value={form.physician_name || ""} onChange={(e) => setField("physician_name", e.target.value)} />
            </label>
            <label>
              <Label text="Physician Phone" fieldKey="physician_phone" />
              <input className={inputCls(errors, "physician_phone")} value={form.physician_phone || ""} onChange={(e) => setField("physician_phone", e.target.value)} />
            </label>
            <label>
              <Label text="Insurance Provider" fieldKey="health_insurance_provider" />
              <input className={inputCls(errors, "health_insurance_provider")} value={form.health_insurance_provider || ""} onChange={(e) => setField("health_insurance_provider", e.target.value)} />
            </label>
            <label>
              <Label text="Policy Number" fieldKey="policy_number" />
              <input className={inputCls(errors, "policy_number")} value={form.policy_number || ""} onChange={(e) => setField("policy_number", e.target.value)} />
            </label>
          </div>

          <label className="mt-3 block">
            <Label text="Medical Conditions" fieldKey="medical_conditions" />
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.medical_conditions || ""} onChange={(e) => setField("medical_conditions", e.target.value)} />
          </label>

          <label className="mt-3 block">
            <Label text="Allergies" fieldKey="allergies_list" />
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.allergies_list || ""} onChange={(e) => setField("allergies_list", e.target.value)} />
          </label>

          <label className="mt-3 block">
            <Label text="Other Documents" fieldKey="docs_other" />
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Admission Form"}
          </button>
          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-rose-600">Fields marked with <span className="font-bold">*</span> are required.</p>
          )}
        </div>
      </form>
    </section>
  );
}

export default AdmissionEditor;
