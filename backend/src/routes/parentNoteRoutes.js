import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  submitNote,
  getMyNotes,
  getAllNotes,
  replyToNote,
  updateNoteStatus,
} from "../controllers/parentNoteController.js";

const router = express.Router();

router.use(protect);

// Any authenticated user can submit notes and view their own
router.post("/", submitNote);
router.get("/mine", getMyNotes);

// Admin / teaching_staff: view all, reply, change status
router.get("/", authorize("admin", "teaching_staff"), getAllNotes);
router.patch("/:id/reply", authorize("admin", "teaching_staff"), replyToNote);
router.patch("/:id/status", authorize("admin"), updateNoteStatus);

export default router;
