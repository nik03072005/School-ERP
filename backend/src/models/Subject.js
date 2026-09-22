import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    class_id: {
      type: ObjectId,
      ref: "Class",
      required: true,
    },
    board: {
      type: String,
      trim: true,
      default: "CBSE",
    },
    subject_type: {
      type: String,
      enum: ["core", "elective", "language", "vocational", "co_curricular"],
      default: "core",
    },
    split_type: {
      type: String,
      enum: ["80_20", "70_30", "50_50", "100_0", "custom"],
      default: "80_20",
    },
    theory_marks: {
      type: Number,
      required: true,
      min: 0,
      default: 80,
    },
    practical_marks: {
      type: Number,
      min: 0,
      default: 0,
    },
    internal_marks: {
      type: Number,
      min: 0,
      default: 20,
    },
    total_marks: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },
    pass_marks: {
      type: Number,
      min: 0,
      default: 33,
    },
    periods_per_week: {
      type: Number,
      min: 1,
      default: 6,
    },
    assigned_teachers: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    description: {
      type: String,
      trim: true,
      default: "",
    },
    academic_year: {
      type: String,
      trim: true,
      default: "2026-2027",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure unique subject code and name per class for given academic year
subjectSchema.index({ class_id: 1, code: 1, academic_year: 1 }, { unique: true });
subjectSchema.index({ class_id: 1, name: 1, academic_year: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;

