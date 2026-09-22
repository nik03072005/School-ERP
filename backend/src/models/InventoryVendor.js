import mongoose from "mongoose";

const inventoryVendorSchema = new mongoose.Schema(
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
    contact_person: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    categories_supplied: {
      type: [String],
      enum: ["uniform", "book", "stationery", "lab_equipment", "other"],
      default: ["stationery"],
    },
    bank_details: {
      bank_name: { type: String, trim: true },
      account_no: { type: String, trim: true },
      ifsc: { type: String, trim: true, uppercase: true },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const InventoryVendor = mongoose.model("InventoryVendor", inventoryVendorSchema);

export default InventoryVendor;

