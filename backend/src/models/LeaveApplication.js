import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  { url: { type: String, required: true }, type: { type: String, enum: ["image", "video"] }, filename: String },
  { _id: false }
);

const leaveApplicationSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicant_type: { type: String, enum: ["staff", "student"], required: true },

    // For student leaves, the parent applies on behalf of the student
    applied_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    applied_by_role: { type: String, enum: ["self", "parent"], default: "self" },

    leave_type: {
      type: String,
      enum: ["sick", "casual", "emergency", "maternity", "paternity", "other"],
      required: true,
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    total_days: { type: Number, default: 1 },

    reason: { type: String, required: true, trim: true },
    attachments: { type: [attachmentSchema], default: [] },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    review_remarks: { type: String, trim: true },
    reviewed_at: { type: Date },
  },
  { timestamps: true }
);

leaveApplicationSchema.index({ applicant: 1, status: 1 });
leaveApplicationSchema.index({ start_date: 1, end_date: 1 });

const LeaveApplication = mongoose.model("LeaveApplication", leaveApplicationSchema);
export default LeaveApplication;
