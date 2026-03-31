import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const guessExtension = (mimeType = "") => {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
};

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
