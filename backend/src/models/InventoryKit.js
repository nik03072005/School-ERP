import mongoose from "mongoose";

const kitItemSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const inventoryKitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    category: {
      type: String,
      enum: ["uniform_kit", "book_set", "combined_kit", "lab_kit", "other"],
      default: "combined_kit",
    },
    items: {
      type: [kitItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one item is required in a kit"],
    },
    bundle_price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const InventoryKit = mongoose.model("InventoryKit", inventoryKitSchema);

export default InventoryKit;

