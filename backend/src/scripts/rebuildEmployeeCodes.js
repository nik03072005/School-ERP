import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Staff from "../models/Staff.js";
import Counter from "../models/Counter.js";

dotenv.config();

const TYPE_CONFIG = {
  teaching_staff: { prefix: "TCH", counterKey: "employee_code_teaching_staff" },
  non_teaching_staff: { prefix: "NTS", counterKey: "employee_code_non_teaching_staff" },
};

const buildEmployeeCode = (prefix, sequenceNumber) => {
  return `${prefix}-${String(sequenceNumber).padStart(4, "0")}`;
};

const rebuildCodesByType = async (staffType) => {
  const config = TYPE_CONFIG[staffType];
  if (!config) return { updated: 0, staffType };

  const staffMembers = await Staff.find({ staff_type: staffType })
    .select("_id")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (staffMembers.length === 0) {
    await Counter.updateOne(
      { key: config.counterKey },
      { $set: { seq: 0 } },
      { upsert: true }
    );
    return { updated: 0, staffType };
  }

  // Clear first so resequencing never collides with unique index.
  await Staff.updateMany({ staff_type: staffType }, { $unset: { employee_code: 1 } });

  const operations = staffMembers.map((staff, index) => ({
    updateOne: {
      filter: { _id: staff._id },
      update: {
        $set: {
          employee_code: buildEmployeeCode(config.prefix, index + 1),
        },
      },
    },
  }));

  const result = await Staff.bulkWrite(operations, { ordered: true });

  await Counter.updateOne(
    { key: config.counterKey },
    { $set: { seq: staffMembers.length } },
    { upsert: true }
  );

  return {
    updated: result.modifiedCount || 0,
    staffType,
  };
};

const main = async () => {
  await connectDB();

  const teaching = await rebuildCodesByType("teaching_staff");
  console.log(`Rebuilt employee codes for ${teaching.staffType} (updated ${teaching.updated})`);

  const nonTeaching = await rebuildCodesByType("non_teaching_staff");
  console.log(`Rebuilt employee codes for ${nonTeaching.staffType} (updated ${nonTeaching.updated})`);

  const totalUpdated = (teaching.updated || 0) + (nonTeaching.updated || 0);
  console.log(`Completed. Staff records updated: ${totalUpdated}`);
};

main()
  .catch((error) => {
    console.error("Failed to rebuild employee codes", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
