import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getContent,
  getMyContent,
  getContentById,
  createContent,
  updateContent,
  togglePublish,
  deleteContent,
} from "../controllers/learningController.js";

const router = express.Router();
router.use(protect);

router.get("/", getContent);
router.get("/mine", authorize("teaching_staff", "admin"), getMyContent);
router.get("/:id", getContentById);
router.post("/", authorize("teaching_staff", "admin"), createContent);
router.put("/:id", authorize("teaching_staff", "admin"), updateContent);
router.patch("/:id/publish", authorize("admin"), togglePublish);
router.delete("/:id", authorize("teaching_staff", "admin"), deleteContent);

export default router;
