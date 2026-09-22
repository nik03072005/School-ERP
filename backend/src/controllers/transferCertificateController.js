import TransferCertificate from "../models/TransferCertificate.js";
import Student from "../models/Student.js";
import StudentAttendance from "../models/StudentAttendance.js";
import StudentFee from "../models/StudentFee.js";

// Helper to convert date to words (e.g., 15/08/2010 -> Fifteenth August Two Thousand Ten)
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const ONES = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
  "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function dayToWords(day) {
  const d = parseInt(day, 10);
  if (d <= 19) return ONES[d];
  if (d === 20) return "Twentieth";
  if (d === 30) return "Thirtieth";
  if (d === 31) return "Thirty First";
  const tens = Math.floor(d / 10);
  const ones = d % 10;
  return `${TENS[tens]} ${ONES[ones]}`.trim();
}

function yearToWords(year) {
  const y = parseInt(year, 10);
  if (y === 2000) return "Two Thousand";
  if (y > 2000 && y < 2100) {
    const rem = y - 2000;
    const word = rem < 20 ? ONES[rem] : `${TENS[Math.floor(rem / 10)]} ${ONES[rem % 10]}`;
    return `Two Thousand ${word}`.trim();
  }
  return String(y);
}

function convertDobToWords(dobString) {
  if (!dobString) return "";
  // Supports DD/MM/YYYY or YYYY-MM-DD
  let day, month, year;
  if (dobString.includes("/")) {
    [day, month, year] = dobString.split("/");
  } else if (dobString.includes("-")) {
    [year, month, day] = dobString.split("-");
  } else {
    return dobString;
  }

  const mIndex = parseInt(month, 10) - 1;
  const monthName = MONTHS[mIndex] || month;
  const dWords = dayToWords(day);
  const yWords = yearToWords(year);
  return `${dWords} ${monthName} ${yWords}`.trim();
}

// @desc    Pre-fill TC data for an enrolled student
// @route   GET /api/tc/prefill/:studentId
// @access  Private (admin)
export const getStudentTCData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId)
      .populate("user_id", "first_name last_name email mobile")
      .populate("class_id", "name grade_level")
      .populate("section_id", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentName = `${student.user_id?.first_name || ""} ${student.user_id?.last_name || ""}`.trim();
    const className = student.class_id?.name
      ? `${student.class_id.name}${student.section_id?.name ? ` - ${student.section_id.name}` : ""}`
      : student.class_applying || "Class X";

    // Attendance stats
    const [totalAtt, presentAtt] = await Promise.all([
      StudentAttendance.countDocuments({ student_id: studentId }),
      StudentAttendance.countDocuments({ student_id: studentId, status: { $in: ["present", "late"] } }),
    ]);

    // Fee dues status
    const studentFee = await StudentFee.findOne({ student_id: studentId }).sort({ createdAt: -1 });
    let duesStatus = "March 2026 (All School Dues Cleared)";
    if (studentFee && studentFee.balance_amount > 0) {
      duesStatus = `Outstanding Dues: ₹${studentFee.balance_amount}`;
    }

    const dobWords = convertDobToWords(student.date_of_birth);

    const prefillData = {
      student_id: student._id,
      admission_no: student.admission_no || "KG-" + String(student._id).slice(-4).toUpperCase(),
      student_name: studentName,
      mother_name: student.mother_name || (student.primary_guardian_relationship === "mother" ? student.primary_guardian_name : "—"),
      father_name: student.father_name || (student.primary_guardian_relationship === "father" ? student.primary_guardian_name : student.primary_guardian_name || "—"),
      nationality: "Indian",
      category: "General",
      admission_date: student.admission_date || student.createdAt,
      admission_class: student.class_applying || student.class_id?.name || "Class I",
      dob: student.date_of_birth || "",
      dob_words: dobWords,
      class_leaving: className,
      last_exam_status: "Passed Annual Examination with First Division",
      whether_failed: "No",
      subjects_studied: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer Science"],
      qualified_for_promotion: "Yes, Promoted to Next Class",
      dues_paid_upto: duesStatus,
      fee_concession: "None",
      total_working_days: totalAtt > 0 ? totalAtt : 218,
      days_present: presentAtt > 0 ? presentAtt : 204,
      ncc_scout_guide: "N/A",
      games_activities: "Participated in Inter-School Sports & Cultural Meets",
      general_conduct: "Exemplary",
      application_date: new Date().toISOString().split("T")[0],
      issue_date: new Date().toISOString().split("T")[0],
      reason_for_leaving: "Parents Relocation / Higher Education",
      remarks: "Possesses good character and commendable academic performance. Best wishes for the future.",
    };

    res.json({ prefillData, student });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student data for TC", error: error.message });
  }
};

// @desc    Issue a new Transfer Certificate
// @route   POST /api/tc
// @access  Private (admin)
export const createTC = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      issued_by: req.user._id,
    };

    const tc = await TransferCertificate.create(payload);
    res.status(201).json({ message: "Transfer Certificate issued successfully", tc });
  } catch (error) {
    res.status(500).json({ message: "Failed to issue Transfer Certificate", error: error.message });
  }
};

// @desc    List all issued Transfer Certificates
// @route   GET /api/tc
// @access  Private (admin)
export const listTCs = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { tc_number: { $regex: search, $options: "i" } },
        { student_name: { $regex: search, $options: "i" } },
        { admission_no: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [tcs, total] = await Promise.all([
      TransferCertificate.find(filter)
        .populate("student_id", "admission_no class_id section_id")
        .populate("issued_by", "first_name last_name")
        .sort({ issue_date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TransferCertificate.countDocuments(filter),
    ]);

    res.json({
      tcs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to list Transfer Certificates", error: error.message });
  }
};

// @desc    Get single Transfer Certificate by ID
// @route   GET /api/tc/:id
// @access  Private (admin)
export const getTCById = async (req, res) => {
  try {
    const tc = await TransferCertificate.findById(req.params.id)
      .populate("student_id")
      .populate("issued_by", "first_name last_name email");

    if (!tc) return res.status(404).json({ message: "Transfer Certificate not found" });

    res.json({ tc });
  } catch (error) {
    res.status(500).json({ message: "Failed to get Transfer Certificate", error: error.message });
  }
};

// @desc    Cancel an issued Transfer Certificate
// @route   PATCH /api/tc/:id/cancel
// @access  Private (admin)
export const cancelTC = async (req, res) => {
  try {
    const { reason } = req.body;
    const tc = await TransferCertificate.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled", cancelled_reason: reason || "Administrative cancellation" },
      { new: true }
    );

    if (!tc) return res.status(404).json({ message: "Transfer Certificate not found" });

    res.json({ message: "Transfer Certificate cancelled", tc });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel Transfer Certificate", error: error.message });
  }
};

