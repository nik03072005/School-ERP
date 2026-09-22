import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicle_no: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicle_model: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle_type: {
      type: String,
      enum: ["bus", "mini_bus", "van", "auto", "other"],
      default: "bus",
    },
    seating_capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    driver_name: {
      type: String,
      trim: true,
      required: true,
    },
    driver_phone: {
      type: String,
      trim: true,
      required: true,
    },
    driver_license: {
      type: String,
      trim: true,
      uppercase: true,
    },
    driver_staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    attendant_name: {
      type: String,
      trim: true,
    },
    attendant_phone: {
      type: String,
      trim: true,
    },
    insurance_policy_no: {
      type: String,
      trim: true,
    },
    insurance_expiry_date: {
      type: Date,
    },
    fitness_expiry_date: {
      type: Date,
    },
    pollution_expiry_date: {
      type: Date,
    },
    gps_device_id: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;

