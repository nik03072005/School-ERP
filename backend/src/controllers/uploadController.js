import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const guessExtension = (mimeType = "") => {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
};

const MEDIA_EXT_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
  "audio/x-m4a": "m4a",
  "audio/mp4": "m4a",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

const guessMediaExtension = (mimeType = "") => MEDIA_EXT_MAP[mimeType] || "bin";

const slug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const buildR2Client = () => {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured in backend environment");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
};

// @desc    Upload avatar to R2 via backend proxy
// @route   POST /api/uploads/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const bucket = process.env.R2_BUCKET;
    const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

    const missing = [];
    if (!bucket) missing.push("R2_BUCKET");
    if (!publicBase) missing.push("R2_PUBLIC_BASE_URL");

    if (missing.length) {
      return res.status(500).json({
        message: "R2 upload config is incomplete",
        missing,
      });
    }

    const client = buildR2Client();

    const ownerName = req.body.ownerName || req.user?.first_name || "user";
    const ext = guessExtension(req.file.mimetype);
    const key = `avatars/${slug(ownerName) || "user"}-${Date.now()}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "application/octet-stream",
      })
    );

    const url = `${publicBase}/${key}`;
    return res.status(201).json({ message: "Avatar uploaded", url, key });
  } catch (error) {
    return res.status(500).json({ message: "Avatar upload failed", error: error.message });
  }
};

// @desc    Upload an image or video to R2
// @route   POST /api/uploads/media
// @access  Private
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const bucket = process.env.R2_BUCKET;
    const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

    const missing = [];
    if (!bucket) missing.push("R2_BUCKET");
    if (!publicBase) missing.push("R2_PUBLIC_BASE_URL");
    if (missing.length) {
      return res.status(500).json({ message: "R2 upload config is incomplete", missing });
    }

    const client = buildR2Client();

    const mime = req.file.mimetype;
    const isVideo = mime.startsWith("video/");
    const isAudio = mime.startsWith("audio/");
    const isDoc = mime.startsWith("application/");
    const folder = isVideo ? "videos" : isAudio ? "audio" : isDoc ? "docs" : "images";
    const mediaType = isVideo ? "video" : isAudio ? "audio" : isDoc ? "document" : "image";
    const ext = guessMediaExtension(mime);
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: mime || "application/octet-stream",
      })
    );

    const url = `${publicBase}/${key}`;
    return res.status(201).json({
      message: "Media uploaded",
      url,
      key,
      type: mediaType,
      mimeType: mime,
      size: req.file.size,
      filename: req.file.originalname,
    });
  } catch (error) {
    return res.status(500).json({ message: "Media upload failed", error: error.message });
  }
};
