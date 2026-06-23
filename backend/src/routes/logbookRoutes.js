import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  upsertEntry,
  getEntriesByDate,
  getAllEntries,
  getMyEntries,
  deleteEntry,
} from "../controllers/logbookController.js";

const router = express.Router();

router.use(protect);

// Student / parent: published entries for their class on a date
router.get("/", getEntriesByDate);

// Teacher: their own entries
router.get("/mine", authorize("teaching_staff", "admin"), getMyEntries);

// Admin: all entries
router.get("/all", authorize("admin"), getAllEntries);

// Teacher / admin: create or update entry
router.post("/", authorize("teaching_staff", "admin"), upsertEntry);

// Admin only: delete
router.delete("/:id", authorize("admin"), deleteEntry);

export default router;
