import DailyLogbook from "../models/DailyLogbook.js";

const stripToDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// @desc    Create or update a logbook entry (upsert by class+section+subject+date)
// @route   POST /api/logbook
// @access  Private (admin, teaching_staff)
export const upsertEntry = async (req, res) => {
  try {
    const { class_id, section_id, subject, date, classwork, homework, status } = req.body;

    if (!class_id || !section_id || !subject || !date) {
      return res.status(400).json({ message: "class_id, section_id, subject, and date are required" });
    }

    const day = stripToDate(date);

    const entry = await DailyLogbook.findOneAndUpdate(
      { class_id, section_id, subject, date: day },
      {
        $set: {
          teacher_id: req.user._id,
          classwork: classwork || { text: "", media: [] },
          homework: homework || { text: "", media: [] },
          status: status || "draft",
        },
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate("class_id", "name grade")
      .populate("section_id", "name")
      .populate("teacher_id", "first_name last_name");

    res.status(200).json({ message: "Logbook entry saved", entry });
  } catch (error) {
    res.status(500).json({ message: "Failed to save logbook entry", error: error.message });
  }
};

// @desc    Get entries for a class+section on a specific date (student/parent view)
// @route   GET /api/logbook?class_id=&section_id=&date=
// @access  Private
export const getEntriesByDate = async (req, res) => {
  try {
    const { class_id, section_id, date } = req.query;
    if (!class_id || !section_id || !date) {
      return res.status(400).json({ message: "class_id, section_id, and date are required" });
    }

    const day = stripToDate(date);

    const entries = await DailyLogbook.find({
      class_id,
      section_id,
      date: day,
      status: "published",
    })
      .populate("teacher_id", "first_name last_name")
      .sort({ subject: 1 })
      .lean();

    res.json({ entries, date: day });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logbook entries", error: error.message });
  }
};

// @desc    Get all entries (admin view, filterable)
// @route   GET /api/logbook/all
// @access  Private (admin)
export const getAllEntries = async (req, res) => {
  try {
    const { class_id, section_id, subject, date, status, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (class_id) filter.class_id = class_id;
    if (section_id) filter.section_id = section_id;
    if (subject) filter.subject = new RegExp(subject, "i");
    if (status) filter.status = status;
    if (date) filter.date = stripToDate(date);

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      DailyLogbook.find(filter)
        .populate("class_id", "name grade")
        .populate("section_id", "name")
        .populate("teacher_id", "first_name last_name")
        .sort({ date: -1, subject: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DailyLogbook.countDocuments(filter),
    ]);

    res.json({ entries, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logbook entries", error: error.message });
  }
};

// @desc    Get a teacher's own entries (filterable by date range)
// @route   GET /api/logbook/mine
// @access  Private (teaching_staff)
export const getMyEntries = async (req, res) => {
  try {
    const { from, to, status } = req.query;

    const filter = { teacher_id: req.user._id };
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = stripToDate(from);
      if (to) filter.date.$lte = stripToDate(to);
    }

    const entries = await DailyLogbook.find(filter)
      .populate("class_id", "name grade")
      .populate("section_id", "name")
      .sort({ date: -1, subject: 1 })
      .lean();

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch entries", error: error.message });
  }
};

// @desc    Delete a logbook entry
// @route   DELETE /api/logbook/:id
// @access  Private (admin)
export const deleteEntry = async (req, res) => {
  try {
    const entry = await DailyLogbook.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete entry", error: error.message });
  }
};
