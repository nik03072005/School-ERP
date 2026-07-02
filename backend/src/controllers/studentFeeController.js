import Student from "../models/Student.js";
import FeeStructure from "../models/FeeStructure.js";
import StudentFee from "../models/StudentFee.js";
import { buildInstallmentsFromStructure, recomputeStudentFeeTotals } from "../utils/feeCalculations.js";
import { sendFeeWhatsApp } from "../services/whatsappService.js";

const STUDENT_POPULATE = {
  path: "student_id",
  select: "admission_no roll_no class_id section_id user_id primary_guardian_phone",
  populate: [
    { path: "user_id", select: "first_name last_name email" },
    { path: "class_id", select: "name grade_level" },
    { path: "section_id", select: "name" },
  ],
};

// @desc    Assign a fee structure to a class/section, or specific students
// @route   POST /api/fees/assign
// @access  Private (admin)
export const assignFeeStructure = async (req, res) => {
  try {
    const { fee_structure_id, class_id, section_id, student_ids } = req.body;
    if (!fee_structure_id) return res.status(400).json({ message: "fee_structure_id is required" });

    const feeStructure = await FeeStructure.findById(fee_structure_id);
    if (!feeStructure) return res.status(404).json({ message: "Fee structure not found" });

    let students;
    if (student_ids && student_ids.length > 0) {
      students = await Student.find({ _id: { $in: student_ids } });
    } else {
      const filter = { class_id: feeStructure.class_id, admission_status: "approved" };
      if (feeStructure.section_id) filter.section_id = feeStructure.section_id;
      else if (section_id) filter.section_id = section_id;
      students = await Student.find(filter);
    }

    if (students.length === 0) {
      return res.status(400).json({ message: "No matching students found to assign" });
    }

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      const exists = await StudentFee.findOne({
        student_id: student._id,
        academic_year: feeStructure.academic_year,
      });
      if (exists) {
        skipped += 1;
        continue;
      }

      const netPayable = feeStructure.total_annual_amount;
      await StudentFee.create({
        student_id: student._id,
        fee_structure_id: feeStructure._id,
        academic_year: feeStructure.academic_year,
        gross_amount: feeStructure.total_annual_amount,
        total_discount: 0,
        net_payable: netPayable,
        installments: buildInstallmentsFromStructure(feeStructure, netPayable),
      });
      created += 1;
    }

    res.status(201).json({ message: `Assigned to ${created} student(s), ${skipped} already assigned`, created, skipped });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign fee structure", error: error.message });
  }
};

// @desc    Apply a discount/scholarship to a student's fee assignment
// @route   POST /api/fees/:studentFeeId/discount
// @access  Private (admin)
export const addDiscount = async (req, res) => {
  try {
    const { label, type, amount, percentage, remarks } = req.body;
    if (!label) return res.status(400).json({ message: "label is required" });

    const studentFee = await StudentFee.findById(req.params.studentFeeId);
    if (!studentFee) return res.status(404).json({ message: "Student fee record not found" });

    const feeStructure = await FeeStructure.findById(studentFee.fee_structure_id);
    if (!feeStructure) return res.status(404).json({ message: "Linked fee structure not found" });

    studentFee.discounts.push({
      label,
      type: type || "other",
      amount: amount || 0,
      percentage: percentage || 0,
      remarks,
      approved_by: req.user._id,
      approved_at: new Date(),
    });

    const totalDiscount = studentFee.discounts.reduce(
      (sum, d) => sum + (d.amount || 0) + (studentFee.gross_amount * (d.percentage || 0)) / 100,
      0
    );
    studentFee.total_discount = Math.round(totalDiscount * 100) / 100;
    studentFee.net_payable = Math.max(0, Math.round((studentFee.gross_amount - studentFee.total_discount) * 100) / 100);

    const rebuilt = buildInstallmentsFromStructure(feeStructure, studentFee.net_payable);
    studentFee.installments = rebuilt.map((installment, index) => ({
      ...installment,
      amount_paid: studentFee.installments[index]?.amount_paid || 0,
      late_fee_applied: studentFee.installments[index]?.late_fee_applied || 0,
      paid_date: studentFee.installments[index]?.paid_date || null,
    }));

    recomputeStudentFeeTotals(studentFee, feeStructure);
    await studentFee.save();

    res.json({ message: "Discount applied", studentFee });
  } catch (error) {
    res.status(500).json({ message: "Failed to apply discount", error: error.message });
  }
};

// @desc    Get a specific student's fee detail (admin, any student)
// @route   GET /api/fees/student/:studentId
// @access  Private (admin)
export const getStudentFee = async (req, res) => {
  try {
    const filter = { student_id: req.params.studentId };
    if (req.query.academic_year) filter.academic_year = req.query.academic_year;

    const studentFees = await StudentFee.find(filter)
      .populate(STUDENT_POPULATE)
      .populate("fee_structure_id")
      .sort({ academic_year: -1 })
      .lean();

    studentFees.forEach((sf) => recomputeStudentFeeTotals(sf, sf.fee_structure_id));

    res.json({ studentFees });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student fee detail", error: error.message });
  }
};

// @desc    Get the logged-in student's own fee detail
// @route   GET /api/fees/my
// @access  Private (student, self)
export const getMyFee = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) return res.status(404).json({ message: "Student profile not found" });

    const filter = { student_id: student._id };
    if (req.query.academic_year) filter.academic_year = req.query.academic_year;

    const studentFees = await StudentFee.find(filter)
      .populate("fee_structure_id")
      .sort({ academic_year: -1 })
      .lean();

    studentFees.forEach((sf) => recomputeStudentFeeTotals(sf, sf.fee_structure_id));

    res.json({ studentFees });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fee detail", error: error.message });
  }
};

// @desc    Dues / defaulters report
// @route   GET /api/fees/dues
// @access  Private (admin)
export const getDues = async (req, res) => {
  try {
    const { class_id, section_id, academic_year, status, overdue_only } = req.query;

    let studentIds = null;
    if (class_id || section_id) {
      const studentFilter = {};
      if (class_id) studentFilter.class_id = class_id;
      if (section_id) studentFilter.section_id = section_id;
      studentIds = await Student.find(studentFilter).distinct("_id");
    }

    const feeFilter = {};
    if (studentIds) feeFilter.student_id = { $in: studentIds };
    if (academic_year) feeFilter.academic_year = academic_year;
    if (status) feeFilter.status = status;

    let studentFees = await StudentFee.find(feeFilter)
      .populate(STUDENT_POPULATE)
      .populate("fee_structure_id")
      .sort({ createdAt: -1 })
      .lean();

    studentFees.forEach((sf) => recomputeStudentFeeTotals(sf, sf.fee_structure_id));

    if (overdue_only === "true") {
      studentFees = studentFees.filter((sf) => sf.status === "overdue");
    }

    res.json({ studentFees, total: studentFees.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dues report", error: error.message });
  }
};

// @desc    Fee collection dashboard summary
// @route   GET /api/fees/summary
// @access  Private (admin)
export const getFeeSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const filter = {};
    if (academic_year) filter.academic_year = academic_year;

    const studentFees = await StudentFee.find(filter)
      .populate("fee_structure_id", "late_fee_policy")
      .populate({ path: "student_id", select: "class_id", populate: { path: "class_id", select: "name" } })
      .lean();

    studentFees.forEach((sf) => recomputeStudentFeeTotals(sf, sf.fee_structure_id));

    const totals = studentFees.reduce(
      (acc, sf) => {
        acc.netPayable += sf.net_payable || 0;
        acc.collected += sf.total_paid || 0;
        acc.outstanding += sf.total_due || 0;
        if (sf.status === "overdue") acc.overdueCount += 1;
        return acc;
      },
      { netPayable: 0, collected: 0, outstanding: 0, overdueCount: 0 }
    );

    const classWiseMap = {};
    studentFees.forEach((sf) => {
      const className = sf.student_id?.class_id?.name || "Unassigned";
      if (!classWiseMap[className]) {
        classWiseMap[className] = { className, netPayable: 0, collected: 0, outstanding: 0, students: 0 };
      }
      classWiseMap[className].netPayable += sf.net_payable || 0;
      classWiseMap[className].collected += sf.total_paid || 0;
      classWiseMap[className].outstanding += sf.total_due || 0;
      classWiseMap[className].students += 1;
    });

    res.json({
      totals: {
        ...totals,
        collectionPercentage: totals.netPayable > 0 ? Math.round((totals.collected / totals.netPayable) * 10000) / 100 : 0,
        studentCount: studentFees.length,
      },
      classWise: Object.values(classWiseMap),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to build fee summary", error: error.message });
  }
};

// @desc    Send a WhatsApp fee reminder for a student's overdue dues
// @route   POST /api/fees/:studentFeeId/reminder
// @access  Private (admin)
export const sendFeeReminder = async (req, res) => {
  try {
    const studentFee = await StudentFee.findById(req.params.studentFeeId)
      .populate(STUDENT_POPULATE)
      .populate("fee_structure_id");
    if (!studentFee) return res.status(404).json({ message: "Student fee record not found" });

    recomputeStudentFeeTotals(studentFee, studentFee.fee_structure_id);

    const overdueInstallments = studentFee.installments.filter((i) => i.status === "overdue");
    if (overdueInstallments.length === 0) {
      return res.status(400).json({ message: "This student has no overdue installments" });
    }

    const student = studentFee.student_id;
    const phone = student?.primary_guardian_phone;
    if (!phone) return res.status(400).json({ message: "No guardian phone number on file for this student" });

    const studentName = `${student.user_id?.first_name || ""} ${student.user_id?.last_name || ""}`.trim();
    const earliestDue = overdueInstallments.reduce(
      (earliest, i) => (new Date(i.due_date) < new Date(earliest.due_date) ? i : earliest),
      overdueInstallments[0]
    );

    await sendFeeWhatsApp({
      phone,
      studentName,
      feeType: overdueInstallments.map((i) => i.name).join(", "),
      amount: studentFee.total_due,
      dueDate: earliestDue.due_date,
    });

    res.json({ message: "Fee reminder sent" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send fee reminder", error: error.message });
  }
};
