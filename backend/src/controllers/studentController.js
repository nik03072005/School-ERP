import Student from "../models/Student.js";

// @desc    Get my admission form
// @route   GET /api/student/admission
// @access  Student
export const getMyAdmissionForm = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate("class_id", "name grade")
      .populate("section_id", "name");
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Parse DOB from "YYYY-MM-DD" (HTML date input) or "DD/MM/YYYY" (legacy)
const parseDob = (dob) => {
  if (!dob || typeof dob !== "string") return null;
  // ISO format: YYYY-MM-DD
  if (dob.includes("-")) {
    const parts = dob.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (!day || !month || day > 31 || month > 12) return null;
    return { day, month, year };
  }
  // Legacy format: DD/MM/YYYY
  const parts = dob.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || day > 31 || month > 12) return null;
  return { day, month, year };
};

// Days until next birthday from today
const daysUntil = (day, month) => {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  let nextBirthday = new Date(todayY, month - 1, day);
  const today = new Date(todayY, todayM - 1, todayD);

  if (nextBirthday < today) {
    nextBirthday = new Date(todayY + 1, month - 1, day);
  }

  return Math.round((nextBirthday - today) / 86400000);
};

// @desc    Get all students' birthdays (for calendar + today's wishes)
// @route   GET /api/student/birthdays
// @access  Authenticated (student, teaching_staff, admin)
export const getUpcomingBirthdays = async (req, res) => {
  try {
    const students = await Student.find({
      date_of_birth: { $exists: true, $ne: "" },
    })
      .populate("user_id", "first_name last_name")
      .populate("class_id", "name grade")
      .populate("section_id", "name")
      .select("user_id class_id section_id date_of_birth roll_no")
      .lean();

    const birthdays = students
      .map((s) => {
        const parsed = parseDob(s.date_of_birth);
        if (!parsed) return null;
        const { day, month, year } = parsed;
        return {
          _id: s._id,
          first_name: s.user_id?.first_name || "",
          last_name: s.user_id?.last_name || "",
          class_name: s.class_id?.name || "",
          section_name: s.section_id?.name || "",
          roll_no: s.roll_no || "",
          day,
          month,
          birth_year: year,
          days_until: daysUntil(day, month),
          is_today: daysUntil(day, month) === 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.days_until - b.days_until);

    res.json({ birthdays });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
