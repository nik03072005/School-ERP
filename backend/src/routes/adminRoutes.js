import express from "express";
import {
  createUser,
  getAllUsers,
  getPendingUsers,
  getUserById,
  approveUser,
  rejectUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getPendingAdmissions,
  getStudentAdmission,
  getStudentAdmissionByUser,
  upsertStudentAdmission,
  approveAdmission,
  rejectAdmission,
  getStaffByUser,
  upsertStaffByUser,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

// User account routes
router.post("/users", createUser);
router.get("/users", getAllUsers);
router.get("/users/pending", getPendingUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/reject", rejectUser);
router.patch("/users/:id/deactivate", deactivateUser);
router.patch("/users/:id/activate", activateUser);
router.delete("/users/:id", deleteUser);

// Admission form routes
router.get("/admissions/pending", getPendingAdmissions);
router.get("/admissions/by-user/:userId", getStudentAdmissionByUser);
router.get("/admissions/:studentId", getStudentAdmission);
router.put("/admissions/:studentId", upsertStudentAdmission);
router.patch("/admissions/:studentId/approve", approveAdmission);
router.patch("/admissions/:studentId/reject", rejectAdmission);

// Staff detail routes
router.get("/staff/by-user/:userId", getStaffByUser);
router.put("/staff/by-user/:userId", upsertStaffByUser);

export default router;
