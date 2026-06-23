import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const learningContentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    class_ids: [{ type: ObjectId, ref: "Class" }],
    subject: { type: String, trim: true },
    content_type: {
      type: String,
      enum: ["video", "audio", "image", "document"],
      required: true,
    },
    media_url: { type: String, required: true },
    media_key: { type: String },
    mime_type: { type: String },
    file_size: { type: Number },
    duration: { type: Number }, // seconds
    tags: [{ type: String, trim: true }],
    is_published: { type: Boolean, default: false },
    created_by: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

learningContentSchema.index({ is_published: 1, content_type: 1 });
learningContentSchema.index({ class_ids: 1, is_published: 1 });

const LearningContent = mongoose.model("LearningContent", learningContentSchema);
export default LearningContent;
