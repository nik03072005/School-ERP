import express from "express";
import {
  login,
  getMe,
  logout,
  changePassword,
  forgotPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.patch("/change-password", protect, changePassword);

export default router;
