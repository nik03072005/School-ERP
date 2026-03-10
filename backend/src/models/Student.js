import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    admission_no: { type: String, unique: true, sparse: true, trim: true },
    roll_no: { type: Number },
    admission_date: { type: Date },

    // ── Student Info ───────────────────────────────────────────────
    gender: { type: String, enum: ["male", "female", "other"], trim: true },
    date_of_birth: { type: String, trim: true },   // stored as "DD/MM/YYYY" string
    class_applying: { type: String, trim: true },
    blood_group: { type: String, trim: true },
    aadhar_number: { type: String, trim: true },

    // ── Address ────────────────────────────────────────────────────
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip_code: { type: String, trim: true },
    previous_school: { type: String, trim: true },

    // ── Transport ──────────────────────────────────────────────────
    transport_required: { type: Boolean, default: false },
    pickup_drop_address: { type: String, trim: true },

    // ── Primary Guardian ───────────────────────────────────────────
    primary_guardian_name: { type: String, trim: true },
    primary_guardian_relationship: { type: String, enum: ["mother", "father", "other"], trim: true },
    primary_guardian_phone: { type: String, trim: true },
    primary_guardian_email: { type: String, trim: true },
    primary_guardian_address: { type: String, trim: true },

    // ── Secondary Guardian ─────────────────────────────────────────
    secondary_guardian_name: { type: String, trim: true },
    secondary_guardian_relationship: { type: String, enum: ["mother", "father", "other"], trim: true },
    secondary_guardian_phone: { type: String, trim: true },
    secondary_guardian_email: { type: String, trim: true },

    // ── Emergency Contact ──────────────────────────────────────────
    emergency_contact_name: { type: String, trim: true },
    emergency_contact_relationship: { type: String, trim: true },
    emergency_contact_phone: { type: String, trim: true },

    // ── Medical Info ───────────────────────────────────────────────
    has_allergies: { type: Boolean, default: false },
    allergies_list: { type: String, trim: true },
    has_medical_conditions: { type: Boolean, default: false },
    medical_conditions: { type: String, trim: true },
    physician_name: { type: String, trim: true },
    physician_phone: { type: String, trim: true },
    health_insurance_provider: { type: String, trim: true },
    policy_number: { type: String, trim: true },

    // ── Documents ──────────────────────────────────────────────────
    docs_birth_certificate: { type: Boolean, default: false },
    docs_vaccination_card: { type: Boolean, default: false },
    docs_aadhar_card: { type: Boolean, default: false },
    docs_address_proof: { type: Boolean, default: false },
    docs_photograph: { type: Boolean, default: false },
    docs_other: { type: String, trim: true },

    // ── Legacy fields ──────────────────────────────────────────────
    father_name: { type: String, trim: true },
    mother_name: { type: String, trim: true },
    guardian_mobile: { type: String, trim: true },

    // ── Admission status ───────────────────────────────────────────
    admission_status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    admission_submitted_at: { type: Date },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
