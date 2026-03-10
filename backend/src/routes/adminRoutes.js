import express from "express";
import {
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
  approveAdmission,
  rejectAdmission,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

// User account routes
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
router.get("/admissions/:studentId", getStudentAdmission);
router.patch("/admissions/:studentId/approve", approveAdmission);
router.patch("/admissions/:studentId/reject", rejectAdmission);

export default router;
