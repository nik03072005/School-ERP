import mongoose from "mongoose";

const nonTeachingProfileSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      unique: true,
    },
    job_category: {
      type: String,
      trim: true,
    },
    shift: {
      type: String,
      trim: true,
    },
    reporting_manager: {
      type: String,
      trim: true,
    },
    operational_permissions: {
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

const NonTeachingProfile = mongoose.model("NonTeachingProfile", nonTeachingProfileSchema);

export default NonTeachingProfile;
