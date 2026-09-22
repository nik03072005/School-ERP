import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  HeartPulse,
  Save,
  ShieldAlert,
  Upload,
  User,
  Users,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import { uploadAvatarToR2 } from "../../api/r2Upload";
import { setupService } from "../../api/setupService";

const RELATIONSHIP_OPTIONS = ["mother", "father", "other"];
const GENDER_OPTIONS = ["male", "female", "other"];

const REQUIRED_FIELDS = new Set([
  "admission_no",
  "gender",
  "date_of_birth",
  "class_applying",
  "class_id",
  "section_id",
  "address",
  "city",
  "primary_guardian_name",
  "primary_guardian_relationship",
  "primary_guardian_phone",
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

function FieldLabel({ text, fieldKey }) {
  return (
    <span className="text-xs font-bold text-slate-700">
      {text}
      {REQUIRED_FIELDS.has(fieldKey) && <span className="ml-1 text-rose-500">*</span>}
    </span>
  );
}

function fieldInputClass(errors, key) {
  return `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-800 transition focus:outline-hidden ${
    errors[key]
      ? "border-rose-400 bg-rose-50/50 ring-2 ring-rose-200"
      : "border-slate-200 hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
  }`;
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
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
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
      setError("Please fill in all required fields marked with an asterisk (*).");
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
      setMessage("Admission application updated and approved successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save admission form.");
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-xs font-bold text-slate-500">Loading student admission form...</p>
        </div>
      </div>
    );
  }

  if (error && !studentId) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xs">
        <ShieldAlert size={36} className="mx-auto text-rose-500 mb-2" />
        <p className="text-sm font-bold text-slate-800">{error}</p>
        <Link
          to="/admin/users"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft size={14} /> Back to User Directory
        </Link>
      </div>
    );
  }

  const selectedClassId = String(form.class_id || "");
  const filteredSections = sections.filter(
    (section) => String(section.class_id?._id || section.class_id || "") === selectedClassId
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <GraduationCap size={15} />
            Student Admission Record
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {studentName || "Edit Admission Application"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure student details, class-section assignment, parent guardian info, and verification documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            <span>Cancel</span>
          </Link>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? "Saving Changes..." : "Save & Approve Form"}</span>
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        {/* ── 1. Student Identity & Avatar Card ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <User size={16} className="text-cyan-600" />
            <span>1. Identity & Student Photo</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-200 shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-xl font-bold text-white shadow-sm">
                  {studentName?.[0] || "S"}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-slate-700">Upload or Replace Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="block w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
              {avatarUploadStatus === "uploading" && (
                <p className="text-[11px] text-cyan-600 font-medium">Uploading avatar to cloud...</p>
              )}
              {avatarUploadStatus === "uploaded" && (
                <p className="text-[11px] text-emerald-600 font-medium">Avatar updated successfully.</p>
              )}
              {avatarUploadStatus === "failed" && (
                <p className="text-[11px] text-rose-600 font-medium">{avatarUploadError || "Upload failed."}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Academic Placement & Demographic Information ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <GraduationCap size={16} className="text-cyan-600" />
            <span>2. Academic Placement & Demographics</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel text="Admission Number" fieldKey="admission_no" />
              <input
                value={form.admission_no || ""}
                onChange={(e) => setField("admission_no", e.target.value)}
                placeholder="e.g. ADM-2026-001"
                className={fieldInputClass(errors, "admission_no")}
              />
            </div>

            <div>
              <FieldLabel text="Gender" fieldKey="gender" />
              <select
                value={form.gender || ""}
                onChange={(e) => setField("gender", e.target.value.toLowerCase().trim())}
                className={fieldInputClass(errors, "gender")}
              >
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel text="Date of Birth" fieldKey="date_of_birth" />
              <input
                type="date"
                value={form.date_of_birth ? form.date_of_birth.slice(0, 10) : ""}
                onChange={(e) => setField("date_of_birth", e.target.value)}
                className={fieldInputClass(errors, "date_of_birth")}
              />
            </div>

            <div>
              <FieldLabel text="Assign Class" fieldKey="class_id" />
              <select
                value={form.class_id || ""}
                onChange={(e) => {
                  const nextClassId = e.target.value;
                  setField("class_id", nextClassId);
                  setField(
                    "class_applying",
                    classes.find((item) => String(item._id) === String(nextClassId))?.name || ""
                  );
                  setField("section_id", "");
                }}
                className={fieldInputClass(errors, "class_id")}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (Grade {c.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel text="Assign Section" fieldKey="section_id" />
              <select
                value={form.section_id || ""}
                onChange={(e) => setField("section_id", e.target.value)}
                disabled={!form.class_id}
                className={fieldInputClass(errors, "section_id")}
              >
                <option value="">Select Section</option>
                {filteredSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel text="Class Applying For" fieldKey="class_applying" />
              <input
                value={form.class_applying || ""}
                onChange={(e) => setField("class_applying", e.target.value)}
                placeholder="e.g. Grade 1"
                className={fieldInputClass(errors, "class_applying")}
              />
            </div>

            <div>
              <FieldLabel text="Blood Group" fieldKey="blood_group" />
              <input
                value={form.blood_group || ""}
                onChange={(e) => setField("blood_group", e.target.value)}
                placeholder="e.g. O+, A+, B+"
                className={fieldInputClass(errors, "blood_group")}
              />
            </div>

            <div>
              <FieldLabel text="Aadhaar UID Number" fieldKey="aadhar_number" />
              <input
                value={form.aadhar_number || ""}
                onChange={(e) => setField("aadhar_number", e.target.value)}
                placeholder="12 digit Aadhaar"
                className={fieldInputClass(errors, "aadhar_number")}
              />
            </div>

            <div>
              <FieldLabel text="Previous School Attended" fieldKey="previous_school" />
              <input
                value={form.previous_school || ""}
                onChange={(e) => setField("previous_school", e.target.value)}
                placeholder="Previous Institution name"
                className={fieldInputClass(errors, "previous_school")}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Residential Address & Transport ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <BookOpen size={16} className="text-cyan-600" />
            <span>3. Residential Address & Transport</span>
          </div>

          <div className="space-y-3">
            <div>
              <FieldLabel text="Permanent / Residential Address" fieldKey="address" />
              <textarea
                rows={2}
                value={form.address || ""}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Full street address..."
                className={fieldInputClass(errors, "address")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel text="City" fieldKey="city" />
                <input
                  value={form.city || ""}
                  onChange={(e) => setField("city", e.target.value)}
                  className={fieldInputClass(errors, "city")}
                />
              </div>

              <div>
                <FieldLabel text="State" fieldKey="state" />
                <input
                  value={form.state || ""}
                  onChange={(e) => setField("state", e.target.value)}
                  className={fieldInputClass(errors, "state")}
                />
              </div>

              <div>
                <FieldLabel text="ZIP / Postal Code" fieldKey="zip_code" />
                <input
                  value={form.zip_code || ""}
                  onChange={(e) => setField("zip_code", e.target.value)}
                  className={fieldInputClass(errors, "zip_code")}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.transport_required)}
                  onChange={(e) => setField("transport_required", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-xs font-bold text-slate-700">Requires School Bus / Transport Service</span>
              </label>

              {form.transport_required && (
                <div className="mt-3">
                  <FieldLabel text="Pickup / Drop Point" fieldKey="pickup_drop_address" />
                  <input
                    value={form.pickup_drop_address || ""}
                    onChange={(e) => setField("pickup_drop_address", e.target.value)}
                    placeholder="Specific bus stop or landmark..."
                    className={fieldInputClass(errors, "pickup_drop_address")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Parent / Guardian Details ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <Users size={16} className="text-cyan-600" />
            <span>4. Guardian & Family Contacts</span>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">Primary Guardian</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel text="Full Name" fieldKey="primary_guardian_name" />
                <input
                  value={form.primary_guardian_name || ""}
                  onChange={(e) => setField("primary_guardian_name", e.target.value)}
                  className={fieldInputClass(errors, "primary_guardian_name")}
                />
              </div>

              <div>
                <FieldLabel text="Relationship" fieldKey="primary_guardian_relationship" />
                <select
                  value={form.primary_guardian_relationship || ""}
                  onChange={(e) => setField("primary_guardian_relationship", e.target.value.toLowerCase().trim())}
                  className={fieldInputClass(errors, "primary_guardian_relationship")}
                >
                  <option value="">Select</option>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel text="Phone Number (WhatsApp)" fieldKey="primary_guardian_phone" />
                <input
                  value={form.primary_guardian_phone || ""}
                  onChange={(e) => setField("primary_guardian_phone", e.target.value)}
                  className={fieldInputClass(errors, "primary_guardian_phone")}
                />
              </div>

              <div>
                <FieldLabel text="Email Address" fieldKey="primary_guardian_email" />
                <input
                  type="email"
                  value={form.primary_guardian_email || ""}
                  onChange={(e) => setField("primary_guardian_email", e.target.value)}
                  className={fieldInputClass(errors, "primary_guardian_email")}
                />
              </div>
            </div>

            <p className="pt-3 border-t border-slate-100 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Secondary Guardian (Optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel text="Full Name" fieldKey="secondary_guardian_name" />
                <input
                  value={form.secondary_guardian_name || ""}
                  onChange={(e) => setField("secondary_guardian_name", e.target.value)}
                  className={fieldInputClass(errors, "secondary_guardian_name")}
                />
              </div>

              <div>
                <FieldLabel text="Relationship" fieldKey="secondary_guardian_relationship" />
                <select
                  value={form.secondary_guardian_relationship || ""}
                  onChange={(e) => setField("secondary_guardian_relationship", e.target.value.toLowerCase().trim())}
                  className={fieldInputClass(errors, "secondary_guardian_relationship")}
                >
                  <option value="">Select</option>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel text="Phone Number" fieldKey="secondary_guardian_phone" />
                <input
                  value={form.secondary_guardian_phone || ""}
                  onChange={(e) => setField("secondary_guardian_phone", e.target.value)}
                  className={fieldInputClass(errors, "secondary_guardian_phone")}
                />
              </div>

              <div>
                <FieldLabel text="Email Address" fieldKey="secondary_guardian_email" />
                <input
                  type="email"
                  value={form.secondary_guardian_email || ""}
                  onChange={(e) => setField("secondary_guardian_email", e.target.value)}
                  className={fieldInputClass(errors, "secondary_guardian_email")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. Medical Profile & Documents ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <HeartPulse size={16} className="text-cyan-600" />
            <span>5. Emergency, Health & Verification Checklist</span>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel text="Emergency Contact Name" fieldKey="emergency_contact_name" />
                <input
                  value={form.emergency_contact_name || ""}
                  onChange={(e) => setField("emergency_contact_name", e.target.value)}
                  className={fieldInputClass(errors, "emergency_contact_name")}
                />
              </div>

              <div>
                <FieldLabel text="Relationship" fieldKey="emergency_contact_relationship" />
                <input
                  value={form.emergency_contact_relationship || ""}
                  onChange={(e) => setField("emergency_contact_relationship", e.target.value)}
                  className={fieldInputClass(errors, "emergency_contact_relationship")}
                />
              </div>

              <div>
                <FieldLabel text="Emergency Contact Phone" fieldKey="emergency_contact_phone" />
                <input
                  value={form.emergency_contact_phone || ""}
                  onChange={(e) => setField("emergency_contact_phone", e.target.value)}
                  className={fieldInputClass(errors, "emergency_contact_phone")}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-3 border-t border-slate-100">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.has_allergies)}
                    onChange={(e) => setField("has_allergies", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                  />
                  <span className="text-xs font-bold text-slate-700">Student Has Known Allergies</span>
                </label>
                {form.has_allergies && (
                  <textarea
                    rows={2}
                    value={form.allergies_list || ""}
                    onChange={(e) => setField("allergies_list", e.target.value)}
                    placeholder="List specific allergies (e.g. peanuts, dairy)..."
                    className={fieldInputClass(errors, "allergies_list")}
                  />
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.has_medical_conditions)}
                    onChange={(e) => setField("has_medical_conditions", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                  />
                  <span className="text-xs font-bold text-slate-700">Has Chronic Medical Conditions</span>
                </label>
                {form.has_medical_conditions && (
                  <textarea
                    rows={2}
                    value={form.medical_conditions || ""}
                    onChange={(e) => setField("medical_conditions", e.target.value)}
                    placeholder="Describe condition and medical protocol..."
                    className={fieldInputClass(errors, "medical_conditions")}
                  />
                )}
              </div>
            </div>

            {/* Document Checklist Grid */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-3">
                Verified Verification Documents
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Birth Certificate Verified", "docs_birth_certificate"],
                  ["Immunization / Vaccine Card", "docs_vaccination_card"],
                  ["Aadhaar Card Copy", "docs_aadhar_card"],
                  ["Address Proof Verified", "docs_address_proof"],
                  ["Recent Passport Photograph", "docs_photograph"],
                ].map(([label, key]) => (
                  <label
                    key={key}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs font-semibold cursor-pointer transition ${
                      form[key]
                        ? "border-emerald-300 bg-emerald-50/50 text-emerald-900"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(e) => setField(key, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Action Buttons ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <Link
            to="/admin/users"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? "Saving Changes..." : "Save & Update Admission"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdmissionEditor;
