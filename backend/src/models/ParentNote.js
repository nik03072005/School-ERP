import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  { url: { type: String, required: true }, type: { type: String, enum: ["image", "video"] }, filename: String },
  { _id: false }
);

const replySchema = new mongoose.Schema(
  {
    replied_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const parentNoteSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    attachments: { type: [attachmentSchema], default: [] },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true }
);

parentNoteSchema.index({ parent: 1, status: 1 });
parentNoteSchema.index({ status: 1, createdAt: -1 });

const ParentNote = mongoose.model("ParentNote", parentNoteSchema);
export default ParentNote;
