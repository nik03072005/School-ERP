import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  { url: { type: String, required: true }, type: { type: String, enum: ["image", "video"] }, filename: String },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["general", "event", "exam", "fee", "holiday", "emergency"],
      default: "general",
    },
    target_audience: {
      type: String,
      enum: ["all", "students", "staff", "parents"],
      default: "all",
    },
    target_classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    attachments: { type: [attachmentSchema], default: [] },
    is_pinned: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    published_at: { type: Date, default: Date.now },
    expires_at: { type: Date, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

noticeSchema.index({ is_active: 1, published_at: -1 });

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;
