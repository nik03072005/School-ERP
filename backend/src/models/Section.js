import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    class_teacher_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

sectionSchema.index({ class_id: 1, name: 1 }, { unique: true });

const Section = mongoose.model("Section", sectionSchema);

export default Section;
