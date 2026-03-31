import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employee_code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    joining_date: {
      type: Date,
    },
    basic_salary: {
      type: Number,
    },
    bank_account_no: {
      type: String,
      trim: true,
    },
    bank_name: {
      type: String,
      trim: true,
    },
    staff_type: {
      type: String,
      enum: ["teaching_staff", "non_teaching_staff"],
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
