import mongoose from "mongoose";

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacher_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    assigned_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

teacherAssignmentSchema.index({ teacher_user_id: 1, class_id: 1, section_id: 1 }, { unique: true });
teacherAssignmentSchema.index({ class_id: 1, section_id: 1, is_active: 1 });

const TeacherAssignment = mongoose.model("TeacherAssignment", teacherAssignmentSchema);

export default TeacherAssignment;
