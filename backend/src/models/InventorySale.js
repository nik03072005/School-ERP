import mongoose from "mongoose";
import Counter from "./Counter.js";

const saleItemSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    sku_code: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["uniform", "book", "stationery", "lab_equipment", "other"],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const inventorySaleSchema = new mongoose.Schema(
  {
    sale_number: {
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
    kit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryKit",
    },
    distribution_type: {
      type: String,
      enum: ["admission_kit", "session_start", "ad_hoc_sale", "replacement", "lab_issue"],
      default: "session_start",
    },
    academic_session: {
      type: String,
      default: "2026-2027",
      trim: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one item is required in a distribution/sale"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount_total: {
      type: Number,
      default: 0,
      min: 0,
    },
    payable_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paid_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    payment_mode: {
      type: String,
      enum: [
        "cash",
        "upi",
        "card",
        "bank_transfer",
        "included_in_admission_fee",
        "billed_to_ledger",
        "complimentary",
      ],
      required: true,
      default: "cash",
    },
    payment_status: {
      type: String,
      enum: ["paid", "partial", "pending", "waived"],
      default: "paid",
    },
    transaction_ref: {
      type: String,
      trim: true,
    },
    sale_date: {
      type: Date,
      default: Date.now,
    },
    issued_by: {
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
      enum: ["completed", "cancelled", "returned"],
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

inventorySaleSchema.pre("validate", async function assignSaleNumber() {
  if (this.sale_number) return;

  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const counterKey = `inventory_sale_${yyyymm}`;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  this.sale_number = `STR-${yyyymm}-${String(counter.seq).padStart(4, "0")}`;
});

inventorySaleSchema.index({ student_id: 1, createdAt: -1 });
inventorySaleSchema.index({ distribution_type: 1 });

const InventorySale = mongoose.model("InventorySale", inventorySaleSchema);

export default InventorySale;

