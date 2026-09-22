import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    action_type: {
      type: String,
      enum: [
        "purchase_inward",
        "student_sale",
        "sale_cancel",
        "adjustment_damage",
        "adjustment_loss",
        "adjustment_return",
        "manual_correction",
        "initial_stock",
      ],
      required: true,
    },
    quantity_change: {
      type: Number,
      required: true,
    },
    previous_stock: {
      type: Number,
      required: true,
    },
    new_stock: {
      type: Number,
      required: true,
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reference_model: {
      type: String,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ item_id: 1, createdAt: -1 });

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

export default InventoryLog;

