import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true }
);

staffAttendanceSchema.index(
  { user_id: 1, attendance_date: 1, checkpoint: 1 },
  { unique: true }
);
staffAttendanceSchema.index({ attendance_date: 1, checkpoint: 1 });

const StaffAttendance = mongoose.model("StaffAttendance", staffAttendanceSchema);

export default StaffAttendance;
