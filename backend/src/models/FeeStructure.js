import mongoose from "mongoose";

const feeComponentSchema = new mongoose.Schema(
  {
    fee_head_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeHead",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ["annual", "term", "monthly", "one_time"],
      default: "annual",
    },
  },
  { _id: false }
);

const installmentPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const lateFeePolicySchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    grace_days: {
      type: Number,
      default: 0,
      min: 0,
    },
    penalty_type: {
      type: String,
      enum: ["flat", "percentage"],
      default: "flat",
    },
    penalty_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    penalty_frequency: {
      type: String,
      enum: ["once", "per_day", "per_month"],
      default: "once",
    },
    max_penalty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    academic_year: {
      type: String,
      required: true,
      trim: true,
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    components: {
      type: [feeComponentSchema],
      default: [],
    },
    installments: {
      type: [installmentPlanSchema],
      default: [],
    },
    late_fee_policy: {
      type: lateFeePolicySchema,
      default: () => ({}),
    },
    total_annual_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

feeStructureSchema.index({ academic_year: 1, class_id: 1, section_id: 1 });

feeStructureSchema.pre("validate", function computeTotal() {
  this.total_annual_amount = (this.components || []).reduce((sum, c) => sum + (c.amount || 0), 0);
});

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);

export default FeeStructure;
