import express from "express";
import { getMyAdmissionForm } from "../controllers/studentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/admission", getMyAdmissionForm);

export default router;
