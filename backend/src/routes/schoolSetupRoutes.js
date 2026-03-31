import express from "express";
import {
  createClass,
  listClasses,
  updateClass,
  createSection,
  listSections,
  updateSection,
  assignClassTeacher,
  createPeriod,
  listPeriods,
  updatePeriod,
  createTeacherAssignment,
  listTeacherAssignments,
  deactivateTeacherAssignment,
} from "../controllers/schoolSetupController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.post("/classes", createClass);
router.get("/classes", listClasses);
router.patch("/classes/:classId", updateClass);

router.post("/sections", createSection);
router.get("/sections", listSections);
router.patch("/sections/:sectionId", updateSection);
router.patch("/sections/:sectionId/assign-class-teacher", assignClassTeacher);

router.post("/periods", createPeriod);
router.get("/periods", listPeriods);
router.patch("/periods/:periodId", updatePeriod);

router.post("/teacher-assignments", createTeacherAssignment);
router.get("/teacher-assignments", listTeacherAssignments);
router.patch("/teacher-assignments/:assignmentId/deactivate", deactivateTeacherAssignment);

export default router;
