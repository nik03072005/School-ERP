import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  upsertReport,
  batchUpsertReports,
  getMyReports,
  getExamReport,
  publishReports,
} from "../controllers/progressReportController.js";

const router = express.Router();
router.use(protect);

router.get("/mine", getMyReports);
router.post("/", authorize("teaching_staff", "admin"), upsertReport);
router.post("/batch", authorize("teaching_staff", "admin"), batchUpsertReports);
router.get("/exam/:examId", authorize("teaching_staff", "admin"), getExamReport);
router.patch("/exam/:examId/publish", authorize("admin"), publishReports);

export default router;
