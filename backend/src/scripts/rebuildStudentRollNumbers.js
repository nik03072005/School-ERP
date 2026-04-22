import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import "../models/User.js";

dotenv.config();

const toRollToken = (value, fallback) => {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return cleaned || fallback;
};

const buildRollNo = (className, sectionName, sequenceNumber) => {
  const classToken = toRollToken(className, "CLASS");
  const sectionToken = toRollToken(sectionName, "SEC");
  return `${classToken}-${sectionToken}-${String(sequenceNumber).padStart(3, "0")}`;
};

const compareStudentsAlphabetically = (left, right) => {
  const leftFirst = String(left?.user_id?.first_name || "").toLowerCase();
  const rightFirst = String(right?.user_id?.first_name || "").toLowerCase();
  if (leftFirst !== rightFirst) return leftFirst.localeCompare(rightFirst);

  const leftLast = String(left?.user_id?.last_name || "").toLowerCase();
  const rightLast = String(right?.user_id?.last_name || "").toLowerCase();
  if (leftLast !== rightLast) return leftLast.localeCompare(rightLast);

  return String(left?._id || "").localeCompare(String(right?._id || ""));
};

const getSectionKey = (classId, sectionId) => `${String(classId)}::${String(sectionId)}`;

const rebuildSectionRollNumbers = async ({ classDoc, sectionDoc }) => {
  const students = await Student.find({
    class_id: classDoc._id,
    section_id: sectionDoc._id,
  })
    .populate("user_id", "first_name last_name")
    .select("_id user_id roll_no")
    .lean(false);

  students.sort(compareStudentsAlphabetically);

  if (students.length === 0) {
    return { updated: 0, sectionLabel: `${classDoc.name}-${sectionDoc.name}` };
  }

  // Clear roll numbers first to avoid unique index collisions during resequencing.
  await Student.updateMany(
    { _id: { $in: students.map((item) => item._id) } },
    { $unset: { roll_no: 1 } }
  );

  const operations = students.map((student, index) => ({
    updateOne: {
      filter: { _id: student._id },
      update: {
        $set: {
          roll_no: buildRollNo(classDoc.name, sectionDoc.name, index + 1),
        },
      },
    },
  }));

  const result = await Student.bulkWrite(operations, { ordered: true });
  return {
    updated: result.modifiedCount || 0,
    sectionLabel: `${classDoc.name}-${sectionDoc.name}`,
  };
};

const main = async () => {
  await connectDB();

  const studentsWithSection = await Student.find({
    class_id: { $ne: null },
    section_id: { $ne: null },
  })
    .select("_id class_id section_id")
    .lean();

  if (studentsWithSection.length === 0) {
    console.log("No students with class/section mapping found.");
    return;
  }

  const uniquePairs = new Map();
  studentsWithSection.forEach((student) => {
    const key = getSectionKey(student.class_id, student.section_id);
    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, {
        classId: student.class_id,
        sectionId: student.section_id,
      });
    }
  });

  let totalUpdated = 0;
  let processedSections = 0;

  for (const pair of uniquePairs.values()) {
    const [classDoc, sectionDoc] = await Promise.all([
      Class.findById(pair.classId).select("_id name"),
      Section.findById(pair.sectionId).select("_id class_id name"),
    ]);

    if (!classDoc || !sectionDoc) {
      console.warn(`Skipping invalid mapping class=${pair.classId} section=${pair.sectionId}`);
      continue;
    }

    if (String(sectionDoc.class_id) !== String(classDoc._id)) {
      console.warn(`Skipping mismatched mapping class=${classDoc._id} section=${sectionDoc._id}`);
      continue;
    }

    const sectionResult = await rebuildSectionRollNumbers({ classDoc, sectionDoc });
    processedSections += 1;
    totalUpdated += sectionResult.updated;
    console.log(`Rebuilt roll numbers for ${sectionResult.sectionLabel} (updated ${sectionResult.updated})`);
  }

  console.log(`Completed. Sections processed: ${processedSections}, Students updated: ${totalUpdated}`);
};

main()
  .catch((error) => {
    console.error("Failed to rebuild student roll numbers", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
