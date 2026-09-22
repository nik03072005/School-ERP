import mongoose from "mongoose";
import Counter from "./Counter.js";

const transferCertificateSchema = new mongoose.Schema(
  {
    tc_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academic_year: {
      type: String,
      trim: true,
      default: "2025-2026",
    },
    admission_no: {
      type: String,
      trim: true,
    },
    student_name: {
      type: String,
      required: true,
      trim: true,
    },
    mother_name: {
      type: String,
      trim: true,
      default: "—",
    },
    father_name: {
      type: String,
      trim: true,
      default: "—",
    },
    nationality: {
      type: String,
      trim: true,
      default: "Indian",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    admission_date: {
      type: Date,
    },
    admission_class: {
      type: String,
      trim: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    dob_words: {
      type: String,
      trim: true,
    },
    class_leaving: {
      type: String,
      trim: true,
      required: true,
    },
    last_exam_status: {
      type: String,
      trim: true,
      default: "Passed Annual School Examination",
    },
    whether_failed: {
      type: String,
      trim: true,
      default: "No",
    },
    subjects_studied: {
      type: [String],
      default: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer Science"],
    },
    qualified_for_promotion: {
      type: String,
      trim: true,
      default: "Yes, Promoted to Next Higher Class",
    },
    dues_paid_upto: {
      type: String,
      trim: true,
      default: "March 2026 (All School Dues Cleared)",
    },
    fee_concession: {
      type: String,
      trim: true,
      default: "None",
    },
    total_working_days: {
      type: Number,
      default: 218,
    },
    days_present: {
      type: Number,
      default: 204,
    },
    ncc_scout_guide: {
      type: String,
      trim: true,
      default: "N/A",
    },
    games_activities: {
      type: String,
      trim: true,
      default: "Inter-House Athletics & Debates",
    },
    general_conduct: {
      type: String,
      trim: true,
      default: "Exemplary",
    },
    application_date: {
      type: Date,
      default: Date.now,
    },
    issue_date: {
      type: Date,
      default: Date.now,
    },
    reason_for_leaving: {
      type: String,
      trim: true,
      default: "Parents Relocation / Transfer to another city",
    },
    remarks: {
      type: String,
      trim: true,
      default: "A disciplined, sincere student. We wish all the best for future academic pursuits.",
    },
    status: {
      type: String,
      enum: ["issued", "cancelled"],
      default: "issued",
    },
    cancelled_reason: {
      type: String,
      trim: true,
    },
    issued_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

transferCertificateSchema.pre("validate", async function assignTCNumber() {
  if (this.tc_number) return;

  const now = new Date();
  const year = now.getFullYear();
  const counterKey = `tc_number_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  this.tc_number = `KG/TC/${year}/${String(counter.seq).padStart(4, "0")}`;
});

const TransferCertificate = mongoose.model("TransferCertificate", transferCertificateSchema);

export default TransferCertificate;

