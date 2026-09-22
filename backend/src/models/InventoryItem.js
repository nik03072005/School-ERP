import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    sku_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: ["uniform", "book", "stationery", "lab_equipment", "other"],
      required: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      enum: ["piece", "pair", "set", "box", "dozen", "packet", "meter", "kg", "liter"],
      default: "piece",
    },
    applicable_class_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    specifications: {
      size: { type: String, trim: true }, // e.g., 28, 30, 32, S, M, L
      edition_or_publisher: { type: String, trim: true }, // e.g., NCERT, Cambridge
      author: { type: String, trim: true },
      lab_type: {
        type: String,
        enum: ["consumable", "non_consumable", "apparatus", "glassware", "specimen", "chemical", "none"],
        default: "none",
      },
      shelf_location: { type: String, trim: true }, // e.g., Rack B-2, Store Room 1
    },
    cost_price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    selling_price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    current_stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    min_alert_stock: {
      type: Number,
      default: 5,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ category: 1, is_active: 1 });
inventoryItemSchema.index({ applicable_class_ids: 1 });

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

export default InventoryItem;

