import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  { url: { type: String, required: true }, type: { type: String, enum: ["image", "video"] }, filename: String },
  { _id: false }
);

const entryContentSchema = new mongoose.Schema(
  { text: { type: String, trim: true, default: "" }, media: { type: [mediaSchema], default: [] } },
  { _id: false }
);

const dailyLogbookSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    subject: { type: String, required: true, trim: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    classwork: { type: entryContentSchema, default: () => ({}) },
    homework: { type: entryContentSchema, default: () => ({}) },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

// One entry per class-section-subject per day
dailyLogbookSchema.index({ class_id: 1, section_id: 1, subject: 1, date: 1 }, { unique: true });

const DailyLogbook = mongoose.model("DailyLogbook", dailyLogbookSchema);
export default DailyLogbook;
