import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getTransportSummary,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getAllocations,
  allocateStudent,
  bulkAllocateStudents,
  cancelAllocation,
  getUnallocatedStudents,
  getRouteManifest,
  getMyTransport,
} from "../controllers/transportController.js";

const router = express.Router();

router.use(protect);

// Student self-service
router.get("/my", getMyTransport);

// Overview summary
router.get("/summary", authorize("admin", "teaching_staff", "non_teaching_staff"), getTransportSummary);

// Vehicle fleet routes
router.get("/vehicles", authorize("admin", "teaching_staff", "non_teaching_staff"), getVehicles);
router.post("/vehicles", authorize("admin"), createVehicle);
router.put("/vehicles/:id", authorize("admin"), updateVehicle);
router.delete("/vehicles/:id", authorize("admin"), deleteVehicle);

// Transport route and stops
router.get("/routes", authorize("admin", "teaching_staff", "non_teaching_staff"), getRoutes);
router.get("/routes/:id", authorize("admin", "teaching_staff", "non_teaching_staff"), getRouteById);
router.post("/routes", authorize("admin"), createRoute);
router.put("/routes/:id", authorize("admin"), updateRoute);
router.delete("/routes/:id", authorize("admin"), deleteRoute);
router.get("/routes/:routeId/manifest", authorize("admin", "teaching_staff", "non_teaching_staff"), getRouteManifest);

// Student allocations
router.get("/allocations", authorize("admin", "teaching_staff", "non_teaching_staff"), getAllocations);
router.post("/allocations", authorize("admin"), allocateStudent);
router.post("/allocations/bulk", authorize("admin"), bulkAllocateStudents);
router.post("/allocations/:id/cancel", authorize("admin"), cancelAllocation);
router.get("/unallocated-students", authorize("admin"), getUnallocatedStudents);

export default router;

