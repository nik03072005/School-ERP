import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getStudentTCData,
  createTC,
  listTCs,
  getTCById,
  cancelTC,
} from "../controllers/transferCertificateController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/prefill/:studentId", getStudentTCData);
router.post("/", createTC);
router.get("/", listTCs);
router.get("/:id", getTCById);
router.patch("/:id/cancel", cancelTC);

export default router;

