import mongoose from "mongoose";
import Counter from "./Counter.js";

const visitorLogSchema = new mongoose.Schema(
  {
    pass_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    visitor_name: {
      type: String,
      required: true,
      trim: true,
    },
    visitor_phone: {
      type: String,
      required: true,
      trim: true,
    },
    visitor_email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    visitor_photo: {
      type: String, // Base64 or image URL
      default: null,
    },
    id_proof_type: {
      type: String,
      enum: ["Aadhaar Card", "Driving License", "PAN Card", "Voter ID", "Passport", "Govt ID / Other"],
      default: "Aadhaar Card",
    },
    id_proof_number: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      enum: [
        "Parent Meeting",
        "Admissions Inquiry",
        "Vendor / Delivery",
        "Maintenance / Contractor",
        "Guest / Dignitary",
        "Official / CBSE Inspection",
        "Interview / Recruitment",
        "Fee / Accounts Inquiry",
        "Other",
      ],
      default: "Parent Meeting",
    },
    purpose_details: {
      type: String,
      trim: true,
    },
    person_to_meet_type: {
      type: String,
      enum: ["staff", "student", "department", "general"],
      default: "staff",
    },
    person_to_meet_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    person_to_meet_name: {
      type: String,
      required: true,
      trim: true,
    },
    person_to_meet_department: {
      type: String,
      trim: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    vehicle_number: {
      type: String,
      trim: true,
      uppercase: true,
    },
    accompanying_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    belongings_declared: {
      type: String,
      trim: true,
    },
    otp_code: {
      type: String,
      trim: true,
    },
    otp_verified: {
      type: Boolean,
      default: false,
    },
    otp_verified_at: {
      type: Date,
      default: null,
    },
    check_in_time: {
      type: Date,
      default: Date.now,
    },
    expected_out_time: {
      type: Date,
      default: null,
    },
    check_out_time: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["checked_in", "checked_out", "overstayed", "rejected_entry", "blacklisted"],
      default: "checked_in",
    },
    security_guard_name: {
      type: String,
      trim: true,
      default: "Main Gate Guard",
    },
    gate_number: {
      type: String,
      trim: true,
      default: "Gate 1 - Main Entrance",
    },
    pocso_undertaking_accepted: {
      type: Boolean,
      default: true,
    },
    badge_printed: {
      type: Boolean,
      default: false,
    },
    badge_print_count: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate pass number: VIS-YYYY-0001
visitorLogSchema.pre("validate", async function () {
  if (this.pass_number) {
    this.pass_number = String(this.pass_number).trim().toUpperCase();
    return;
  }

  const currentYear = new Date().getFullYear();
  const counterKey = `visitor_pass_${currentYear}`;
  let generatedPass = "";

  while (!generatedPass) {
    const counter = await Counter.findOneAndUpdate(
      { key: counterKey },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const candidatePass = `VIS-${currentYear}-${String(counter.seq).padStart(4, "0")}`;
    const alreadyExists = await mongoose.models.VisitorLog?.exists({ pass_number: candidatePass });
    if (!alreadyExists) {
      generatedPass = candidatePass;
    }
  }

  this.pass_number = generatedPass;
});

// Indices for performance
visitorLogSchema.index({ visitor_phone: 1 });
visitorLogSchema.index({ status: 1 });
visitorLogSchema.index({ check_in_time: -1 });

const VisitorLog = mongoose.model("VisitorLog", visitorLogSchema);

export default VisitorLog;
