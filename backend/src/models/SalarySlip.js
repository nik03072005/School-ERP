import mongoose from "mongoose";

const salarySlipSchema = new mongoose.Schema(
  {
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollBatch",
      required: true,
    },
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slip_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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

    // ── Employee Snapshot ──
    employee_code: { type: String, trim: true },
    employee_name: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    staff_type: {
      type: String,
      enum: ["teaching_staff", "non_teaching_staff"],
    },
    joining_date: { type: Date },
    pan_number: { type: String, trim: true },
    uan_number: { type: String, trim: true },
    pf_account_no: { type: String, trim: true },
    esi_number: { type: String, trim: true },
    bank_name: { type: String, trim: true },
    bank_account_no: { type: String, trim: true },
    bank_ifsc: { type: String, trim: true },

    // ── Attendance Metrics ──
    calendar_days: { type: Number, default: 30 },
    working_days: { type: Number, default: 26 },
    present_days: { type: Number, default: 26 },
    approved_leaves: { type: Number, default: 0 },
    half_days: { type: Number, default: 0 },
    lop_days: { type: Number, default: 0 },
    payable_days: { type: Number, default: 26 },

    // ── Earnings ──
    basic_salary: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance_allowance: { type: Number, default: 0 },
    medical_allowance: { type: Number, default: 0 },
    special_allowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtime_pay: { type: Number, default: 0 },
    gross_earnings: { type: Number, default: 0 },

    // ── Statutory & Other Deductions ──
    epf_employee: { type: Number, default: 0 },
    epf_employer: { type: Number, default: 0 },
    esi_employee: { type: Number, default: 0 },
    esi_employer: { type: Number, default: 0 },
    professional_tax: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    lop_deduction: { type: Number, default: 0 },
    other_deductions: { type: Number, default: 0 },
    total_deductions: { type: Number, default: 0 },

    // ── Net Pay ──
    net_salary: { type: Number, default: 0 },
    net_salary_words: { type: String, trim: true, default: "" },

    // ── Status & Payment ──
    status: {
      type: String,
      enum: ["draft", "processed", "approved", "paid", "cancelled"],
      default: "draft",
    },
    payment_method: { type: String, default: "bank_transfer" },
    payment_date: { type: Date },
    transaction_reference: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

salarySlipSchema.index({ batch_id: 1, staff_id: 1 }, { unique: true });
salarySlipSchema.index({ user_id: 1, month: 1, year: 1 });
salarySlipSchema.index({ month: 1, year: 1 });

const SalarySlip = mongoose.model("SalarySlip", salarySlipSchema);

export default SalarySlip;

