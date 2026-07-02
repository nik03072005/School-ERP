import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getFeeHeads,
  createFeeHead,
  updateFeeHead,
  deleteFeeHead,
  getFeeStructures,
  getFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  archiveFeeStructure,
  cloneFeeStructure,
} from "../controllers/feeStructureController.js";
import {
  assignFeeStructure,
  addDiscount,
  getStudentFee,
  getMyFee,
  getDues,
  getFeeSummary,
  sendFeeReminder,
} from "../controllers/studentFeeController.js";
import {
  recordPayment,
  listPayments,
  getMyPayments,
  getPayment,
  cancelPayment,
} from "../controllers/feePaymentController.js";

const router = express.Router();

router.use(protect);

// Student self-service (must come before admin-only wildcard-ish routes)
router.get("/my", getMyFee);
router.get("/payments/mine", getMyPayments);

// Fee heads
router.get("/heads", authorize("admin"), getFeeHeads);
router.post("/heads", authorize("admin"), createFeeHead);
router.put("/heads/:id", authorize("admin"), updateFeeHead);
router.delete("/heads/:id", authorize("admin"), deleteFeeHead);

// Fee structures
router.get("/structures", authorize("admin"), getFeeStructures);
router.post("/structures", authorize("admin"), createFeeStructure);
router.get("/structures/:id", authorize("admin"), getFeeStructure);
router.put("/structures/:id", authorize("admin"), updateFeeStructure);
router.delete("/structures/:id", authorize("admin"), archiveFeeStructure);
router.post("/structures/:id/clone", authorize("admin"), cloneFeeStructure);

// Assignment, discounts, dues, summary, reminders
router.post("/assign", authorize("admin"), assignFeeStructure);
router.post("/:studentFeeId/discount", authorize("admin"), addDiscount);
router.post("/:studentFeeId/reminder", authorize("admin"), sendFeeReminder);
router.get("/dues", authorize("admin"), getDues);
router.get("/summary", authorize("admin"), getFeeSummary);
router.get("/student/:studentId", authorize("admin"), getStudentFee);

// Payments
router.post("/payments", authorize("admin"), recordPayment);
router.get("/payments", authorize("admin"), listPayments);
router.get("/payments/:id", getPayment); // access check for non-admin done inside controller
router.post("/payments/:id/cancel", authorize("admin"), cancelPayment);

export default router;
