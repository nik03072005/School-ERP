import ParentNote from "../models/ParentNote.js";
import { createNotification } from "./notificationController.js";
import User from "../models/User.js";

// @desc    Submit a parent note / query
// @route   POST /api/parent-notes
// @access  Private (student role = parent/guardian)
export const submitNote = async (req, res) => {
  try {
    const { subject, message, attachments, student } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const note = await ParentNote.create({
      parent: req.user._id,
      student: student || null,
      subject: subject.trim(),
      message: message.trim(),
      attachments: attachments || [],
    });

    // Notify all admins of new query
    const admins = await User.find({ status: "approved", is_active: true }, "_id")
      .populate({ path: "role_id", match: { name: "admin" } })
      .lean();

    const adminIds = admins.filter((u) => u.role_id).map((u) => u._id);
    await Promise.allSettled(
      adminIds.map((id) =>
        createNotification({
          userId: id,
          type: "general",
          title: "New Parent Query",
          message: `${req.user.first_name} ${req.user.last_name}: "${subject.trim().slice(0, 60)}"`,
          data: { noteId: note._id },
        })
      )
    );

    res.status(201).json({ message: "Note submitted", note });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit note", error: error.message });
  }
};

// @desc    Get parent's own notes
// @route   GET /api/parent-notes/mine
// @access  Private
export const getMyNotes = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { parent: req.user._id };
    if (status) filter.status = status;

    const notes = await ParentNote.find(filter)
      .populate("replies.replied_by", "first_name last_name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notes", error: error.message });
  }
};

// @desc    Get all parent notes (admin/teacher view)
// @route   GET /api/parent-notes
// @access  Private (admin, teaching_staff)
export const getAllNotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [notes, total] = await Promise.all([
      ParentNote.find(filter)
        .populate("parent", "first_name last_name email mobile")
        .populate("replies.replied_by", "first_name last_name")
        .sort({ status: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ParentNote.countDocuments(filter),
    ]);

    res.json({ notes, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notes", error: error.message });
  }
};

// @desc    Reply to a parent note and update status
// @route   PATCH /api/parent-notes/:id/reply
// @access  Private (admin, teaching_staff)
export const replyToNote = async (req, res) => {
  try {
    const { message, status } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Reply message is required" });

    const note = await ParentNote.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          replies: { replied_by: req.user._id, message: message.trim(), created_at: new Date() },
        },
        $set: { status: status || "in_progress" },
      },
      { new: true }
    ).populate("parent", "first_name last_name");

    if (!note) return res.status(404).json({ message: "Note not found" });

    // Notify parent
    createNotification({
      userId: note.parent._id,
      type: "general",
      title: "Reply to Your Query",
      message: `Your query "${note.subject.slice(0, 60)}" received a reply.`,
      data: { noteId: note._id },
    }).catch(() => {});

    res.json({ message: "Reply sent", note });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reply", error: error.message });
  }
};

// @desc    Update note status (admin)
// @route   PATCH /api/parent-notes/:id/status
// @access  Private (admin)
export const updateNoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const note = await ParentNote.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Status updated", note });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};
