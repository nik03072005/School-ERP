import mongoose from "mongoose";

const routeStopSchema = new mongoose.Schema({
  stop_name: {
    type: String,
    required: true,
    trim: true,
  },
  stop_order: {
    type: Number,
    required: true,
  },
  pickup_time: {
    type: String,
    trim: true,
    default: "",
  },
  drop_time: {
    type: String,
    trim: true,
    default: "",
  },
  fare_amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  landmark: {
    type: String,
    trim: true,
    default: "",
  },
});

const transportRouteSchema = new mongoose.Schema(
  {
    route_name: {
      type: String,
      required: true,
      trim: true,
    },
    route_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    start_location: {
      type: String,
      trim: true,
      default: "",
    },
    end_location: {
      type: String,
      trim: true,
      default: "",
    },
    stops: [routeStopSchema],
    description: {
      type: String,
      trim: true,
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const TransportRoute = mongoose.model("TransportRoute", transportRouteSchema);

export default TransportRoute;

