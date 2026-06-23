import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
} from "../controllers/examScheduleController.js";

const router = express.Router();
router.use(protect);

router.get("/", getExams);
router.get("/:id", getExam);
router.post("/", authorize("admin"), createExam);
router.put("/:id", authorize("admin"), updateExam);
router.delete("/:id", authorize("admin"), deleteExam);

export default router;
