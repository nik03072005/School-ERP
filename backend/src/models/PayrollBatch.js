import mongoose from "mongoose";

const payrollBatchSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    batch_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "processed", "approved", "disbursed"],
      default: "draft",
    },
    total_calendar_days: {
      type: Number,
      default: 30,
    },
    total_working_days: {
      type: Number,
      default: 26,
    },
    staff_count: {
      type: Number,
      default: 0,
    },
    teaching_staff_count: {
      type: Number,
      default: 0,
    },
    non_teaching_staff_count: {
      type: Number,
      default: 0,
    },
    total_basic_pay: {
      type: Number,
      default: 0,
    },
    total_allowances: {
      type: Number,
      default: 0,
    },
    total_gross_pay: {
      type: Number,
      default: 0,
    },
    total_epf: {
      type: Number,
      default: 0,
    },
    total_esi: {
      type: Number,
      default: 0,
    },
    total_pt: {
      type: Number,
      default: 0,
    },
    total_tds: {
      type: Number,
      default: 0,
    },
    total_lop_deductions: {
      type: Number,
      default: 0,
    },
    total_other_deductions: {
      type: Number,
      default: 0,
    },
    total_deductions: {
      type: Number,
      default: 0,
    },
    total_net_pay: {
      type: Number,
      default: 0,
    },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approved_at: {
      type: Date,
    },
    disbursed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    disbursed_at: {
      type: Date,
    },
    payment_method: {
      type: String,
      default: "bank_transfer",
    },
    disbursement_reference: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

payrollBatchSchema.index({ month: 1, year: 1 }, { unique: true });

const PayrollBatch = mongoose.model("PayrollBatch", payrollBatchSchema);

export default PayrollBatch;

