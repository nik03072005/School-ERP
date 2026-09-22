import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getSecurityStats,
  getVisitors,
  createVisitor,
  sendVisitorOtp,
  verifyVisitorOtp,
  checkOutVisitor,
  recordVisitorBadgePrint,
  getGatePasses,
  createGatePass,
  sendParentOtp,
  verifyParentOtp,
  approveGatePassTeacher,
  approveGatePassAdmin,
  confirmGateExit,
  rejectGatePass,
  searchStudentsForPass,
  searchStaffForMeeting,
  quickVerifyPass,
  getMyGatePasses,
  getTeacherPendingPasses,
} from "../controllers/visitorGatePassController.js";

const router = express.Router();

router.use(protect);

// ── Overview & Stats ──
router.get(
  "/stats",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  getSecurityStats
);

// ── Visitor Logbook Routes ──
router.get(
  "/visitors",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  getVisitors
);
router.post(
  "/visitors",
  authorize("admin", "non_teaching_staff"),
  createVisitor
);
router.post(
  "/visitors/:id/send-otp",
  authorize("admin", "non_teaching_staff"),
  sendVisitorOtp
);
router.post(
  "/visitors/:id/verify-otp",
  authorize("admin", "non_teaching_staff"),
  verifyVisitorOtp
);
router.post(
  "/visitors/:id/checkout",
  authorize("admin", "non_teaching_staff"),
  checkOutVisitor
);
router.post(
  "/visitors/:id/print-badge",
  authorize("admin", "non_teaching_staff"),
  recordVisitorBadgePrint
);

// ── Student Early Gate Pass Routes ──
router.get(
  "/gate-passes",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  getGatePasses
);
router.post(
  "/gate-passes",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  createGatePass
);
router.post(
  "/gate-passes/:id/send-parent-otp",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  sendParentOtp
);
router.post(
  "/gate-passes/:id/verify-parent-otp",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  verifyParentOtp
);
router.post(
  "/gate-passes/:id/approve-teacher",
  authorize("admin", "teaching_staff"),
  approveGatePassTeacher
);
router.post(
  "/gate-passes/:id/approve-admin",
  authorize("admin"),
  approveGatePassAdmin
);
router.post(
  "/gate-passes/:id/gate-exit",
  authorize("admin", "non_teaching_staff"),
  confirmGateExit
);
router.post(
  "/gate-passes/:id/reject",
  authorize("admin", "teaching_staff"),
  rejectGatePass
);

// ── Lookups & Scanner ──
router.get(
  "/search-students",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  searchStudentsForPass
);
router.get(
  "/search-staff",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  searchStaffForMeeting
);
router.get(
  "/quick-verify/:code",
  authorize("admin", "teaching_staff", "non_teaching_staff"),
  quickVerifyPass
);

// ── Teacher specific queue ──
router.get(
  "/teacher-passes",
  authorize("admin", "teaching_staff"),
  getTeacherPendingPasses
);

// ── Student / Parent self-service ──
router.get(
  "/my-passes",
  authorize("student"),
  getMyGatePasses
);

export default router;

