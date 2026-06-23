import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const markEntrySchema = new Schema(
  {
    subject: { type: String, required: true },
    max_marks: { type: Number, required: true },
    marks_obtained: { type: Number, required: true, min: 0 },
    grade: { type: String },
  },
  { _id: false }
);

const progressReportSchema = new Schema(
  {
    student_id: { type: ObjectId, ref: "Student", required: true },
    exam_schedule_id: { type: ObjectId, ref: "ExamSchedule", required: true },
    marks: { type: [markEntrySchema], default: [] },
    total_marks_obtained: { type: Number },
    total_max_marks: { type: Number },
    percentage: { type: Number },
    overall_grade: { type: String },
    remarks: { type: String, trim: true },
    is_published: { type: Boolean, default: false },
    published_by: { type: ObjectId, ref: "User" },
    published_at: { type: Date },
    entered_by: { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

progressReportSchema.index({ student_id: 1, exam_schedule_id: 1 }, { unique: true });

const ProgressReport = mongoose.model("ProgressReport", progressReportSchema);
export default ProgressReport;
