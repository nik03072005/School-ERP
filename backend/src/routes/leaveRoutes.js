import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { applyLeave, getMyLeaves, getAllLeaves, reviewLeave, cancelLeave } from "../controllers/leaveController.js";

const router = express.Router();

router.use(protect);

// Any authenticated user can apply for leave and view their own
router.post("/", applyLeave);
router.get("/mine", getMyLeaves);
router.patch("/:id/cancel", cancelLeave);

// Admin only: view all, approve/reject
router.get("/", authorize("admin"), getAllLeaves);
router.patch("/:id/review", authorize("admin"), reviewLeave);

export default router;
