import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createNotice,
  updateNotice,
  deleteNotice,
  getNotices,
  getAllNotices,
} from "../controllers/noticeController.js";

const router = express.Router();

router.use(protect);

// All authenticated users: active notices filtered by their role
router.get("/", getNotices);

// Admin: all notices including expired/inactive
router.get("/all", authorize("admin"), getAllNotices);

// Admin / teacher: create & update
router.post("/", authorize("admin", "teaching_staff"), createNotice);
router.put("/:id", authorize("admin", "teaching_staff"), updateNotice);

// Admin only: delete
router.delete("/:id", authorize("admin"), deleteNotice);

export default router;
