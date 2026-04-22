import mongoose from "mongoose";
import Counter from "./Counter.js";

const buildEmployeeCode = (staffType, seq) => {
  const prefix = staffType === "teaching_staff" ? "TCH" : "NTS";
  return `${prefix}-${String(seq).padStart(4, "0")}`;
};

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

staffSchema.pre("validate", async function assignEmployeeCode(next) {
  try {
    if (this.employee_code) {
      this.employee_code = String(this.employee_code).trim().toUpperCase();
      return next();
    }

    if (!this.staff_type) {
      return next();
    }

    const counterKey = `employee_code_${this.staff_type}`;
    let generatedCode = "";

    while (!generatedCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: counterKey },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const candidateCode = buildEmployeeCode(this.staff_type, counter.seq);
      const alreadyExists = await mongoose.models.Staff.exists({ employee_code: candidateCode });
      if (!alreadyExists) {
        generatedCode = candidateCode;
      }
    }

    this.employee_code = generatedCode;
    return next();
  } catch (error) {
    return next(error);
  }
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
