import express from "express";
import {
  getSyllabusBySubject,
  listSyllabusByClass,
  addChapter,
  updateChapter,
  updateChapterProgress,
  deleteChapter,
  seedDefaultChapters,
} from "../controllers/syllabusController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/subject/:subjectId", getSyllabusBySubject);
router.get("/class/:classId", listSyllabusByClass);

// Chapter management and progress updates (Admin & Teaching Staff)
router.post("/:id/chapters", authorize("admin", "teaching_staff"), addChapter);
router.put("/:id/chapters/:chapterId", authorize("admin", "teaching_staff"), updateChapter);
router.patch(
  "/:id/chapters/:chapterId/progress",
  authorize("admin", "teaching_staff"),
  updateChapterProgress
);
router.delete(
  "/:id/chapters/:chapterId",
  authorize("admin", "teaching_staff"),
  deleteChapter
);
router.post(
  "/seed-chapters/:subjectId",
  authorize("admin", "teaching_staff"),
  seedDefaultChapters
);

export default router;

