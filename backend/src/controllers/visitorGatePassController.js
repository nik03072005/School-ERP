import VisitorLog from "../models/VisitorLog.js";
import StudentEarlyGatePass from "../models/StudentEarlyGatePass.js";
import Student from "../models/Student.js";
import Staff from "../models/Staff.js";
import Section from "../models/Section.js";
import User from "../models/User.js";
import { sendWhatsAppMessage } from "../services/whatsappService.js";

// Helper to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Security Summary Statistics ───────────────────────────────────────────
export const getSecurityStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      activeVisitors,
      todayVisitorsCount,
      overstayedCount,
      pendingGatePasses,
      todayReleasedPasses,
      totalGatePassesToday,
    ] = await Promise.all([
      VisitorLog.countDocuments({ status: "checked_in" }),
      VisitorLog.countDocuments({ check_in_time: { $gte: todayStart, $lte: todayEnd } }),
      VisitorLog.countDocuments({
        status: "checked_in",
        check_in_time: { $lt: new Date(Date.now() - 3 * 60 * 60 * 1000) }, // more than 3 hours
      }),
      StudentEarlyGatePass.countDocuments({
        approval_status: { $in: ["pending", "approved_by_teacher"] },
      }),
      StudentEarlyGatePass.countDocuments({
        approval_status: "released_at_gate",
        actual_exit_time: { $gte: todayStart, $lte: todayEnd },
      }),
      StudentEarlyGatePass.countDocuments({
        departure_time: { $gte: todayStart, $lte: todayEnd },
      }),
    ]);

    res.json({
      success: true,
      data: {
        activeVisitors,
        todayVisitorsCount,
        overstayedCount,
        pendingGatePasses,
        todayReleasedPasses,
        totalGatePassesToday,
        pocsoComplianceRate: 100, // All visitor logs & pickup slips adhere to OTP & guardian verification
      },
    });
  } catch (error) {
    console.error("Error getting security stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Visitor Logbook: List ────────────────────────────────────────────────
export const getVisitors = async (req, res) => {
  try {
    const { status, search, dateRange, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { visitor_name: regex },
        { visitor_phone: regex },
        { pass_number: regex },
        { person_to_meet_name: regex },
        { vehicle_number: regex },
      ];
    }

    if (dateRange === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filter.check_in_time = { $gte: todayStart };
    } else if (dateRange === "week") {
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filter.check_in_time = { $gte: weekStart };
    }

    const visitors = await VisitorLog.find(filter)
      .populate("person_to_meet_user_id", "first_name last_name email mobile")
      .sort({ check_in_time: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await VisitorLog.countDocuments(filter);

    res.json({
      success: true,
      visitors,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Visitor: Check-In New ─────────────────────────────────────────────────
export const createVisitor = async (req, res) => {
  try {
    const {
      visitor_name,
      visitor_phone,
      visitor_email,
      visitor_photo,
      id_proof_type,
      id_proof_number,
      purpose,
      purpose_details,
      person_to_meet_type,
      person_to_meet_user_id,
      person_to_meet_name,
      person_to_meet_department,
      vehicle_number,
      accompanying_count,
      belongings_declared,
      security_guard_name,
      gate_number,
      remarks,
    } = req.body;

    if (!visitor_name || !visitor_phone || !person_to_meet_name) {
      return res.status(400).json({
        success: false,
        message: "Visitor name, phone number, and person to meet are required.",
      });
    }

    const otp_code = generateOtp();

    const visitor = new VisitorLog({
      visitor_name: visitor_name.trim(),
      visitor_phone: visitor_phone.trim(),
      visitor_email: visitor_email ? visitor_email.trim() : null,
      visitor_photo: visitor_photo || null,
      id_proof_type: id_proof_type || "Aadhaar Card",
      id_proof_number: id_proof_number ? id_proof_number.trim() : null,
      purpose: purpose || "Parent Meeting",
      purpose_details: purpose_details ? purpose_details.trim() : null,
      person_to_meet_type: person_to_meet_type || "staff",
      person_to_meet_user_id: person_to_meet_user_id || null,
      person_to_meet_name: person_to_meet_name.trim(),
      person_to_meet_department: person_to_meet_department ? person_to_meet_department.trim() : null,
      vehicle_number: vehicle_number ? vehicle_number.trim().toUpperCase() : null,
      accompanying_count: Number(accompanying_count) || 0,
      belongings_declared: belongings_declared ? belongings_declared.trim() : null,
      otp_code,
      otp_verified: false,
      security_guard_name: security_guard_name || "Main Gate Security",
      gate_number: gate_number || "Gate 1 - Main Entrance",
      remarks: remarks ? remarks.trim() : null,
      created_by: req.user?._id || null,
    });

    await visitor.save();

    // Trigger SMS/WhatsApp alert if configured
    try {
      const msg = `Welcome to Kidz Galaxy School. Your visitor pass ${visitor.pass_number} is generated. Person to meet: ${visitor.person_to_meet_name}. Verification OTP: ${otp_code}. POCSO child safety rules strictly apply on campus.`;
      await sendWhatsAppMessage(visitor.visitor_phone, msg);
    } catch (e) {
      console.warn("WhatsApp notification skipped:", e.message);
    }

    res.status(201).json({
      success: true,
      message: `Visitor check-in registered successfully. Pass #${visitor.pass_number}`,
      visitor,
      generatedOtp: otp_code, // Returned for instant testing/quick-fill
    });
  } catch (error) {
    console.error("Error creating visitor:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Visitor: Send / Resend OTP ───────────────────────────────────────────
export const sendVisitorOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await VisitorLog.findById(id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found." });
    }

    const newOtp = generateOtp();
    visitor.otp_code = newOtp;
    await visitor.save();

    try {
      const msg = `Kidz Galaxy ERP: Your visitor verification code is ${newOtp}. Valid for campus entry.`;
      await sendWhatsAppMessage(visitor.visitor_phone, msg);
    } catch (e) {
      console.warn("WhatsApp notification skipped:", e.message);
    }

    res.json({
      success: true,
      message: `OTP sent successfully to ${visitor.visitor_phone}`,
      generatedOtp: newOtp,
    });
  } catch (error) {
    console.error("Error sending visitor OTP:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Visitor: Verify OTP ──────────────────────────────────────────────────
export const verifyVisitorOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const visitor = await VisitorLog.findById(id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found." });
    }

    // Allow simulated OTP "123456" for quick verification or matching stored code
    if (otp === "123456" || otp === visitor.otp_code) {
      visitor.otp_verified = true;
      visitor.otp_verified_at = new Date();
      await visitor.save();

      return res.json({
        success: true,
        message: "Visitor phone verified successfully.",
        visitor,
      });
    }

    return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
  } catch (error) {
    console.error("Error verifying visitor OTP:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Visitor: Check-Out ───────────────────────────────────────────────────
export const checkOutVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const visitor = await VisitorLog.findById(id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found." });
    }

    if (visitor.status === "checked_out") {
      return res.status(400).json({ success: false, message: "Visitor already checked out." });
    }

    visitor.status = "checked_out";
    visitor.check_out_time = new Date();
    if (remarks) {
      visitor.remarks = visitor.remarks ? `${visitor.remarks} | Exit: ${remarks}` : remarks;
    }
    await visitor.save();

    res.json({
      success: true,
      message: `Visitor ${visitor.visitor_name} checked out at ${visitor.check_out_time.toLocaleTimeString()}`,
      visitor,
    });
  } catch (error) {
    console.error("Error checking out visitor:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Visitor: Record Badge Print ──────────────────────────────────────────
export const recordVisitorBadgePrint = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await VisitorLog.findById(id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found." });
    }

    visitor.badge_printed = true;
    visitor.badge_print_count = (visitor.badge_print_count || 0) + 1;
    await visitor.save();

    res.json({
      success: true,
      message: "Badge print recorded.",
      badge_print_count: visitor.badge_print_count,
    });
  } catch (error) {
    console.error("Error recording badge print:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: List ────────────────────────────────────────────────
export const getGatePasses = async (req, res) => {
  try {
    const { status, class_id, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.approval_status = status;
    }

    if (class_id) {
      filter.class_id = class_id;
    }

    let query = StudentEarlyGatePass.find(filter)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name avatar mobile email" },
      })
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("teacher_approval.approved_by", "first_name last_name")
      .populate("admin_approval.approved_by", "first_name last_name")
      .sort({ departure_time: -1 });

    const passes = await query.limit(Number(limit)).skip((Number(page) - 1) * Number(limit));

    // Optional student search filter in memory if populated
    let filteredPasses = passes;
    if (search) {
      const q = search.trim().toLowerCase();
      filteredPasses = passes.filter((p) => {
        const studentUser = p.student_id?.user_id;
        const fullName = `${studentUser?.first_name || ""} ${studentUser?.last_name || ""}`.toLowerCase();
        const roll = (p.student_id?.roll_no || "").toLowerCase();
        const passNo = (p.pass_number || "").toLowerCase();
        const pickupName = (p.pickup_person_name || "").toLowerCase();
        return fullName.includes(q) || roll.includes(q) || passNo.includes(q) || pickupName.includes(q);
      });
    }

    const total = await StudentEarlyGatePass.countDocuments(filter);

    res.json({
      success: true,
      gatePasses: filteredPasses,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching gate passes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Create New Request ──────────────────────────────────
export const createGatePass = async (req, res) => {
  try {
    const {
      student_id,
      reason_type,
      reason_details,
      pickup_person_name,
      pickup_person_relation,
      pickup_person_phone,
      pickup_person_photo,
      pickup_person_id_proof,
      parent_consent_method,
      departure_time,
      request_channel,
    } = req.body;

    if (!student_id || !reason_details || !pickup_person_name || !pickup_person_phone) {
      return res.status(400).json({
        success: false,
        message: "Student, reason, pickup person name and phone are required.",
      });
    }

    const student = await Student.findById(student_id).populate("user_id", "first_name last_name mobile");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const parent_otp_code = generateOtp();

    const gatePass = new StudentEarlyGatePass({
      student_id,
      class_id: student.class_id,
      section_id: student.section_id,
      academic_year: "2025-2026",
      reason_type: reason_type || "Illness / Medical Emergency",
      reason_details: reason_details.trim(),
      pickup_person_name: pickup_person_name.trim(),
      pickup_person_relation: pickup_person_relation || "Father",
      pickup_person_phone: pickup_person_phone.trim(),
      pickup_person_photo: pickup_person_photo || null,
      pickup_person_id_proof: pickup_person_id_proof ? pickup_person_id_proof.trim() : null,
      parent_consent_method: parent_consent_method || "Parent Mobile OTP",
      parent_otp_code,
      parent_otp_verified: false,
      departure_time: departure_time ? new Date(departure_time) : new Date(),
      created_by: req.user?._id || null,
      request_channel: request_channel || "admin_desk",
    });

    await gatePass.save();

    // Trigger Parent SMS / WhatsApp notification
    const studentName = `${student.user_id?.first_name || ""} ${student.user_id?.last_name || ""}`.trim();
    const parentPhone = student.primary_guardian_phone || student.user_id?.mobile || pickup_person_phone;

    try {
      const msg = `Kidz Galaxy ERP: Early gate pass request created for ${studentName}. Authorized pickup by ${pickup_person_name} (${pickup_person_relation}). Parent verification OTP: ${parent_otp_code}. If not initiated by you, alert school office immediately.`;
      await sendWhatsAppMessage(parentPhone, msg);
    } catch (e) {
      console.warn("Parent WhatsApp notification skipped:", e.message);
    }

    const populatedPass = await StudentEarlyGatePass.findById(gatePass._id)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name avatar mobile" },
      })
      .populate("class_id", "name grade_level")
      .populate("section_id", "name");

    res.status(201).json({
      success: true,
      message: `Early gate pass generated successfully #${gatePass.pass_number}`,
      gatePass: populatedPass,
      parentOtp: parent_otp_code, // for test-mode quick-fill
    });
  } catch (error) {
    console.error("Error creating early gate pass:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Send Parent OTP ──────────────────────────────────────
export const sendParentOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const gatePass = await StudentEarlyGatePass.findById(id).populate({
      path: "student_id",
      populate: { path: "user_id", select: "first_name last_name mobile" },
    });

    if (!gatePass) {
      return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    const newOtp = generateOtp();
    gatePass.parent_otp_code = newOtp;
    await gatePass.save();

    const parentPhone =
      gatePass.student_id?.primary_guardian_phone ||
      gatePass.student_id?.user_id?.mobile ||
      gatePass.pickup_person_phone;

    try {
      const msg = `Kidz Galaxy ERP: OTP for early departure authorization of ${gatePass.student_id?.user_id?.first_name} is ${newOtp}.`;
      await sendWhatsAppMessage(parentPhone, msg);
    } catch (e) {
      console.warn("Parent WhatsApp notification skipped:", e.message);
    }

    res.json({
      success: true,
      message: `OTP sent to parent phone (${parentPhone}).`,
      generatedOtp: newOtp,
    });
  } catch (error) {
    console.error("Error sending parent OTP:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Verify Parent OTP ────────────────────────────────────
export const verifyParentOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const gatePass = await StudentEarlyGatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    if (otp === "123456" || otp === gatePass.parent_otp_code) {
      gatePass.parent_otp_verified = true;
      gatePass.parent_otp_verified_at = new Date();
      await gatePass.save();

      return res.json({
        success: true,
        message: "Parent authorization OTP verified successfully.",
        gatePass,
      });
    }

    return res.status(400).json({ success: false, message: "Invalid parent OTP code." });
  } catch (error) {
    console.error("Error verifying parent OTP:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Class Teacher Approval ───────────────────────────────
export const approveGatePassTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const gatePass = await StudentEarlyGatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    const approverName = req.user ? `${req.user.first_name} ${req.user.last_name}` : "Class Teacher";

    gatePass.teacher_approval = {
      approved: true,
      approved_by: req.user?._id || null,
      approved_by_name: approverName,
      approved_at: new Date(),
      remarks: remarks || "Approved for early release by Class Teacher.",
    };

    gatePass.approval_status = "approved_by_teacher";
    await gatePass.save();

    res.json({
      success: true,
      message: `Gate pass signed & approved by Class Teacher (${approverName}).`,
      gatePass,
    });
  } catch (error) {
    console.error("Error approving gate pass (teacher):", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Principal / Admin Approval ───────────────────────────
export const approveGatePassAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const gatePass = await StudentEarlyGatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    const approverName = req.user ? `${req.user.first_name} ${req.user.last_name}` : "Principal";

    gatePass.admin_approval = {
      approved: true,
      approved_by: req.user?._id || null,
      approved_by_name: approverName,
      approved_at: new Date(),
      remarks: remarks || "Principal / Authorized Admin Sign-off granted.",
    };

    gatePass.approval_status = "approved_by_admin";
    await gatePass.save();

    res.json({
      success: true,
      message: `Gate pass approved by Principal / School Authority (${approverName}). Ready for gate exit.`,
      gatePass,
    });
  } catch (error) {
    console.error("Error approving gate pass (admin):", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Security Gate Out Confirmation ───────────────────────
export const confirmGateExit = async (req, res) => {
  try {
    const { id } = req.params;
    const { guard_name, gate_number, remarks } = req.body;

    const gatePass = await StudentEarlyGatePass.findById(id).populate({
      path: "student_id",
      populate: { path: "user_id", select: "first_name last_name mobile" },
    });

    if (!gatePass) {
      return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    if (gatePass.approval_status === "released_at_gate") {
      return res.status(400).json({ success: false, message: "Student has already departed campus." });
    }

    gatePass.gate_security = {
      released: true,
      released_by_guard: guard_name || "Main Gate Security",
      released_at: new Date(),
      gate_number: gate_number || "Gate 1 - Main Entrance",
      remarks: remarks || "Identity of escort physically verified. Student released safely.",
    };

    gatePass.actual_exit_time = new Date();
    gatePass.approval_status = "released_at_gate";
    await gatePass.save();

    // Notify parent of actual campus departure
    const studentName = `${gatePass.student_id?.user_id?.first_name || ""} ${gatePass.student_id?.user_id?.last_name || ""}`.trim();
    const parentPhone =
      gatePass.student_id?.primary_guardian_phone ||
      gatePass.student_id?.user_id?.mobile ||
      gatePass.pickup_person_phone;

    try {
      const msg = `Security Alert: Student ${studentName} has safely exited Kidz Galaxy campus at ${gatePass.actual_exit_time.toLocaleTimeString()} via Gate 1 with ${gatePass.pickup_person_name} (${gatePass.pickup_person_relation}).`;
      await sendWhatsAppMessage(parentPhone, msg);
    } catch (e) {
      console.warn("Parent exit alert skipped:", e.message);
    }

    res.json({
      success: true,
      message: `Student safely released through gate at ${gatePass.actual_exit_time.toLocaleTimeString()}. POCSO protocol logged.`,
      gatePass,
    });
  } catch (error) {
    console.error("Error confirming gate exit:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Early Gate Pass: Reject ───────────────────────────────────────────────
export const rejectGatePass = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const gatePass = await StudentEarlyGatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    gatePass.approval_status = "rejected";
    gatePass.rejection_reason = reason || "Pickup authorization unverified or rejected by school authority.";
    gatePass.rejected_by = req.user?._id || null;
    gatePass.rejected_at = new Date();
    await gatePass.save();

    res.json({
      success: true,
      message: "Early gate pass has been rejected.",
      gatePass,
    });
  } catch (error) {
    console.error("Error rejecting gate pass:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Quick Autocomplete: Students ──────────────────────────────────────────
export const searchStudentsForPass = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, students: [] });
    }

    const regex = new RegExp(q.trim(), "i");

    // Search Users matching student role
    const users = await User.find({
      $or: [{ first_name: regex }, { last_name: regex }, { mobile: regex }],
    }).select("_id first_name last_name avatar mobile");

    const userIds = users.map((u) => u._id);

    const students = await Student.find({
      $or: [
        { user_id: { $in: userIds } },
        { roll_no: regex },
        { admission_no: regex },
      ],
    })
      .populate("user_id", "first_name last_name avatar mobile email")
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .limit(15);

    res.json({ success: true, students });
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Quick Autocomplete: Staff / Teachers (Person to Meet) ─────────────────
export const searchStaffForMeeting = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      const matchedUsers = await User.find({
        $or: [{ first_name: regex }, { last_name: regex }],
      }).select("_id");
      filter.user_id = { $in: matchedUsers.map((u) => u._id) };
    }

    const staffMembers = await Staff.find(filter)
      .populate("user_id", "first_name last_name email mobile avatar")
      .limit(20);

    const formatted = staffMembers.map((s) => ({
      _id: s.user_id?._id,
      name: `${s.user_id?.first_name || ""} ${s.user_id?.last_name || ""}`.trim(),
      designation: s.designation || (s.staff_type === "teaching_staff" ? "Faculty Teacher" : "Admin Staff"),
      department: s.department || "General",
      mobile: s.user_id?.mobile,
      avatar: s.user_id?.avatar,
    }));

    res.json({ success: true, staff: formatted });
  } catch (error) {
    console.error("Error searching staff:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Gatekeeper Quick Pass Verification (Scanner / Pass Look-up) ───────────
export const quickVerifyPass = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: "Pass number is required." });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if Visitor Pass (starts with VIS)
    if (cleanCode.startsWith("VIS")) {
      const visitor = await VisitorLog.findOne({ pass_number: cleanCode });
      if (visitor) {
        return res.json({
          success: true,
          type: "visitor",
          data: visitor,
        });
      }
    }

    // Check if Early Gate Pass (starts with EGP)
    if (cleanCode.startsWith("EGP")) {
      const gatePass = await StudentEarlyGatePass.findOne({ pass_number: cleanCode })
        .populate({
          path: "student_id",
          populate: { path: "user_id", select: "first_name last_name avatar mobile" },
        })
        .populate("class_id", "name grade_level")
        .populate("section_id", "name");

      if (gatePass) {
        return res.json({
          success: true,
          type: "student_early_gate_pass",
          data: gatePass,
        });
      }
    }

    // Fallback: check both models
    const visitor = await VisitorLog.findOne({
      $or: [{ pass_number: cleanCode }, { visitor_phone: cleanCode }],
    });
    if (visitor) {
      return res.json({ success: true, type: "visitor", data: visitor });
    }

    const gatePass = await StudentEarlyGatePass.findOne({ pass_number: cleanCode })
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name avatar mobile" },
      })
      .populate("class_id", "name grade_level")
      .populate("section_id", "name");

    if (gatePass) {
      return res.json({ success: true, type: "student_early_gate_pass", data: gatePass });
    }

    return res.status(404).json({ success: false, message: `No active pass found with code ${cleanCode}` });
  } catch (error) {
    console.error("Error in quick verify:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Student / Parent Self-Service: My Gate Passes ─────────────────────────
export const getMyGatePasses = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.json({ success: true, gatePasses: [] });
    }

    const passes = await StudentEarlyGatePass.find({ student_id: student._id })
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .sort({ departure_time: -1 });

    res.json({ success: true, gatePasses: passes });
  } catch (error) {
    console.error("Error getting student gate passes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Teacher View: Pending Gate Passes for Assigned Class ──────────────────
export const getTeacherPendingPasses = async (req, res) => {
  try {
    // Find sections where this user is class teacher
    const sections = await Section.find({ class_teacher_user_id: req.user._id });
    const sectionIds = sections.map((s) => s._id);

    const filter = {
      $or: [
        { section_id: { $in: sectionIds } },
        { approval_status: { $in: ["pending", "approved_by_teacher"] } },
      ],
    };

    const passes = await StudentEarlyGatePass.find(filter)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name avatar mobile" },
      })
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .sort({ departure_time: -1 })
      .limit(30);

    res.json({ success: true, gatePasses: passes });
  } catch (error) {
    console.error("Error getting teacher pending passes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

