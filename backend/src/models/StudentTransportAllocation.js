import mongoose from "mongoose";

const studentTransportAllocationSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    route_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
    },
    pickup_stop_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    pickup_stop_name: {
      type: String,
      trim: true,
      default: "",
    },
    drop_stop_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    drop_stop_name: {
      type: String,
      trim: true,
      default: "",
    },
    allocation_type: {
      type: String,
      enum: ["both_ways", "pickup_only", "drop_only"],
      default: "both_ways",
    },
    academic_year: {
      type: String,
      default: "2026-27",
      trim: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "cancelled"],
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

studentTransportAllocationSchema.index({ student_id: 1, status: 1 });
studentTransportAllocationSchema.index({ route_id: 1, status: 1 });

const StudentTransportAllocation = mongoose.model(
  "StudentTransportAllocation",
  studentTransportAllocationSchema
);

export default StudentTransportAllocation;

