import Student from "../models/Student.js";
import FeeStructure from "../models/FeeStructure.js";
import StudentFee from "../models/StudentFee.js";
import FeePayment from "../models/FeePayment.js";
import { recomputeStudentFeeTotals } from "../utils/feeCalculations.js";

const STUDENT_POPULATE = {
  path: "student_id",
  select: "admission_no roll_no class_id section_id user_id",
  populate: [
    { path: "user_id", select: "first_name last_name email" },
    { path: "class_id", select: "name grade_level" },
    { path: "section_id", select: "name" },
  ],
};

// @desc    Record a payment against a student's fee (single receipt, may cover several installments)
// @route   POST /api/fees/payments
// @access  Private (admin)
export const recordPayment = async (req, res) => {
  try {
    const { student_fee_id, allocations, installment_name, amount, payment_mode, transaction_ref, remarks, payment_date } =
      req.body;

    if (!student_fee_id) return res.status(400).json({ message: "student_fee_id is required" });
    if (!payment_mode) return res.status(400).json({ message: "payment_mode is required" });

    const resolvedAllocations =
      allocations && allocations.length > 0 ? allocations : installment_name ? [{ installment_name, amount }] : [];

    if (resolvedAllocations.length === 0) {
      return res.status(400).json({ message: "At least one installment allocation is required" });
    }

    const studentFee = await StudentFee.findById(student_fee_id);
    if (!studentFee) return res.status(404).json({ message: "Student fee record not found" });

    const feeStructure = await FeeStructure.findById(studentFee.fee_structure_id);
    if (!feeStructure) return res.status(404).json({ message: "Linked fee structure not found" });

    let totalAmount = 0;
    for (const allocation of resolvedAllocations) {
      const installment = studentFee.installments.find((i) => i.name === allocation.installment_name);
      if (!installment) {
        return res.status(400).json({ message: `Installment "${allocation.installment_name}" not found` });
      }
      const allocAmount = Number(allocation.amount) || 0;
      if (allocAmount <= 0) {
        return res.status(400).json({ message: "Allocation amount must be greater than zero" });
      }
      installment.amount_paid = Math.round((installment.amount_paid + allocAmount) * 100) / 100;
      totalAmount += allocAmount;
    }

    recomputeStudentFeeTotals(studentFee, feeStructure);

    studentFee.installments.forEach((installment) => {
      if (installment.status === "paid" && !installment.paid_date) {
        installment.paid_date = payment_date ? new Date(payment_date) : new Date();
      }
    });

    await studentFee.save();

    const payment = await FeePayment.create({
      student_id: studentFee.student_id,
      student_fee_id: studentFee._id,
      allocations: resolvedAllocations.map((a) => ({ installment_name: a.installment_name, amount: Number(a.amount) })),
      amount: Math.round(totalAmount * 100) / 100,
      payment_mode,
      transaction_ref,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      collected_by: req.user._id,
      remarks,
    });

    res.status(201).json({ message: "Payment recorded", payment, studentFee });
  } catch (error) {
    res.status(500).json({ message: "Failed to record payment", error: error.message });
  }
};

// @desc    List payments (collection register), filterable
// @route   GET /api/fees/payments
// @access  Private (admin)
export const listPayments = async (req, res) => {
  try {
    const { from, to, payment_mode, student_id, class_id, section_id, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (payment_mode) filter.payment_mode = payment_mode;
    if (student_id) filter.student_id = student_id;
    if (status) filter.status = status;
    if (from || to) {
      filter.payment_date = {};
      if (from) filter.payment_date.$gte = new Date(from);
      if (to) filter.payment_date.$lte = new Date(to);
    }

    if (class_id || section_id) {
      const studentFilter = {};
      if (class_id) studentFilter.class_id = class_id;
      if (section_id) studentFilter.section_id = section_id;
      const studentIds = await Student.find(studentFilter).distinct("_id");
      filter.student_id = { $in: studentIds };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [payments, total, totalsAgg] = await Promise.all([
      FeePayment.find(filter)
        .populate(STUDENT_POPULATE)
        .populate("collected_by", "first_name last_name")
        .sort({ payment_date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FeePayment.countDocuments(filter),
      FeePayment.aggregate([
        { $match: { ...filter, status: "completed" } },
        { $group: { _id: null, totalCollected: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      totalCollected: totalsAgg[0]?.totalCollected || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payments", error: error.message });
  }
};

// @desc    Get the logged-in student's own payment history
// @route   GET /api/fees/payments/mine
// @access  Private (student, self)
export const getMyPayments = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) return res.status(404).json({ message: "Student profile not found" });

    const payments = await FeePayment.find({ student_id: student._id })
      .populate(STUDENT_POPULATE)
      .populate("collected_by", "first_name last_name")
      .sort({ payment_date: -1 })
      .lean();
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment history", error: error.message });
  }
};

// @desc    Get a single payment/receipt (admin, or the owning student)
// @route   GET /api/fees/payments/:id
// @access  Private (admin or owning student)
export const getPayment = async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id)
      .populate(STUDENT_POPULATE)
      .populate("collected_by", "first_name last_name")
      .populate("cancelled_by", "first_name last_name");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const role = req.user.role_id?.name;
    if (role !== "admin") {
      const student = await Student.findOne({ user_id: req.user._id });
      if (!student || String(payment.student_id?._id || payment.student_id) !== String(student._id)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment", error: error.message });
  }
};

// @desc    Cancel/void a payment, reversing its effect on the student's installments
// @route   POST /api/fees/payments/:id/cancel
// @access  Private (admin)
export const cancelPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await FeePayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "cancelled") {
      return res.status(400).json({ message: "Payment is already cancelled" });
    }

    const studentFee = await StudentFee.findById(payment.student_fee_id);
    if (!studentFee) return res.status(404).json({ message: "Linked student fee record not found" });

    const feeStructure = await FeeStructure.findById(studentFee.fee_structure_id);

    payment.allocations.forEach((allocation) => {
      const installment = studentFee.installments.find((i) => i.name === allocation.installment_name);
      if (installment) {
        installment.amount_paid = Math.max(0, Math.round((installment.amount_paid - allocation.amount) * 100) / 100);
        if (installment.amount_paid === 0) installment.paid_date = null;
      }
    });

    recomputeStudentFeeTotals(studentFee, feeStructure);
    await studentFee.save();

    payment.status = "cancelled";
    payment.cancelled_reason = reason || "";
    payment.cancelled_by = req.user._id;
    payment.cancelled_at = new Date();
    await payment.save();

    res.json({ message: "Payment cancelled", payment, studentFee });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel payment", error: error.message });
  }
};
