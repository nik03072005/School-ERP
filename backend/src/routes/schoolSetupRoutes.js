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
  createTimetableEntry,
  listTimetableEntries,
  listTeacherTimetable,
} from "../controllers/schoolSetupController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/classes", authorize("admin"), createClass);
router.get("/classes", authorize("admin", "teaching_staff"), listClasses);
router.patch("/classes/:classId", authorize("admin"), updateClass);

router.post("/sections", authorize("admin"), createSection);
router.get("/sections", authorize("admin", "teaching_staff"), listSections);
router.patch("/sections/:sectionId", authorize("admin"), updateSection);
router.patch("/sections/:sectionId/assign-class-teacher", authorize("admin"), assignClassTeacher);

router.post("/periods", authorize("admin"), createPeriod);
router.get("/periods", authorize("admin"), listPeriods);
router.patch("/periods/:periodId", authorize("admin"), updatePeriod);

router.post("/timetable", authorize("admin"), createTimetableEntry);
router.get("/timetable", authorize("admin"), listTimetableEntries);
router.get("/timetable/teacher", authorize("admin"), listTeacherTimetable);

export default router;
