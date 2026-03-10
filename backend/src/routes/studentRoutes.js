import express from "express";
import { getMyAdmissionForm, submitAdmissionForm } from "../controllers/studentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/admission", getMyAdmissionForm);
router.post("/admission", submitAdmissionForm);

export default router;
