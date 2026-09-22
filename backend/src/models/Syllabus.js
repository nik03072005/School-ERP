import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const subtopicSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    is_completed: { type: Boolean, default: false },
    completed_at: { type: Date },
  },
  { _id: true }
);

const chapterSchema = new Schema(
  {
    chapter_number: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Annual"],
      default: "Term 1",
    },
    planned_periods: {
      type: Number,
      min: 1,
      default: 6,
    },
    actual_periods: {
      type: Number,
      min: 0,
      default: 0,
    },
    target_completion_date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    completion_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completed_at: {
      type: Date,
    },
    completed_by: {
      type: ObjectId,
      ref: "User",
    },
    teacher_notes: {
      type: String,
      trim: true,
      default: "",
    },
    subtopics: {
      type: [subtopicSchema],
      default: [],
    },
  },
  { _id: true, timestamps: true }
);

const syllabusSchema = new Schema(
  {
    subject_id: {
      type: ObjectId,
      ref: "Subject",
      required: true,
    },
    class_id: {
      type: ObjectId,
      ref: "Class",
      required: true,
    },
    academic_year: {
      type: String,
      trim: true,
      default: "2026-2027",
    },
    chapters: {
      type: [chapterSchema],
      default: [],
    },
    total_chapters: {
      type: Number,
      default: 0,
    },
    completed_chapters: {
      type: Number,
      default: 0,
    },
    overall_completion_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

// Helper to recalculate aggregate completion percentage
syllabusSchema.methods.recalculateProgress = function () {
  const chapters = this.chapters || [];
  this.total_chapters = chapters.length;

  if (chapters.length === 0) {
    this.completed_chapters = 0;
    this.overall_completion_percentage = 0;
    return;
  }

  const completed = chapters.filter(
    (ch) => ch.status === "completed" || ch.completion_percentage >= 100
  ).length;
  this.completed_chapters = completed;

  // Weighted by percentage per chapter
  const totalPct = chapters.reduce((sum, ch) => sum + (ch.completion_percentage || 0), 0);
  this.overall_completion_percentage = Math.round((totalPct / chapters.length) * 10) / 10;
};

// Recalculate before saving
syllabusSchema.pre("save", function () {
  this.recalculateProgress();
});

syllabusSchema.index({ subject_id: 1, academic_year: 1 }, { unique: true });
syllabusSchema.index({ class_id: 1, academic_year: 1 });

const Syllabus = mongoose.model("Syllabus", syllabusSchema);

export default Syllabus;

