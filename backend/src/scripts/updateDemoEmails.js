import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Update Teacher 1 (TCH-0001) to teacher@school.com
  const tch1 = await Staff.findOne({ employee_code: "TCH-0001" });
  if (tch1) {
    await User.updateOne({ _id: tch1.user_id }, { $set: { email: "teacher@school.com" } });
    console.log("Updated TCH-0001 to email: teacher@school.com");
  } else {
    console.log("TCH-0001 not found");
  }

  // Update Student 1 (ADM-2026-0001 / CLASS1-A-001) to student@school.com
  const std1 = await Student.findOne({ admission_no: "ADM-2026-0001" });
  if (std1) {
    await User.updateOne({ _id: std1.user_id }, { $set: { email: "student@school.com" } });
    console.log("Updated ADM-2026-0001 to email: student@school.com");
  } else {
    console.log("ADM-2026-0001 not found");
  }

  // Update Staff 1 (NTS-0001) to staff@school.com
  const nts1 = await Staff.findOne({ employee_code: "NTS-0001" });
  if (nts1) {
    await User.updateOne({ _id: nts1.user_id }, { $set: { email: "staff@school.com" } });
    console.log("Updated NTS-0001 to email: staff@school.com");
  } else {
    console.log("NTS-0001 not found");
  }

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch(console.error);

