import mongoose from "mongoose";
import Counter from "./Counter.js";

const purchaseItemSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_cost: {
      type: Number,
      required: true,
      min: 0,
    },
    tax_percent: {
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

const inventoryPurchaseSchema = new mongoose.Schema(
  {
    purchase_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryVendor",
      required: true,
    },
    invoice_no: {
      type: String,
      trim: true,
    },
    purchase_date: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one purchase item is required"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grand_total: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_status: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "paid",
    },
    payment_mode: {
      type: String,
      enum: ["cash", "cheque", "bank_transfer", "upi", "credit", "other"],
      default: "bank_transfer",
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

inventoryPurchaseSchema.pre("validate", async function assignPurchaseNumber() {
  if (this.purchase_number) return;

  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const counterKey = `inventory_purchase_${yyyymm}`;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  this.purchase_number = `PUR-${yyyymm}-${String(counter.seq).padStart(4, "0")}`;
});

const InventoryPurchase = mongoose.model("InventoryPurchase", inventoryPurchaseSchema);

export default InventoryPurchase;

