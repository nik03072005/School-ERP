import express from "express";
import multer from "multer";
import { uploadAvatar, uploadMedia } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    return cb(null, true);
  },
});

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
]);

const ALLOWED_LEARNING_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac",
  "audio/x-m4a", "audio/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MEDIA_TYPES.has(file.mimetype)) {
      return cb(new Error("Only images and videos are allowed"));
    }
    return cb(null, true);
  },
});

const learningUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_LEARNING_TYPES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type for learning content"));
    }
    return cb(null, true);
  },
});

router.post("/avatar", protect, avatarUpload.single("file"), uploadAvatar);
router.post("/media", protect, mediaUpload.single("file"), uploadMedia);
router.post("/learning", protect, learningUpload.single("file"), uploadMedia);

export default router;
