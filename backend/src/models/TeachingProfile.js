import mongoose from "mongoose";

const teachingProfileSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      unique: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience_years: {
      type: Number,
      min: 0,
    },
    subjects: {
      type: [String],
      default: [],
    },
    classes_assigned: {
      type: [String],
      default: [],
    },
    employee_notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const TeachingProfile = mongoose.model("TeachingProfile", teachingProfileSchema);

export default TeachingProfile;
