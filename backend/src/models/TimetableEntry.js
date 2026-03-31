import mongoose from "mongoose";

const timetableEntrySchema = new mongoose.Schema(
  {
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
    period_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolPeriod",
      required: true,
    },
    teacher_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day_of_week: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      required: true,
    },
    subject_name: {
      type: String,
      trim: true,
      default: "",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

timetableEntrySchema.index({ class_id: 1, section_id: 1, day_of_week: 1, period_id: 1 }, { unique: true });
timetableEntrySchema.index({ teacher_user_id: 1, day_of_week: 1, period_id: 1, is_active: 1 });

const TimetableEntry = mongoose.model("TimetableEntry", timetableEntrySchema);

export default TimetableEntry;