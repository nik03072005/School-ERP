import mongoose from "mongoose";
import Counter from "./Counter.js";

const allocationSchema = new mongoose.Schema(
  {
    installment_name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const feePaymentSchema = new mongoose.Schema(
  {
    receipt_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    student_fee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
    },
    allocations: {
      type: [allocationSchema],
      default: [],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_mode: {
      type: String,
      enum: ["cash", "cheque", "bank_transfer", "upi", "dd", "card", "other"],
      required: true,
    },
    transaction_ref: {
      type: String,
      trim: true,
    },
    payment_date: {
      type: Date,
      default: Date.now,
    },
    collected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
    },
    cancelled_reason: {
      type: String,
      trim: true,
    },
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelled_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

feePaymentSchema.pre("validate", async function assignReceiptNumber() {
  if (this.receipt_number) return;

  const now = new Date();
  const counterKey = `fee_receipt_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  this.receipt_number = `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    counter.seq
  ).padStart(4, "0")}`;
});

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);

export default FeePayment;
