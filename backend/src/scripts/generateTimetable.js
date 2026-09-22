import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import SchoolPeriod from "../models/SchoolPeriod.js";
import TimetableEntry from "../models/TimetableEntry.js";

dotenv.config();

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Subject templates by grade group
const SUBJECTS_PRIMARY = [
  "English",
  "Mathematics",
  "Hindi",
  "Environmental Studies",
  "Computer Science",
  "Art & Craft",
  "Physical Education",
  "Moral Science",
  "Music & Dance",
  "General Knowledge"
];

const SUBJECTS_MIDDLE = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Hindi",
  "Sanskrit",
  "Computer Science",
  "Physical Education",
  "Visual Arts",
  "Library"
];

const SUBJECTS_SECONDARY = [
  "Mathematics",
  "Science (Physics/Chem/Bio)",
  "English Language & Literature",
  "Social Science",
  "Hindi Course-A",
  "Information Technology",
  "Physical Education",
  "Health & Wellness"
];

const SUBJECTS_SENIOR_SCIENCE = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "English Core",
  "Computer Science",
  "Physical Education"
];

const SUBJECTS_SENIOR_COMMERCE = [
  "Accountancy",
  "Business Studies",
  "Economics",
  "English Core",
  "Applied Mathematics",
  "Physical Education",
  "Entrepreneurship"
];

const SUBJECTS_SENIOR_HUMANITIES = [
  "History",
  "Political Science",
  "Economics",
  "English Core",
  "Psychology",
  "Physical Education",
  "Sociology"
];

const getSubjectsForClassAndSection = (gradeLevel, sectionName) => {
  if (gradeLevel <= 5) return SUBJECTS_PRIMARY;
  if (gradeLevel <= 8) return SUBJECTS_MIDDLE;
  if (gradeLevel <= 10) return SUBJECTS_SECONDARY;
  if (sectionName === "A" || sectionName === "B") return SUBJECTS_SENIOR_SCIENCE;
  if (sectionName === "C") return SUBJECTS_SENIOR_COMMERCE;
  return SUBJECTS_SENIOR_HUMANITIES;
};

const getRoomName = (gradeLevel, sectionName, subject) => {
  if (subject === "Physical Education") return "Main Sports Ground";
  if (subject.includes("Computer") || subject.includes("Information Tech")) {
    return gradeLevel <= 8 ? "Computer Lab 1" : "Computer Lab 2";
  }
  if (subject === "Physics" && (gradeLevel === 11 || gradeLevel === 12)) return "Physics Lab";
  if (subject === "Chemistry" && (gradeLevel === 11 || gradeLevel === 12)) return "Chemistry Lab";
  if (subject === "Biology" && (gradeLevel === 11 || gradeLevel === 12)) return "Biology Lab";
  if (subject.includes("Science") && gradeLevel >= 6 && gradeLevel <= 10) return "General Science Lab";
  if (subject === "Art & Craft" || subject === "Visual Arts") return "Creative Arts Studio";
  if (subject === "Library") return "Central Library";

  // Standard Classroom: Floor = Math.ceil(gradeLevel / 3), Room = Floor * 100 + section offset
  const floor = Math.min(4, Math.ceil(gradeLevel / 3));
  const secCode = sectionName.charCodeAt(0) - 64; // A=1, B=2, C=3, D=4
  const roomNum = floor * 100 + ((gradeLevel - 1) % 3) * 4 + secCode;
  return `Room ${roomNum}`;
};

export async function generateAllTimetables() {
  console.log("==========================================================");
  console.log("   GENERATING CONFLICT-FREE TIMETABLE FOR ALL SECTIONS    ");
  console.log("==========================================================");

  await connectDB();

  // 1. Find Admin user
  const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || "admin@school.com" });
  if (!adminUser) {
    console.error("Super Admin not found! Please run npm run seed:demo first.");
    process.exit(1);
  }

  // 2. Load Classes and Sections
  const classes = await Class.find({ is_active: true }).sort({ grade_level: 1 });
  const sections = await Section.find({ is_active: true }).sort({ class_id: 1, name: 1 });

  if (classes.length === 0 || sections.length === 0) {
    console.error("Classes or Sections not found! Please run database seed first.");
    process.exit(1);
  }

  // 3. Load Teaching Periods (exclude breaks)
  const periods = await SchoolPeriod.find({ is_active: true, is_break: false }).sort({ period_number: 1 });
  if (periods.length === 0) {
    console.error("No active teaching periods found!");
    process.exit(1);
  }

  // 4. Load Teaching Staff
  const teachers = await Staff.find({ staff_type: "teaching_staff", is_active: true })
    .populate("user_id", "first_name last_name email")
    .sort({ employee_code: 1 });

  if (teachers.length === 0) {
    console.error("No teaching staff found!");
    process.exit(1);
  }

  console.log(`Classes:          ${classes.length} (Class 1 to ${classes.length})`);
  console.log(`Sections:         ${sections.length} total sections`);
  console.log(`Teaching Periods: ${periods.length} periods/day`);
  console.log(`Working Days:     ${DAYS_OF_WEEK.length} days/week (${DAYS_OF_WEEK.join(", ")})`);
  console.log(`Teachers Pool:    ${teachers.length} active teachers`);

  // Map class by ID
  const classMap = {};
  classes.forEach((c) => { classMap[String(c._id)] = c; });

  // 5. Clean existing timetable entries
  console.log("Clearing previous timetable entries...");
  await TimetableEntry.deleteMany({});

  // 6. Generate Conflict-Free Timetable
  // Mathematical guarantee of 0 conflict:
  // For each (dayIndex, periodIndex), section s is assigned teacherIndex = (s + periodIndex + 7 * dayIndex) % teachers.length.
  // Since total sections (48) < total teachers (50), every section in a given period gets a distinct teacher!
  const timetableDocs = [];
  const teacherCount = teachers.length;

  for (let d = 0; d < DAYS_OF_WEEK.length; d++) {
    const day = DAYS_OF_WEEK[d];

    for (let p = 0; p < periods.length; p++) {
      const period = periods[p];

      for (let s = 0; s < sections.length; s++) {
        const section = sections[s];
        const classDoc = classMap[String(section.class_id)];
        const gradeLevel = classDoc.grade_level;

        // Conflict-free teacher selection
        const teacherOffset = (s + p + 7 * d) % teacherCount;
        const teacherDoc = teachers[teacherOffset];
        const teacherUserId = teacherDoc.user_id._id;

        // Subject assignment for this slot
        const subjects = getSubjectsForClassAndSection(gradeLevel, section.name);
        const subjectIndex = (p + d * 2) % subjects.length;
        const subjectName = subjects[subjectIndex];

        // Room assignment
        const roomName = getRoomName(gradeLevel, section.name, subjectName);

        timetableDocs.push({
          class_id: classDoc._id,
          section_id: section._id,
          period_id: period._id,
          teacher_user_id: teacherUserId,
          day_of_week: day,
          subject_name: subjectName,
          room: roomName,
          is_active: true,
          created_by_user_id: adminUser._id
        });
      }
    }
  }

  console.log(`Inserting ${timetableDocs.length} timetable entries in batches...`);
  const batchSize = 500;
  for (let i = 0; i < timetableDocs.length; i += batchSize) {
    await TimetableEntry.insertMany(timetableDocs.slice(i, i + batchSize));
    process.stdout.write(`Processed ${Math.min(i + batchSize, timetableDocs.length)}/${timetableDocs.length} entries...\r`);
  }

  console.log("\nTimetable successfully generated!");

  // 7. Verify Zero Teacher Conflicts
  console.log("Verifying teacher conflicts across all slots...");
  const conflictAgg = await TimetableEntry.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: { teacher_user_id: "$teacher_user_id", day_of_week: "$day_of_week", period_id: "$period_id" },
        count: { $sum: 1 },
        classes: { $push: "$class_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (conflictAgg.length > 0) {
    console.warn(`WARNING: Found ${conflictAgg.length} teacher conflicts!`);
  } else {
    console.log("VERIFICATION PASSED: Exactly 0 teacher conflicts detected! Every teacher is in at most one classroom per period.");
  }

  console.log("==========================================================");
  console.log(`Total Timetable Slots Created: ${timetableDocs.length}`);
  console.log(`48 Sections x 7 Periods x 6 Days = 2,016 Slots`);
  console.log("==========================================================");

  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith("generateTimetable.js")) {
  generateAllTimetables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error generating timetable:", err);
      process.exit(1);
    });
}

