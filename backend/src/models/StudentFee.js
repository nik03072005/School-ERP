import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["scholarship", "sibling", "staff_ward", "rte", "other"],
      default: "other",
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    remarks: {
      type: String,
      trim: true,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approved_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const studentInstallmentSchema = new mongoose.Schema(
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
    amount_due: {
      type: Number,
      required: true,
      min: 0,
    },
    amount_paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    late_fee_applied: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue", "waived"],
      default: "pending",
    },
    paid_date: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const studentFeeSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    fee_structure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
    },
    academic_year: {
      type: String,
      required: true,
      trim: true,
    },
    discounts: {
      type: [discountSchema],
      default: [],
    },
    gross_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    total_discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    net_payable: {
      type: Number,
      required: true,
      min: 0,
    },
    installments: {
      type: [studentInstallmentSchema],
      default: [],
    },
    total_paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_due: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
  },
  { timestamps: true }
);

studentFeeSchema.index({ student_id: 1, academic_year: 1 }, { unique: true });

const StudentFee = mongoose.model("StudentFee", studentFeeSchema);

export default StudentFee;
