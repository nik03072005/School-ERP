import LearningContent from "../models/LearningContent.js";

// GET /api/learning  — list with filters
export const getContent = async (req, res) => {
  try {
    const { class_id, subject, type, page = 1, limit = 30 } = req.query;
    const role = req.user?.role_id?.name ?? req.user?.role_id;

    const filter = {};

    // Non-admin/non-staff only see published content
    if (role !== "admin" && role !== "teaching_staff" && role !== "non_teaching_staff") {
      filter.is_published = true;
    }

    if (class_id) filter.class_ids = class_id;
    if (subject) filter.subject = { $regex: subject, $options: "i" };
    if (type) filter.content_type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      LearningContent.find(filter)
        .populate("class_ids", "name")
        .populate("created_by", "first_name last_name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LearningContent.countDocuments(filter),
    ]);

    res.json({ content: items, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/learning/mine  — teacher's own content
export const getMyContent = async (req, res) => {
  try {
    const items = await LearningContent.find({ created_by: req.user._id })
      .populate("class_ids", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ content: items });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/learning/:id
export const getContentById = async (req, res) => {
  try {
    const item = await LearningContent.findById(req.params.id)
      .populate("class_ids", "name")
      .populate("created_by", "first_name last_name")
      .lean();
    if (!item) return res.status(404).json({ message: "Content not found" });
    res.json({ content: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/learning  (admin / teaching_staff)
export const createContent = async (req, res) => {
  try {
    const {
      title, description, class_ids, subject,
      content_type, media_url, media_key, mime_type,
      file_size, duration, tags,
    } = req.body;

    if (!title || !content_type || !media_url) {
      return res.status(400).json({ message: "title, content_type, and media_url are required" });
    }

    const item = await LearningContent.create({
      title,
      description,
      class_ids: Array.isArray(class_ids) ? class_ids : class_ids ? [class_ids] : [],
      subject,
      content_type,
      media_url,
      media_key,
      mime_type,
      file_size: file_size ? Number(file_size) : undefined,
      duration: duration ? Number(duration) : undefined,
      tags: Array.isArray(tags) ? tags : [],
      created_by: req.user._id,
    });

    res.status(201).json({ message: "Content created", content: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/learning/:id  (admin / creator)
export const updateContent = async (req, res) => {
  try {
    const item = await LearningContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found" });

    const role = req.user?.role_id?.name ?? req.user?.role_id;
    if (role !== "admin" && String(item.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorised to edit this content" });
    }

    const { title, description, class_ids, subject, tags, is_published, duration } = req.body;
    Object.assign(item, {
      title: title ?? item.title,
      description: description ?? item.description,
      class_ids: class_ids ?? item.class_ids,
      subject: subject ?? item.subject,
      tags: tags ?? item.tags,
      duration: duration !== undefined ? Number(duration) : item.duration,
      is_published: is_published !== undefined ? is_published : item.is_published,
    });

    await item.save();
    res.json({ message: "Updated", content: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/learning/:id/publish  (admin only)
export const togglePublish = async (req, res) => {
  try {
    const item = await LearningContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found" });
    item.is_published = !item.is_published;
    await item.save();
    res.json({ message: item.is_published ? "Published" : "Unpublished", content: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/learning/:id  (admin / creator)
export const deleteContent = async (req, res) => {
  try {
    const item = await LearningContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found" });

    const role = req.user?.role_id?.name ?? req.user?.role_id;
    if (role !== "admin" && String(item.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorised" });
    }

    await item.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
