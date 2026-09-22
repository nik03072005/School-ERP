import Subject from "../models/Subject.js";
import Syllabus from "../models/Syllabus.js";
import Class from "../models/Class.js";
import { CBSE_SUBJECT_PRESETS, CBSE_SPLIT_PRESETS } from "../utils/cbsePresets.js";

// @desc    Get all subjects with filters
// @route   GET /api/subjects
// @access  Protected (Admin, Teaching Staff, Student)
export const getSubjects = async (req, res) => {
  try {
    const { class_id, academic_year, search, is_active, subject_type } = req.query;

    const filter = {};
    if (class_id) filter.class_id = class_id;
    if (academic_year) filter.academic_year = academic_year;
    if (subject_type) filter.subject_type = subject_type;
    if (is_active !== undefined) {
      filter.is_active = is_active === "true" || is_active === true;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { code: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const subjects = await Subject.find(filter)
      .populate("class_id", "name grade_level")
      .populate("assigned_teachers", "first_name last_name email")
      .sort({ code: 1, name: 1 })
      .lean();

    // Attach syllabus progress for each subject
    const subjectIds = subjects.map((s) => s._id);
    const syllabusList = await Syllabus.find({ subject_id: { $in: subjectIds } })
      .select("subject_id total_chapters completed_chapters overall_completion_percentage")
      .lean();

    const syllabusMap = {};
    syllabusList.forEach((s) => {
      syllabusMap[String(s.subject_id)] = s;
    });

    const enrichedSubjects = subjects.map((sub) => {
      const syl = syllabusMap[String(sub._id)];
      return {
        ...sub,
        syllabus_progress: syl
          ? {
              total_chapters: syl.total_chapters || 0,
              completed_chapters: syl.completed_chapters || 0,
              overall_completion_percentage: syl.overall_completion_percentage || 0,
            }
          : {
              total_chapters: 0,
              completed_chapters: 0,
              overall_completion_percentage: 0,
            },
      };
    });

    res.json({ subjects: enrichedSubjects });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subjects", error: err.message });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Protected
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate("class_id", "name grade_level")
      .populate("assigned_teachers", "first_name last_name email")
      .lean();

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const syllabus = await Syllabus.findOne({ subject_id: subject._id }).lean();

    res.json({ subject, syllabus });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subject", error: err.message });
  }
};

// @desc    Create new subject in Subject Master
// @route   POST /api/subjects
// @access  Admin
export const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      class_id,
      board = "CBSE",
      subject_type = "core",
      split_type = "80_20",
      theory_marks = 80,
      practical_marks = 0,
      internal_marks = 20,
      total_marks = 100,
      pass_marks = 33,
      periods_per_week = 6,
      assigned_teachers = [],
      description = "",
      academic_year = "2026-2027",
    } = req.body;

    if (!name || !code || !class_id) {
      return res.status(400).json({ message: "Name, subject code, and class_id are required" });
    }

    // Verify class exists
    const classDoc = await Class.findById(class_id);
    if (!classDoc) {
      return res.status(404).json({ message: "Selected class does not exist" });
    }

    // Validate marks split
    const tMarks = Number(theory_marks) || 0;
    const pMarks = Number(practical_marks) || 0;
    const iMarks = Number(internal_marks) || 0;
    const totMarks = Number(total_marks) || 100;

    if (tMarks + pMarks + iMarks !== totMarks) {
      return res.status(400).json({
        message: `Theory (${tMarks}) + Practical (${pMarks}) + Internal (${iMarks}) must equal Total Marks (${totMarks})`,
      });
    }

    // Check duplicate code or name for class
    const existing = await Subject.findOne({
      class_id,
      academic_year,
      $or: [
        { code: code.trim().toUpperCase() },
        { name: name.trim() },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message: `Subject with code "${code.trim().toUpperCase()}" or name "${name.trim()}" already exists for this class`,
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      class_id,
      board: board.trim(),
      subject_type,
      split_type,
      theory_marks: tMarks,
      practical_marks: pMarks,
      internal_marks: iMarks,
      total_marks: totMarks,
      pass_marks: Number(pass_marks) || 33,
      periods_per_week: Number(periods_per_week) || 6,
      assigned_teachers,
      description: description ? description.trim() : "",
      academic_year,
      is_active: true,
    });

    // Automatically initialize syllabus container
    await Syllabus.create({
      subject_id: subject._id,
      class_id: subject.class_id,
      academic_year,
      chapters: [],
      total_chapters: 0,
      completed_chapters: 0,
      overall_completion_percentage: 0,
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate("class_id", "name grade_level")
      .populate("assigned_teachers", "first_name last_name email");

    res.status(201).json({ message: "Subject created successfully", subject: populatedSubject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Subject with this code already exists for this class" });
    }
    res.status(500).json({ message: "Failed to create subject", error: err.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Admin
export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const {
      name,
      code,
      board,
      subject_type,
      split_type,
      theory_marks,
      practical_marks,
      internal_marks,
      total_marks,
      pass_marks,
      periods_per_week,
      assigned_teachers,
      description,
      academic_year,
      is_active,
    } = req.body;

    if (name !== undefined) subject.name = name.trim();
    if (code !== undefined) subject.code = code.trim().toUpperCase();
    if (board !== undefined) subject.board = board.trim();
    if (subject_type !== undefined) subject.subject_type = subject_type;
    if (split_type !== undefined) subject.split_type = split_type;
    if (theory_marks !== undefined) subject.theory_marks = Number(theory_marks);
    if (practical_marks !== undefined) subject.practical_marks = Number(practical_marks);
    if (internal_marks !== undefined) subject.internal_marks = Number(internal_marks);
    if (total_marks !== undefined) subject.total_marks = Number(total_marks);
    if (pass_marks !== undefined) subject.pass_marks = Number(pass_marks);
    if (periods_per_week !== undefined) subject.periods_per_week = Number(periods_per_week);
    if (assigned_teachers !== undefined) subject.assigned_teachers = assigned_teachers;
    if (description !== undefined) subject.description = description.trim();
    if (academic_year !== undefined) subject.academic_year = academic_year.trim();
    if (is_active !== undefined) subject.is_active = Boolean(is_active);

    // Validate marks split
    if (
      subject.theory_marks + subject.practical_marks + subject.internal_marks !==
      subject.total_marks
    ) {
      return res.status(400).json({
        message: `Theory (${subject.theory_marks}) + Practical (${subject.practical_marks}) + Internal (${subject.internal_marks}) must equal Total Marks (${subject.total_marks})`,
      });
    }

    await subject.save();

    const updated = await Subject.findById(subject._id)
      .populate("class_id", "name grade_level")
      .populate("assigned_teachers", "first_name last_name email");

    res.json({ message: "Subject updated successfully", subject: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate subject code or name for this class" });
    }
    res.status(500).json({ message: "Failed to update subject", error: err.message });
  }
};

// @desc    Delete or deactivate subject
// @route   DELETE /api/subjects/:id
// @access  Admin
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Delete associated syllabus
    await Syllabus.deleteMany({ subject_id: subject._id });
    await Subject.findByIdAndDelete(subject._id);

    res.json({ message: "Subject and associated syllabus deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete subject", error: err.message });
  }
};

// @desc    Get CBSE standard presets catalogue
// @route   GET /api/subjects/presets
// @access  Protected
export const getPresets = async (req, res) => {
  try {
    const { grade_level } = req.query;
    let presets = CBSE_SUBJECT_PRESETS;

    if (grade_level) {
      const grade = Number(grade_level);
      presets = presets.filter((p) => p.grade_range.includes(grade));
    }

    res.json({
      split_presets: CBSE_SPLIT_PRESETS,
      subject_presets: presets,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load presets", error: err.message });
  }
};

// @desc    1-Click Seed CBSE Presets for a specific Class
// @route   POST /api/subjects/seed-presets
// @access  Admin
export const seedPresetsForClass = async (req, res) => {
  try {
    const { class_id, academic_year = "2026-2027" } = req.body;
    if (!class_id) {
      return res.status(400).json({ message: "class_id is required" });
    }

    const classDoc = await Class.findById(class_id);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    const grade = classDoc.grade_level;
    const matchingPresets = CBSE_SUBJECT_PRESETS.filter((p) => p.grade_range.includes(grade));

    if (matchingPresets.length === 0) {
      return res.status(400).json({ message: `No standard CBSE presets found for grade ${grade}` });
    }

    let createdCount = 0;
    for (const preset of matchingPresets) {
      // Check if already exists
      const exists = await Subject.findOne({
        class_id,
        code: preset.code,
        academic_year,
      });

      if (!exists) {
        const sub = await Subject.create({
          name: preset.name,
          code: preset.code,
          class_id,
          board: "CBSE",
          subject_type: preset.subject_type,
          split_type: preset.split_type,
          theory_marks: preset.theory_marks,
          practical_marks: preset.practical_marks,
          internal_marks: preset.internal_marks,
          total_marks: preset.total_marks,
          pass_marks: preset.pass_marks,
          periods_per_week: preset.periods_per_week,
          description: preset.description,
          academic_year,
          is_active: true,
        });

        // Initialize syllabus with default chapters if provided
        const chapters = (preset.default_chapters || []).map((ch) => ({
          chapter_number: ch.chapter_number,
          title: ch.title,
          term: ch.term || "Term 1",
          planned_periods: ch.planned_periods || 8,
          actual_periods: 0,
          status: "not_started",
          completion_percentage: 0,
        }));

        const syllabus = new Syllabus({
          subject_id: sub._id,
          class_id,
          academic_year,
          chapters,
        });
        syllabus.recalculateProgress();
        await syllabus.save();

        createdCount++;
      }
    }

    res.status(201).json({
      message: `Successfully provisioned ${createdCount} CBSE subjects with syllabus chapters for ${classDoc.name}`,
      createdCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to seed presets", error: err.message });
  }
};

