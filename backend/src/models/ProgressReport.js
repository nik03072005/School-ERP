import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const markEntrySchema = new Schema(
  {
    subject: { type: String, required: true },
    max_marks: { type: Number, required: true },
    marks_obtained: { type: Number, required: true, min: 0 },
    grade: { type: String },
    // CBSE Assessment Breakdown (optional)
    periodic_test: { type: Number },
    multiple_assessment: { type: Number },
    portfolio: { type: Number },
    subject_enrichment: { type: Number },
    theory_exam: { type: Number },
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
    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Annual", "Single", "Mid Term", "Final"],
      default: "Term 1",
    },
    // CBSE Co-Scholastic Assessment (3-point scale: A, B, C)
    co_scholastic: {
      work_education: { type: String, default: "A" },
      art_education: { type: String, default: "A" },
      health_physical_education: { type: String, default: "A" },
      discipline: { type: String, default: "A" },
    },
    // Health & Physical Status
    health_status: {
      height: { type: String, default: "" },
      weight: { type: String, default: "" },
      blood_group: { type: String, default: "" },
      vision: { type: String, default: "Normal" },
      dental_hygiene: { type: String, default: "Good" },
    },
    // Holistic Progress Card (NEP 2020 360-degree skills: A, B, C)
    holistic_traits: {
      critical_thinking: { type: String, default: "A" },
      communication: { type: String, default: "A" },
      creativity: { type: String, default: "A" },
      collaboration: { type: String, default: "A" },
      emotional_skills: { type: String, default: "A" },
    },
    // Attendance statistics
    attendance_summary: {
      total_working_days: { type: Number },
      days_attended: { type: Number },
      attendance_percentage: { type: Number },
    },
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
