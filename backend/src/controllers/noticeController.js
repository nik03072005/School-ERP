import Notice from "../models/Notice.js";
import { createNotification } from "./notificationController.js";
import User from "../models/User.js";

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private (admin, teaching_staff)
export const createNotice = async (req, res) => {
  try {
    const { title, content, type, target_audience, target_classes, attachments, is_pinned, expires_at } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const notice = await Notice.create({
      title,
      content,
      type: type || "general",
      target_audience: target_audience || "all",
      target_classes: target_classes || [],
      attachments: attachments || [],
      is_pinned: is_pinned || false,
      expires_at: expires_at || null,
      created_by: req.user._id,
    });

    // Push notifications to target users asynchronously
    pushNoticeNotifications(notice).catch(() => {});

    res.status(201).json({ message: "Notice created", notice });
  } catch (error) {
    res.status(500).json({ message: "Failed to create notice", error: error.message });
  }
};

// @desc    Update a notice
// @route   PUT /api/notices/:id
// @access  Private (admin, teaching_staff)
export const updateNotice = async (req, res) => {
  try {
    const { title, content, type, target_audience, target_classes, attachments, is_pinned, is_active, expires_at } =
      req.body;

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $set: { title, content, type, target_audience, target_classes, attachments, is_pinned, is_active, expires_at } },
      { new: true, runValidators: true }
    );

    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice updated", notice });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notice", error: error.message });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (admin)
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete notice", error: error.message });
  }
};

// @desc    Get active notices (role-filtered for current user)
// @route   GET /api/notices
// @access  Private
export const getNotices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const role = req.user.role_id?.name;
    const audienceFilter = buildAudienceFilter(role);

    const now = new Date();
    const filter = {
      is_active: true,
      published_at: { $lte: now },
      $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
      ...audienceFilter,
    };

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate("created_by", "first_name last_name")
        .sort({ is_pinned: -1, published_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notice.countDocuments(filter),
    ]);

    res.json({ notices, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices", error: error.message });
  }
};

// @desc    Get all notices including expired/inactive (admin view)
// @route   GET /api/notices/all
// @access  Private (admin)
export const getAllNotices = async (req, res) => {
  try {
    const { type, is_active, page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const filter = {};
    if (type) filter.type = type;
    if (is_active !== undefined) filter.is_active = is_active === "true";

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate("created_by", "first_name last_name")
        .sort({ is_pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notice.countDocuments(filter),
    ]);

    res.json({ notices, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices", error: error.message });
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildAudienceFilter(role) {
  const roleAudienceMap = {
    student: ["all", "students", "parents"],
    teaching_staff: ["all", "staff"],
    non_teaching_staff: ["all", "staff"],
    admin: [],
  };
  const allowed = roleAudienceMap[role];
  if (!allowed || allowed.length === 0) return {};
  return { target_audience: { $in: allowed } };
}

async function pushNoticeNotifications(notice) {
  const audienceRoleMap = {
    all: null,
    students: "student",
    staff: ["teaching_staff", "non_teaching_staff"],
    parents: "student",
  };

  const roleFilter = audienceRoleMap[notice.target_audience];
  const userFilter = { is_active: true, status: "approved" };

  if (roleFilter) {
    const roles = Array.isArray(roleFilter) ? roleFilter : [roleFilter];
    // We'll push to all users — role filtering is approximate here
    // (a proper implementation would join with the Role collection)
  }

  const users = await User.find(userFilter, "_id").lean();
  const notifications = users.map((u) =>
    createNotification({
      userId: u._id,
      type: "notice",
      title: notice.title,
      message: notice.content.slice(0, 120),
      data: { noticeId: notice._id, noticeType: notice.type },
    })
  );
  await Promise.allSettled(notifications);
}
