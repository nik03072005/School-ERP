import mongoose from "mongoose";

const studentAttendanceSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    attendance_date: {
      type: Date,
      required: true,
    },
    checkpoint: {
      type: String,
      enum: ["start", "end"],
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "leave_pending", "leave_approved"],
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    marked_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergency_override: {
      type: Boolean,
      default: false,
    },
    emergency_reason: {
      type: String,
      trim: true,
      default: "",
    },
    emergency_override_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    emergency_override_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

studentAttendanceSchema.index(
  { student_id: 1, attendance_date: 1, checkpoint: 1 },
  { unique: true }
);
studentAttendanceSchema.index({ class_id: 1, section_id: 1, attendance_date: 1, checkpoint: 1 });

const StudentAttendance = mongoose.model("StudentAttendance", studentAttendanceSchema);

export default StudentAttendance;
