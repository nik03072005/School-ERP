import mongoose from "mongoose";
import Counter from "./Counter.js";

const studentEarlyGatePassSchema = new mongoose.Schema(
  {
    pass_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    academic_year: {
      type: String,
      trim: true,
      default: "2025-2026",
    },
    reason_type: {
      type: String,
      enum: [
        "Illness / Medical Emergency",
        "Family Emergency",
        "Doctor Appointment",
        "Pre-approved Event / Competition",
        "Personal / Outstation",
        "Transport Breakdown / Emergency",
        "Other",
      ],
      default: "Illness / Medical Emergency",
    },
    reason_details: {
      type: String,
      required: true,
      trim: true,
    },
    // Person authorized to pick up student
    pickup_person_name: {
      type: String,
      required: true,
      trim: true,
    },
    pickup_person_relation: {
      type: String,
      enum: ["Father", "Mother", "Guardian", "Authorized Driver / Escort", "Sibling", "Grandparent", "Other"],
      default: "Father",
    },
    pickup_person_phone: {
      type: String,
      required: true,
      trim: true,
    },
    pickup_person_photo: {
      type: String, // base64 or URL
      default: null,
    },
    pickup_person_id_proof: {
      type: String,
      trim: true,
    },
    // Parental Consent Verification
    parent_consent_method: {
      type: String,
      enum: ["Parent In-Person", "Phone Verification", "Parent Mobile OTP", "Written Note / Email"],
      default: "Parent Mobile OTP",
    },
    parent_otp_code: {
      type: String,
      trim: true,
    },
    parent_otp_verified: {
      type: Boolean,
      default: false,
    },
    parent_otp_verified_at: {
      type: Date,
      default: null,
    },
    parent_notified: {
      type: Boolean,
      default: false,
    },
    // Approval Status Lifecycle
    approval_status: {
      type: String,
      enum: [
        "pending",
        "approved_by_teacher",
        "approved_by_admin",
        "rejected",
        "released_at_gate",
      ],
      default: "pending",
      index: true,
    },
    // Class Teacher Approval
    teacher_approval: {
      approved: { type: Boolean, default: false },
      approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      approved_by_name: { type: String, trim: true, default: null },
      approved_at: { type: Date, default: null },
      remarks: { type: String, trim: true, default: null },
    },
    // Principal / Admin Approval
    admin_approval: {
      approved: { type: Boolean, default: false },
      approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      approved_by_name: { type: String, trim: true, default: null },
      approved_at: { type: Date, default: null },
      remarks: { type: String, trim: true, default: null },
    },
    // Security Gate Departure Confirmation
    gate_security: {
      released: { type: Boolean, default: false },
      released_by_guard: { type: String, trim: true, default: null },
      released_at: { type: Date, default: null },
      gate_number: { type: String, trim: true, default: "Gate 1 - Main Entrance" },
      remarks: { type: String, trim: true, default: null },
    },
    departure_time: {
      type: Date,
      default: Date.now,
    },
    actual_exit_time: {
      type: Date,
      default: null,
    },
    slip_printed: {
      type: Boolean,
      default: false,
    },
    slip_printed_at: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      trim: true,
    },
    rejected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejected_at: {
      type: Date,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    request_channel: {
      type: String,
      enum: ["gate_kiosk", "admin_desk", "parent_portal", "teacher_referral"],
      default: "admin_desk",
    },
  },
  { timestamps: true }
);

// Auto-generate pass number: EGP-YYYY-0001
studentEarlyGatePassSchema.pre("validate", async function () {
  if (this.pass_number) {
    this.pass_number = String(this.pass_number).trim().toUpperCase();
    return;
  }

  const currentYear = new Date().getFullYear();
  const counterKey = `early_gate_pass_${currentYear}`;
  let generatedPass = "";

  while (!generatedPass) {
    const counter = await Counter.findOneAndUpdate(
      { key: counterKey },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const candidatePass = `EGP-${currentYear}-${String(counter.seq).padStart(4, "0")}`;
    const alreadyExists = await mongoose.models.StudentEarlyGatePass?.exists({ pass_number: candidatePass });
    if (!alreadyExists) {
      generatedPass = candidatePass;
    }
  }

  this.pass_number = generatedPass;
});

// Indices for performance
studentEarlyGatePassSchema.index({ departure_time: -1 });

const StudentEarlyGatePass = mongoose.model("StudentEarlyGatePass", studentEarlyGatePassSchema);

export default StudentEarlyGatePass;
