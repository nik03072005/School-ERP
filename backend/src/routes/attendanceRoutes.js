import express from "express";
import {
  markStudentAttendanceBulk,
  getStudentAttendanceDaily,
  getStudentAttendanceSummary,
  getMyStudentAttendance,
  markStaffAttendanceBulk,
  getStaffAttendanceDaily,
  exportStudentAttendanceCsv,
  exportStaffAttendanceCsv,
  correctStudentAttendance,
  correctStaffAttendance,
  listAttendanceAudits,
} from "../controllers/attendanceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/students/me", getMyStudentAttendance);

router.post("/students/mark-bulk", authorize("admin", "teaching_staff"), markStudentAttendanceBulk);
router.get("/students/daily", authorize("admin", "teaching_staff"), getStudentAttendanceDaily);
router.get("/students/summary", authorize("admin", "teaching_staff"), getStudentAttendanceSummary);
router.get("/students/export-csv", authorize("admin", "teaching_staff"), exportStudentAttendanceCsv);
router.patch("/students/:attendanceId/correct", authorize("admin", "teaching_staff"), correctStudentAttendance);

router.post("/staff/mark-bulk", authorize("admin"), markStaffAttendanceBulk);
router.get("/staff/daily", authorize("admin"), getStaffAttendanceDaily);
router.get("/staff/export-csv", authorize("admin"), exportStaffAttendanceCsv);
router.patch("/staff/:attendanceId/correct", authorize("admin"), correctStaffAttendance);

router.get("/audit", authorize("admin"), listAttendanceAudits);

export default router;
