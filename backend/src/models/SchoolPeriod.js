import mongoose from "mongoose";

const schoolPeriodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    period_number: {
      type: Number,
      required: true,
      min: 1,
    },
    start_time: {
      type: String,
      required: true,
      trim: true,
    },
    end_time: {
      type: String,
      required: true,
      trim: true,
    },
    is_break: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

schoolPeriodSchema.index({ period_number: 1 }, { unique: true });

const SchoolPeriod = mongoose.model("SchoolPeriod", schoolPeriodSchema);

export default SchoolPeriod;
