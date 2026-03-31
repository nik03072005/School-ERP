import mongoose from "mongoose";

const attendanceAuditSchema = new mongoose.Schema(
  {
    target_type: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    attendance_record_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    subject_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["marked", "corrected"],
      required: true,
    },
    old_status: {
      type: String,
      default: "",
    },
    new_status: {
      type: String,
      required: true,
    },
    old_remarks: {
      type: String,
      default: "",
    },
    new_remarks: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    emergency_override: {
      type: Boolean,
      default: false,
    },
    actor_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

attendanceAuditSchema.index({ target_type: 1, attendance_record_id: 1, createdAt: -1 });
attendanceAuditSchema.index({ subject_user_id: 1, createdAt: -1 });

const AttendanceAudit = mongoose.model("AttendanceAudit", attendanceAuditSchema);

export default AttendanceAudit;
