import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const subjectSlotSchema = new Schema(
  {
    subject: { type: String, required: true, trim: true },
    max_marks: { type: Number, required: true, default: 100 },
    exam_date: { type: Date },
  },
  { _id: false }
);

const examScheduleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    exam_type: {
      type: String,
      enum: ["unit_test", "mid_term", "final", "other"],
      default: "other",
    },
    class_id: { type: ObjectId, ref: "Class", required: true },
    section_id: { type: ObjectId, ref: "Section" },
    subjects: { type: [subjectSlotSchema], default: [] },
    academic_year: { type: String, trim: true },
    is_published: { type: Boolean, default: false },
    created_by: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const ExamSchedule = mongoose.model("ExamSchedule", examScheduleSchema);
export default ExamSchedule;
