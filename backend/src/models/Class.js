import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    grade_level: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    capacity: {
      type: Number,
      default: 40,
      min: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classSchema.index({ grade_level: 1, name: 1 }, { unique: true });

const Class = mongoose.model("Class", classSchema);

export default Class;
