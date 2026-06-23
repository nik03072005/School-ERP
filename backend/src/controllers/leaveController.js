import LeaveApplication from "../models/LeaveApplication.js";
import { createNotification } from "./notificationController.js";

const daysBetween = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
};

// @desc    Apply for leave (staff: self; parent: for student child)
// @route   POST /api/leaves
// @access  Private
export const applyLeave = async (req, res) => {
  try {
    const { applicant, applicant_type, leave_type, start_date, end_date, reason, attachments, applied_by_role } =
      req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ message: "leave_type, start_date, end_date, and reason are required" });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) return res.status(400).json({ message: "end_date must be on or after start_date" });

    // Who is the actual applicant?
    const targetApplicant = applicant || req.user._id;
    const role = req.user.role_id?.name;
    const isParentApplying = role === "student" && applicant_type === "student";
    const isSelf = !applicant || String(applicant) === String(req.user._id);

    const leave = await LeaveApplication.create({
      applicant: targetApplicant,
      applicant_type: applicant_type || (role === "student" ? "student" : "staff"),
      applied_by: req.user._id,
      applied_by_role: isSelf ? "self" : "parent",
      leave_type,
      start_date: start,
      end_date: end,
      total_days: daysBetween(start, end),
      reason,
      attachments: attachments || [],
    });

    // Notify admin users (simplified — notify the applicant themselves for now)
    createNotification({
      userId: req.user._id,
      type: "leave",
      title: "Leave Application Submitted",
      message: `Your ${leave_type} leave from ${start.toDateString()} to ${end.toDateString()} has been submitted.`,
      data: { leaveId: leave._id },
    }).catch(() => {});

    res.status(201).json({ message: "Leave application submitted", leave });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit leave application", error: error.message });
  }
};

// @desc    Get own leave applications
// @route   GET /api/leaves/mine
// @access  Private
export const getMyLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { applied_by: req.user._id };
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [leaves, total] = await Promise.all([
      LeaveApplication.find(filter)
        .populate("applicant", "first_name last_name")
        .populate("reviewed_by", "first_name last_name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LeaveApplication.countDocuments(filter),
    ]);

    res.json({ leaves, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leave applications", error: error.message });
  }
};

// @desc    Get all leave applications (admin view, filterable)
// @route   GET /api/leaves
// @access  Private (admin)
export const getAllLeaves = async (req, res) => {
  try {
    const { status, applicant_type, from, to, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (applicant_type) filter.applicant_type = applicant_type;
    if (from || to) {
      filter.start_date = {};
      if (from) filter.start_date.$gte = new Date(from);
      if (to) filter.start_date.$lte = new Date(to);
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [leaves, total] = await Promise.all([
      LeaveApplication.find(filter)
        .populate("applicant", "first_name last_name")
        .populate("applied_by", "first_name last_name")
        .populate("reviewed_by", "first_name last_name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LeaveApplication.countDocuments(filter),
    ]);

    res.json({ leaves, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leave applications", error: error.message });
  }
};

// @desc    Approve or reject a leave application
// @route   PATCH /api/leaves/:id/review
// @access  Private (admin)
export const reviewLeave = async (req, res) => {
  try {
    const { status, review_remarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }

    const leave = await LeaveApplication.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          review_remarks: review_remarks || "",
          reviewed_by: req.user._id,
          reviewed_at: new Date(),
        },
      },
      { new: true }
    ).populate("applicant", "first_name last_name");

    if (!leave) return res.status(404).json({ message: "Leave application not found" });

    // Notify the person who applied
    createNotification({
      userId: leave.applied_by || leave.applicant,
      type: "leave",
      title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your leave application (${leave.leave_type}) has been ${status}.${review_remarks ? " Remark: " + review_remarks : ""}`,
      data: { leaveId: leave._id, status },
    }).catch(() => {});

    res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    res.status(500).json({ message: "Failed to review leave application", error: error.message });
  }
};

// @desc    Cancel own pending leave
// @route   PATCH /api/leaves/:id/cancel
// @access  Private
export const cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.findOne({
      _id: req.params.id,
      applied_by: req.user._id,
      status: "pending",
    });

    if (!leave) return res.status(404).json({ message: "Pending leave application not found" });

    leave.status = "cancelled";
    await leave.save();

    res.json({ message: "Leave application cancelled", leave });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel leave", error: error.message });
  }
};
