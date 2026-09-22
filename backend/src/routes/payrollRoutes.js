import express from "express";
import {
  runOrRecalculatePayrollBatch,
  listPayrollBatches,
  getPayrollBatchById,
  updatePayrollBatchStatus,
  updateSalarySlip,
  getSalarySlipById,
  getMyPayslips,
  exportBankPayout,
} from "../controllers/payrollController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Self-service for teachers & staff to view their personal salary slips
router.get("/slips/my-slips", getMyPayslips);
router.get("/slips/:slipId", getSalarySlipById);

// Admin-only HRMS payroll management endpoints
router.post("/run", authorize("admin"), runOrRecalculatePayrollBatch);
router.get("/batches", authorize("admin"), listPayrollBatches);
router.get("/batches/:batchId", authorize("admin"), getPayrollBatchById);
router.patch("/batches/:batchId/status", authorize("admin"), updatePayrollBatchStatus);
router.patch("/slips/:slipId", authorize("admin"), updateSalarySlip);
router.get("/batches/:batchId/export-bank/:bankCode", authorize("admin"), exportBankPayout);

export default router;

