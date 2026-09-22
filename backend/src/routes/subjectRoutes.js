import express from "express";
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getPresets,
  seedPresetsForClass,
} from "../controllers/subjectController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/presets", getPresets);
router.post("/seed-presets", authorize("admin"), seedPresetsForClass);

router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.post("/", authorize("admin"), createSubject);
router.put("/:id", authorize("admin"), updateSubject);
router.delete("/:id", authorize("admin"), deleteSubject);

export default router;

