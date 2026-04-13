import Class from "../models/Class.js";
import Section from "../models/Section.js";
import SchoolPeriod from "../models/SchoolPeriod.js";
import User from "../models/User.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import TimetableEntry from "../models/TimetableEntry.js";

const parseBool = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value === true || value === "true";
};

export const createClass = async (req, res) => {
  try {
    const { name, grade_level, capacity } = req.body;
    if (!name || !grade_level) {
      return res.status(400).json({ message: "name and grade_level are required" });
    }

    const classDoc = await Class.create({
      name: String(name).trim(),
      grade_level: Number(grade_level),
      capacity: capacity ? Number(capacity) : undefined,
    });

    res.status(201).json({ message: "Class created", class: classDoc });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Class already exists for this grade" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listClasses = async (req, res) => {
  try {
    const is_active = parseBool(req.query.is_active);
    const filter = {};
    if (is_active !== undefined) filter.is_active = is_active;

    const classes = await Class.find(filter).sort({ grade_level: 1, name: 1 });
    res.status(200).json({ count: classes.length, classes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const payload = {};
    ["name", "grade_level", "capacity", "is_active"].forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    if (payload.name !== undefined) payload.name = String(payload.name).trim();
    if (payload.grade_level !== undefined) payload.grade_level = Number(payload.grade_level);
    if (payload.capacity !== undefined) payload.capacity = Number(payload.capacity);

    const classDoc = await Class.findByIdAndUpdate(req.params.classId, payload, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    res.status(200).json({ message: "Class updated", class: classDoc });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Class already exists for this grade" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createSection = async (req, res) => {
  try {
    const { class_id, name, class_teacher_user_id } = req.body;
    if (!class_id || !name) {
      return res.status(400).json({ message: "class_id and name are required" });
    }

    const classDoc = await Class.findById(class_id).select("_id");
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    if (class_teacher_user_id) {
      const teacher = await User.findById(class_teacher_user_id).populate("role_id", "name");
      if (!teacher || teacher.role_id?.name !== "teaching_staff") {
        return res.status(400).json({ message: "class_teacher_user_id must be a teaching_staff user" });
      }
    }

    const section = await Section.create({
      class_id,
      name,
      class_teacher_user_id: class_teacher_user_id || null,
    });

    const populated = await Section.findById(section._id)
      .populate("class_id", "name grade_level")
      .populate("class_teacher_user_id", "first_name last_name email");

    res.status(201).json({ message: "Section created", section: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Section already exists for this class" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listSections = async (req, res) => {
  try {
    const { class_id, class_teacher_user_id } = req.query;
    const is_active = parseBool(req.query.is_active);
    const includeAllForOverride = parseBool(req.query.include_all_for_override);
    const roleName = req.user?.role_id?.name;
    const filter = {};
    if (class_id) filter.class_id = class_id;

    // Teaching staff can only query sections where they are set as class teacher.
    if (roleName === "teaching_staff") {
      if (!includeAllForOverride) {
        filter.class_teacher_user_id = req.user._id;
      }
    } else if (class_teacher_user_id) {
      filter.class_teacher_user_id = class_teacher_user_id;
    }

    if (is_active !== undefined) filter.is_active = is_active;

    const sections = await Section.find(filter)
      .populate("class_id", "name grade_level")
      .populate("class_teacher_user_id", "first_name last_name email")
      .sort({ name: 1 });

    res.status(200).json({ count: sections.length, sections });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const payload = {};
    ["name", "is_active"].forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    if (payload.name !== undefined) payload.name = String(payload.name).trim();

    const section = await Section.findByIdAndUpdate(req.params.sectionId, payload, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("class_id", "name grade_level")
      .populate("class_teacher_user_id", "first_name last_name email");

    if (!section) return res.status(404).json({ message: "Section not found" });

    res.status(200).json({ message: "Section updated", section });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Section already exists for this class" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const assignClassTeacher = async (req, res) => {
  try {
    const { class_teacher_user_id } = req.body;

    if (!class_teacher_user_id) {
      return res.status(400).json({ message: "class_teacher_user_id is required" });
    }

    const teacher = await User.findById(class_teacher_user_id).populate("role_id", "name");
    if (!teacher || teacher.role_id?.name !== "teaching_staff") {
      return res.status(400).json({ message: "Assigned user must be teaching_staff" });
    }

    const section = await Section.findByIdAndUpdate(
      req.params.sectionId,
      { class_teacher_user_id },
      { returnDocument: "after", runValidators: true }
    )
      .populate("class_id", "name grade_level")
      .populate("class_teacher_user_id", "first_name last_name email");

    if (!section) return res.status(404).json({ message: "Section not found" });

    res.status(200).json({ message: "Class teacher assigned", section });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createPeriod = async (req, res) => {
  try {
    const { name, period_number, start_time, end_time, is_break } = req.body;
    if (!name || !period_number || !start_time || !end_time) {
      return res.status(400).json({ message: "name, period_number, start_time, end_time are required" });
    }

    const period = await SchoolPeriod.create({
      name: String(name).trim(),
      period_number: Number(period_number),
      start_time: String(start_time).trim(),
      end_time: String(end_time).trim(),
      is_break: Boolean(is_break),
    });

    res.status(201).json({ message: "Period created", period });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "period_number must be unique" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listPeriods = async (req, res) => {
  try {
    const is_active = parseBool(req.query.is_active);
    const filter = {};
    if (is_active !== undefined) filter.is_active = is_active;

    const periods = await SchoolPeriod.find(filter).sort({ period_number: 1 });
    res.status(200).json({ count: periods.length, periods });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePeriod = async (req, res) => {
  try {
    const payload = {};
    ["name", "period_number", "start_time", "end_time", "is_break", "is_active"].forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    if (payload.name !== undefined) payload.name = String(payload.name).trim();
    if (payload.period_number !== undefined) payload.period_number = Number(payload.period_number);

    const period = await SchoolPeriod.findByIdAndUpdate(req.params.periodId, payload, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!period) return res.status(404).json({ message: "Period not found" });

    res.status(200).json({ message: "Period updated", period });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "period_number must be unique" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createTeacherAssignment = async (req, res) => {
  try {
    const { teacher_user_id, class_id, section_id, is_primary, remarks } = req.body;
    if (!teacher_user_id || !class_id || !section_id) {
      return res.status(400).json({ message: "teacher_user_id, class_id and section_id are required" });
    }

    const teacher = await User.findById(teacher_user_id).populate("role_id", "name");
    if (!teacher || teacher.role_id?.name !== "teaching_staff") {
      return res.status(400).json({ message: "teacher_user_id must be a teaching_staff user" });
    }

    const section = await Section.findById(section_id).select("class_id");
    if (!section) return res.status(404).json({ message: "Section not found" });
    if (String(section.class_id) !== String(class_id)) {
      return res.status(400).json({ message: "section_id does not belong to class_id" });
    }

    if (is_primary) {
      await TeacherAssignment.updateMany(
        { class_id, section_id, is_primary: true },
        { $set: { is_primary: false } }
      );
    }

    const assignment = await TeacherAssignment.findOneAndUpdate(
      { teacher_user_id, class_id, section_id },
      {
        teacher_user_id,
        class_id,
        section_id,
        is_primary: Boolean(is_primary),
        is_active: true,
        assigned_by_user_id: req.user._id,
        remarks: remarks ? String(remarks).trim() : "",
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    )
      .populate("teacher_user_id", "first_name last_name email")
      .populate("class_id", "name grade_level")
      .populate("section_id", "name");

    res.status(201).json({ message: "Teacher assignment saved", assignment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listTeacherAssignments = async (req, res) => {
  try {
    const { class_id, section_id, teacher_user_id } = req.query;
    const is_active = parseBool(req.query.is_active);
    const filter = {};
    if (class_id) filter.class_id = class_id;
    if (section_id) filter.section_id = section_id;
    if (teacher_user_id) filter.teacher_user_id = teacher_user_id;
    if (is_active !== undefined) filter.is_active = is_active;

    const assignments = await TeacherAssignment.find(filter)
      .populate("teacher_user_id", "first_name last_name email")
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("assigned_by_user_id", "first_name last_name")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: assignments.length, assignments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deactivateTeacherAssignment = async (req, res) => {
  try {
    const assignment = await TeacherAssignment.findByIdAndUpdate(
      req.params.assignmentId,
      { is_active: false },
      { returnDocument: "after" }
    );

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.status(200).json({ message: "Assignment deactivated", assignment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createTimetableEntry = async (req, res) => {
  try {
    const {
      class_id,
      section_id,
      period_id,
      teacher_user_id,
      day_of_week,
      subject_name,
      room,
      is_active,
    } = req.body;

    if (!class_id || !section_id || !period_id || !teacher_user_id || !day_of_week) {
      return res.status(400).json({
        message: "class_id, section_id, period_id, teacher_user_id and day_of_week are required",
      });
    }

    const classDoc = await Class.findById(class_id).select("_id");
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    const section = await Section.findById(section_id).select("class_id");
    if (!section) return res.status(404).json({ message: "Section not found" });
    if (String(section.class_id) !== String(class_id)) {
      return res.status(400).json({ message: "section_id does not belong to class_id" });
    }

    const period = await SchoolPeriod.findById(period_id).select("_id");
    if (!period) return res.status(404).json({ message: "Period not found" });

    const teacher = await User.findById(teacher_user_id).populate("role_id", "name");
    if (!teacher || teacher.role_id?.name !== "teaching_staff") {
      return res.status(400).json({ message: "teacher_user_id must be a teaching_staff user" });
    }

    const normalizedDay = String(day_of_week).trim().toLowerCase();

    const teacherConflict = await TimetableEntry.findOne({
      teacher_user_id,
      day_of_week: normalizedDay,
      period_id,
      is_active: true,
      $or: [{ class_id: { $ne: class_id } }, { section_id: { $ne: section_id } }],
    }).select("_id");

    if (teacherConflict) {
      return res.status(409).json({
        message: "Teacher is already assigned to another class for this day and period",
      });
    }

    const entry = await TimetableEntry.findOneAndUpdate(
      { class_id, section_id, day_of_week: normalizedDay, period_id },
      {
        class_id,
        section_id,
        period_id,
        teacher_user_id,
        day_of_week: normalizedDay,
        subject_name: subject_name ? String(subject_name).trim() : "",
        room: room ? String(room).trim() : "",
        is_active: is_active === undefined ? true : Boolean(is_active),
        created_by_user_id: req.user._id,
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    )
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("period_id", "name period_number start_time end_time")
      .populate("teacher_user_id", "first_name last_name email");

    res.status(201).json({ message: "Timetable entry saved", entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Timetable slot already exists for selected class, section, day and period",
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listTimetableEntries = async (req, res) => {
  try {
    const { class_id, section_id, period_id, teacher_user_id, day_of_week } = req.query;
    const is_active = parseBool(req.query.is_active);

    const filter = {};
    if (class_id) filter.class_id = class_id;
    if (section_id) filter.section_id = section_id;
    if (period_id) filter.period_id = period_id;
    if (teacher_user_id) filter.teacher_user_id = teacher_user_id;
    if (day_of_week) filter.day_of_week = String(day_of_week).toLowerCase();
    if (is_active !== undefined) filter.is_active = is_active;

    const entries = await TimetableEntry.find(filter)
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("period_id", "name period_number start_time end_time")
      .populate("teacher_user_id", "first_name last_name email")
      .sort({ day_of_week: 1, createdAt: -1 });

    res.status(200).json({ count: entries.length, entries });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listTeacherTimetable = async (req, res) => {
  try {
    const { teacher_user_id, day_of_week, period_id } = req.query;
    const is_active = parseBool(req.query.is_active);

    const filter = {};
    if (teacher_user_id) filter.teacher_user_id = teacher_user_id;
    if (period_id) filter.period_id = period_id;
    if (day_of_week) filter.day_of_week = String(day_of_week).toLowerCase();
    if (is_active !== undefined) filter.is_active = is_active;

    const entries = await TimetableEntry.find(filter)
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("period_id", "name period_number start_time end_time")
      .populate("teacher_user_id", "first_name last_name email")
      .sort({ createdAt: -1 });

    const grouped = new Map();
    entries.forEach((entry) => {
      const teacherId = String(entry?.teacher_user_id?._id || "");
      if (!teacherId) return;

      if (!grouped.has(teacherId)) {
        grouped.set(teacherId, {
          teacher_user_id: entry.teacher_user_id,
          entries: [],
        });
      }

      grouped.get(teacherId).entries.push(entry);
    });

    const timetables = Array.from(grouped.values());

    res.status(200).json({
      count: entries.length,
      teacherCount: timetables.length,
      timetables,
      entries,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
