import ExamSchedule from "../models/ExamSchedule.js";
import ProgressReport from "../models/ProgressReport.js";

// GET /api/exams  — list, optionally filter by class_id
export const getExams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.class_id) filter.class_id = req.query.class_id;
    const exams = await ExamSchedule.find(filter)
      .populate("class_id", "name")
      .populate("section_id", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ exams });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/exams/:id
export const getExam = async (req, res) => {
  try {
    const exam = await ExamSchedule.findById(req.params.id)
      .populate("class_id", "name")
      .populate("section_id", "name")
      .lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ exam });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/exams  (admin)
export const createExam = async (req, res) => {
  try {
    const { name, exam_type, class_id, section_id, subjects, academic_year } = req.body;
    if (!name || !class_id) {
      return res.status(400).json({ message: "name and class_id are required" });
    }
    const exam = await ExamSchedule.create({
      name,
      exam_type,
      class_id,
      section_id: section_id || undefined,
      subjects: subjects || [],
      academic_year,
      created_by: req.user._id,
    });
    res.status(201).json({ message: "Exam schedule created", exam });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/exams/:id  (admin)
export const updateExam = async (req, res) => {
  try {
    const { name, exam_type, class_id, section_id, subjects, academic_year, is_published } =
      req.body;
    const exam = await ExamSchedule.findByIdAndUpdate(
      req.params.id,
      { name, exam_type, class_id, section_id, subjects, academic_year, is_published },
      { new: true, runValidators: true }
    );
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ message: "Updated", exam });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/exams/:id  (admin)
export const deleteExam = async (req, res) => {
  try {
    const reportCount = await ProgressReport.countDocuments({
      exam_schedule_id: req.params.id,
    });
    if (reportCount > 0) {
      return res
        .status(400)
        .json({ message: `Cannot delete — ${reportCount} progress report(s) linked to this exam.` });
    }
    await ExamSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
