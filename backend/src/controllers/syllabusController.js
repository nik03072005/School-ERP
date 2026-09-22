import Syllabus from "../models/Syllabus.js";
import Subject from "../models/Subject.js";
import { CBSE_SUBJECT_PRESETS } from "../utils/cbsePresets.js";

// @desc    Get syllabus by subject ID
// @route   GET /api/syllabus/subject/:subjectId
// @access  Protected
export const getSyllabusBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    let syllabus = await Syllabus.findOne({ subject_id: subjectId })
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks board subject_type assigned_teachers")
      .populate("class_id", "name grade_level")
      .populate("chapters.completed_by", "first_name last_name");

    if (!syllabus) {
      // Find subject to create an empty syllabus container if needed
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      syllabus = new Syllabus({
        subject_id: subject._id,
        class_id: subject.class_id,
        academic_year: subject.academic_year || "2026-2027",
        chapters: [],
      });
      await syllabus.save();

      syllabus = await Syllabus.findById(syllabus._id)
        .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks board subject_type assigned_teachers")
        .populate("class_id", "name grade_level");
    }

    res.json({ syllabus });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch syllabus", error: err.message });
  }
};

// @desc    List all syllabus plans for a class
// @route   GET /api/syllabus/class/:classId
// @access  Protected
export const listSyllabusByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academic_year = "2026-2027" } = req.query;

    const syllabi = await Syllabus.find({ class_id: classId, academic_year })
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks board subject_type assigned_teachers is_active")
      .populate("class_id", "name grade_level")
      .sort({ "subject_id.code": 1 })
      .lean();

    // Summary calculation for class curriculum
    const totalSubjects = syllabi.length;
    const avgCompletion =
      totalSubjects > 0
        ? Math.round(
            (syllabi.reduce((sum, s) => sum + (s.overall_completion_percentage || 0), 0) /
              totalSubjects) *
              10
          ) / 10
        : 0;

    const totalChapters = syllabi.reduce((sum, s) => sum + (s.total_chapters || 0), 0);
    const completedChapters = syllabi.reduce((sum, s) => sum + (s.completed_chapters || 0), 0);

    res.json({
      class_id: classId,
      academic_year,
      summary: {
        total_subjects: totalSubjects,
        overall_class_progress: avgCompletion,
        total_chapters: totalChapters,
        completed_chapters: completedChapters,
      },
      syllabi,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to list class syllabus", error: err.message });
  }
};

// @desc    Add chapter to syllabus
// @route   POST /api/syllabus/:id/chapters
// @access  Admin, Teaching Staff
export const addChapter = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const {
      chapter_number,
      title,
      description = "",
      term = "Term 1",
      planned_periods = 6,
      target_completion_date,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Chapter title is required" });
    }

    const nextChapterNumber =
      Number(chapter_number) ||
      (syllabus.chapters.length > 0
        ? Math.max(...syllabus.chapters.map((c) => c.chapter_number || 0)) + 1
        : 1);

    syllabus.chapters.push({
      chapter_number: nextChapterNumber,
      title: title.trim(),
      description: description ? description.trim() : "",
      term,
      planned_periods: Number(planned_periods) || 6,
      actual_periods: 0,
      target_completion_date: target_completion_date ? new Date(target_completion_date) : undefined,
      status: "not_started",
      completion_percentage: 0,
    });

    // Sort chapters by chapter_number
    syllabus.chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    syllabus.recalculateProgress();
    await syllabus.save();

    const updated = await Syllabus.findById(syllabus._id)
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks")
      .populate("class_id", "name grade_level")
      .populate("chapters.completed_by", "first_name last_name");

    res.status(201).json({ message: "Chapter added successfully", syllabus: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to add chapter", error: err.message });
  }
};

// @desc    Update chapter details
// @route   PUT /api/syllabus/:id/chapters/:chapterId
// @access  Admin, Teaching Staff
export const updateChapter = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const chapter = syllabus.chapters.id(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const {
      chapter_number,
      title,
      description,
      term,
      planned_periods,
      actual_periods,
      target_completion_date,
    } = req.body;

    if (chapter_number !== undefined) chapter.chapter_number = Number(chapter_number);
    if (title !== undefined) chapter.title = title.trim();
    if (description !== undefined) chapter.description = description.trim();
    if (term !== undefined) chapter.term = term;
    if (planned_periods !== undefined) chapter.planned_periods = Number(planned_periods);
    if (actual_periods !== undefined) chapter.actual_periods = Number(actual_periods);
    if (target_completion_date !== undefined) {
      chapter.target_completion_date = target_completion_date
        ? new Date(target_completion_date)
        : undefined;
    }

    syllabus.chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    syllabus.recalculateProgress();
    await syllabus.save();

    const updated = await Syllabus.findById(syllabus._id)
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks")
      .populate("class_id", "name grade_level");

    res.json({ message: "Chapter updated successfully", syllabus: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update chapter", error: err.message });
  }
};

// @desc    Update chapter progress (% covered, status, actual periods, teacher notes)
// @route   PATCH /api/syllabus/:id/chapters/:chapterId/progress
// @access  Admin, Teaching Staff
export const updateChapterProgress = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const chapter = syllabus.chapters.id(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const { status, completion_percentage, actual_periods, teacher_notes } = req.body;

    if (completion_percentage !== undefined) {
      const pct = Math.max(0, Math.min(100, Number(completion_percentage)));
      chapter.completion_percentage = pct;
      if (pct >= 100) {
        chapter.status = "completed";
        if (!chapter.completed_at) chapter.completed_at = new Date();
        chapter.completed_by = req.user._id;
      } else if (pct > 0 && chapter.status === "not_started") {
        chapter.status = "in_progress";
      }
    }

    if (status !== undefined) {
      chapter.status = status;
      if (status === "completed") {
        chapter.completion_percentage = 100;
        if (!chapter.completed_at) chapter.completed_at = new Date();
        chapter.completed_by = req.user._id;
      } else if (status === "not_started") {
        chapter.completion_percentage = 0;
        chapter.completed_at = undefined;
        chapter.completed_by = undefined;
      } else if (status === "in_progress" && chapter.completion_percentage === 0) {
        chapter.completion_percentage = 25; // default initial progress
      }
    }

    if (actual_periods !== undefined) {
      chapter.actual_periods = Math.max(0, Number(actual_periods));
    }

    if (teacher_notes !== undefined) {
      chapter.teacher_notes = teacher_notes ? teacher_notes.trim() : "";
    }

    syllabus.recalculateProgress();
    await syllabus.save();

    const updated = await Syllabus.findById(syllabus._id)
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks")
      .populate("class_id", "name grade_level")
      .populate("chapters.completed_by", "first_name last_name");

    res.json({
      message: "Chapter progress updated successfully",
      syllabus: updated,
      chapter: updated.chapters.id(req.params.chapterId),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update chapter progress", error: err.message });
  }
};

// @desc    Delete chapter from syllabus
// @route   DELETE /api/syllabus/:id/chapters/:chapterId
// @access  Admin, Teaching Staff
export const deleteChapter = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    syllabus.chapters.pull({ _id: req.params.chapterId });
    syllabus.recalculateProgress();
    await syllabus.save();

    const updated = await Syllabus.findById(syllabus._id)
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks")
      .populate("class_id", "name grade_level");

    res.json({ message: "Chapter removed from syllabus", syllabus: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete chapter", error: err.message });
  }
};

// @desc    Seed standard CBSE chapters for a subject's syllabus
// @route   POST /api/syllabus/seed-chapters/:subjectId
// @access  Admin, Teaching Staff
export const seedDefaultChapters = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId).populate("class_id");
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const grade = subject.class_id?.grade_level;
    const preset = CBSE_SUBJECT_PRESETS.find(
      (p) => p.code === subject.code && (!grade || p.grade_range.includes(grade))
    );

    if (!preset || !preset.default_chapters || preset.default_chapters.length === 0) {
      return res.status(404).json({
        message: `No predefined CBSE chapter curriculum found for subject code ${subject.code}`,
      });
    }

    let syllabus = await Syllabus.findOne({ subject_id: subject._id });
    if (!syllabus) {
      syllabus = new Syllabus({
        subject_id: subject._id,
        class_id: subject.class_id._id,
        academic_year: subject.academic_year || "2026-2027",
        chapters: [],
      });
    }

    // Add any chapters not already present
    const existingTitles = new Set(syllabus.chapters.map((c) => c.title.toLowerCase()));
    let addedCount = 0;

    for (const defCh of preset.default_chapters) {
      if (!existingTitles.has(defCh.title.toLowerCase())) {
        syllabus.chapters.push({
          chapter_number: defCh.chapter_number,
          title: defCh.title,
          term: defCh.term || "Term 1",
          planned_periods: defCh.planned_periods || 8,
          actual_periods: 0,
          status: "not_started",
          completion_percentage: 0,
        });
        addedCount++;
      }
    }

    syllabus.chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    syllabus.recalculateProgress();
    await syllabus.save();

    const updated = await Syllabus.findById(syllabus._id)
      .populate("subject_id", "name code split_type theory_marks practical_marks internal_marks total_marks")
      .populate("class_id", "name grade_level");

    res.status(200).json({
      message: `Imported ${addedCount} CBSE chapters for ${subject.name}`,
      syllabus: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to seed chapters", error: err.message });
  }
};

