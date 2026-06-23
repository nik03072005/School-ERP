import express from "express";
import { getMyAdmissionForm, getUpcomingBirthdays } from "../controllers/studentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Birthdays accessible to all authenticated users (student, teacher, admin)
router.get("/birthdays", getUpcomingBirthdays);

// Student-only routes
router.get("/admission", authorize("student"), getMyAdmissionForm);

export default router;
