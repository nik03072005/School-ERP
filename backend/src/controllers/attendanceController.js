import Student from "../models/Student.js";
import Staff from "../models/Staff.js";
import Section from "../models/Section.js";
import User from "../models/User.js";
import StudentAttendance from "../models/StudentAttendance.js";
import StaffAttendance from "../models/StaffAttendance.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import AttendanceAudit from "../models/AttendanceAudit.js";

const ATTENDANCE_STATUSES = ["present", "absent", "late", "half_day", "leave_pending", "leave_approved"];
const CHECKPOINTS = ["start", "end"];

const normalizeDate = (value) => {
  const raw = value ? new Date(value) : new Date();
  if (Number.isNaN(raw.getTime())) return null;
  const normalized = new Date(raw);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const ensureTeacherCanMark = async (reqUser, section, classId, sectionId, emergencyReason) => {
  const roleName = reqUser?.role_id?.name;
  if (roleName === "admin") {
    return { allowed: true, emergencyOverride: false };
  }

  if (roleName !== "teaching_staff") {
    return { allowed: false, message: "Only admin or teaching staff can mark student attendance" };
  }

  const isSectionClassTeacher = section.class_teacher_user_id
    && String(section.class_teacher_user_id) === String(reqUser._id);

  const assignment = await TeacherAssignment.findOne({
    teacher_user_id: reqUser._id,
    class_id: classId,
    section_id: sectionId,
    is_active: true,
  }).select("_id");

  if (isSectionClassTeacher || assignment) {
    return { allowed: true, emergencyOverride: false };
  }

  if (!emergencyReason || !String(emergencyReason).trim()) {
    return {
      allowed: false,
      message: "Emergency reason is required when marking attendance for non-assigned class-section",
    };
  }

  return { allowed: true, emergencyOverride: true };
};

const createAuditEntries = async (entries) => {
  if (!entries.length) return;
  await AttendanceAudit.insertMany(entries, { ordered: false });
};

export const markStudentAttendanceBulk = async (req, res) => {
  try {
    const { class_id, section_id, attendance_date, checkpoint, records, emergency_reason } = req.body;

    if (!class_id || !section_id || !checkpoint || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "class_id, section_id, checkpoint, and records are required" });
    }

    if (!CHECKPOINTS.includes(checkpoint)) {
      return res.status(400).json({ message: `checkpoint must be one of: ${CHECKPOINTS.join(", ")}` });
    }

    const date = normalizeDate(attendance_date);
    if (!date) return res.status(400).json({ message: "Invalid attendance_date" });

    const section = await Section.findById(section_id).select("class_id class_teacher_user_id");
    if (!section) return res.status(404).json({ message: "Section not found" });
    if (String(section.class_id) !== String(class_id)) {
      return res.status(400).json({ message: "section_id does not belong to class_id" });
    }

    const authCheck = await ensureTeacherCanMark(req.user, section, class_id, section_id, emergency_reason);
    if (!authCheck.allowed) {
      return res.status(403).json({ message: authCheck.message });
    }

    const studentIds = records.map((item) => item.student_id).filter(Boolean);
    const students = await Student.find({
      _id: { $in: studentIds },
      class_id,
      section_id,
    }).select("_id");

    const validStudentSet = new Set(students.map((student) => String(student._id)));
    const invalidStudentId = studentIds.find((id) => !validStudentSet.has(String(id)));
    if (invalidStudentId) {
      return res.status(400).json({ message: `Student ${invalidStudentId} is not mapped to this class-section` });
    }

    const invalidStatus = records.find((item) => !ATTENDANCE_STATUSES.includes(item.status));
    if (invalidStatus) {
      return res.status(400).json({ message: `Invalid status: ${invalidStatus.status}` });
    }

    const existing = await StudentAttendance.find({
      student_id: { $in: studentIds },
      attendance_date: date,
      checkpoint,
    }).select("_id student_id status remarks");
    const existingMap = new Map(existing.map((item) => [String(item.student_id), item]));

    const operations = records.map((record) => ({
      updateOne: {
        filter: {
          student_id: record.student_id,
          attendance_date: date,
          checkpoint,
        },
        update: {
          $set: {
            class_id,
            section_id,
            status: record.status,
            remarks: record.remarks ? String(record.remarks).trim() : "",
            marked_by_user_id: req.user._id,
            emergency_override: authCheck.emergencyOverride,
            emergency_reason: authCheck.emergencyOverride ? String(emergency_reason).trim() : "",
            emergency_override_by_user_id: authCheck.emergencyOverride ? req.user._id : null,
            emergency_override_at: authCheck.emergencyOverride ? new Date() : null,
          },
        },
        upsert: true,
      },
    }));

    await StudentAttendance.bulkWrite(operations, { ordered: false });

    const saved = await StudentAttendance.find({
      class_id,
      section_id,
      attendance_date: date,
      checkpoint,
    })
      .populate("marked_by_user_id", "first_name last_name email")
      .populate("emergency_override_by_user_id", "first_name last_name email")
      .populate({
        path: "student_id",
        select: "user_id",
        populate: { path: "user_id", select: "first_name last_name" },
      })
      .sort({ updatedAt: -1 });

    const auditEntries = saved.map((item) => {
      const old = existingMap.get(String(item.student_id?._id || item.student_id));
      const oldStatus = old?.status || "";
      const oldRemarks = old?.remarks || "";
      return {
        target_type: "student",
        attendance_record_id: item._id,
        subject_user_id: item.student_id?.user_id?._id,
        action: old ? "corrected" : "marked",
        old_status: oldStatus,
        new_status: item.status,
        old_remarks: oldRemarks,
        new_remarks: item.remarks || "",
        reason: authCheck.emergencyOverride ? String(emergency_reason || "").trim() : "",
        emergency_override: authCheck.emergencyOverride,
        actor_user_id: req.user._id,
      };
    }).filter((entry) => entry.subject_user_id);

    await createAuditEntries(auditEntries);

    res.status(200).json({
      message: "Student attendance marked",
      count: saved.length,
      emergency_override: authCheck.emergencyOverride,
      records: saved,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getStudentAttendanceDaily = async (req, res) => {
  try {
    const { class_id, section_id, attendance_date, checkpoint } = req.query;
    if (!class_id || !section_id || !checkpoint) {
      return res.status(400).json({ message: "class_id, section_id and checkpoint are required" });
    }

    const date = normalizeDate(attendance_date);
    if (!date) return res.status(400).json({ message: "Invalid attendance_date" });

    const students = await Student.find({ class_id, section_id })
      .populate("user_id", "first_name last_name")
      .select("_id user_id roll_no admission_no")
      .sort({ roll_no: 1, admission_no: 1, _id: 1 });

    const attendance = await StudentAttendance.find({ class_id, section_id, attendance_date: date, checkpoint })
      .select("student_id status remarks emergency_override emergency_reason emergency_override_by_user_id emergency_override_at updatedAt")
      .populate("emergency_override_by_user_id", "first_name last_name email");

    const attendanceMap = new Map(attendance.map((item) => [String(item.student_id), item]));

    const rows = students.map((student) => {
      const entry = attendanceMap.get(String(student._id));
      return {
        attendance_id: entry?._id || null,
        student_id: student._id,
        name: `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim(),
        roll_no: student.roll_no,
        admission_no: student.admission_no,
        status: entry?.status || null,
        remarks: entry?.remarks || "",
        emergency_override: Boolean(entry?.emergency_override),
        emergency_reason: entry?.emergency_reason || "",
        emergency_override_by_user_id: entry?.emergency_override_by_user_id?._id || null,
        emergency_override_by: entry?.emergency_override_by_user_id
          ? {
            id: entry.emergency_override_by_user_id._id,
            first_name: entry.emergency_override_by_user_id.first_name,
            last_name: entry.emergency_override_by_user_id.last_name,
            email: entry.emergency_override_by_user_id.email,
          }
          : null,
        emergency_override_at: entry?.emergency_override_at || null,
        marked_at: entry?.updatedAt || null,
      };
    });

    res.status(200).json({ count: rows.length, rows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { student_id, from_date, to_date } = req.query;
    if (!student_id) return res.status(400).json({ message: "student_id is required" });

    const from = normalizeDate(from_date);
    const to = normalizeDate(to_date) || normalizeDate(new Date());
    if (from_date && !from) return res.status(400).json({ message: "Invalid from_date" });
    if (to_date && !to) return res.status(400).json({ message: "Invalid to_date" });

    const filter = { student_id };
    if (from || to) {
      filter.attendance_date = {};
      if (from) filter.attendance_date.$gte = from;
      if (to) filter.attendance_date.$lte = to;
    }

    const records = await StudentAttendance.find(filter)
      .select("attendance_date checkpoint status remarks emergency_override emergency_reason emergency_override_by_user_id emergency_override_at updatedAt")
      .populate("emergency_override_by_user_id", "first_name last_name email")
      .sort({ attendance_date: -1, checkpoint: 1 });

    const summary = ATTENDANCE_STATUSES.reduce((acc, item) => ({ ...acc, [item]: 0 }), {});
    records.forEach((record) => {
      summary[record.status] = (summary[record.status] || 0) + 1;
    });

    res.status(200).json({ count: records.length, summary, records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markStaffAttendanceBulk = async (req, res) => {
  try {
    const { attendance_date, checkpoint, records } = req.body;

    if (!checkpoint || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "checkpoint and records are required" });
    }

    if (!CHECKPOINTS.includes(checkpoint)) {
      return res.status(400).json({ message: `checkpoint must be one of: ${CHECKPOINTS.join(", ")}` });
    }

    const date = normalizeDate(attendance_date);
    if (!date) return res.status(400).json({ message: "Invalid attendance_date" });

    const userIds = records.map((item) => item.user_id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).populate("role_id", "name").select("_id role_id");
    const staffUserSet = new Set(
      users
        .filter((user) => ["teaching_staff", "non_teaching_staff"].includes(user.role_id?.name))
        .map((user) => String(user._id))
    );

    const invalidUserId = userIds.find((id) => !staffUserSet.has(String(id)));
    if (invalidUserId) {
      return res.status(400).json({ message: `User ${invalidUserId} is not teaching/non-teaching staff` });
    }

    const staffProfiles = await Staff.find({ user_id: { $in: userIds } }).select("user_id");
    const profileSet = new Set(staffProfiles.map((entry) => String(entry.user_id)));
    const profileMissingUser = userIds.find((id) => !profileSet.has(String(id)));
    if (profileMissingUser) {
      return res.status(400).json({ message: `Staff profile missing for user ${profileMissingUser}` });
    }

    const invalidStatus = records.find((item) => !ATTENDANCE_STATUSES.includes(item.status));
    if (invalidStatus) {
      return res.status(400).json({ message: `Invalid status: ${invalidStatus.status}` });
    }

    const existing = await StaffAttendance.find({
      user_id: { $in: userIds },
      attendance_date: date,
      checkpoint,
    }).select("_id user_id status remarks");
    const existingMap = new Map(existing.map((item) => [String(item.user_id), item]));

    const operations = records.map((record) => ({
      updateOne: {
        filter: {
          user_id: record.user_id,
          attendance_date: date,
          checkpoint,
        },
        update: {
          $set: {
            status: record.status,
            remarks: record.remarks ? String(record.remarks).trim() : "",
            marked_by_user_id: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await StaffAttendance.bulkWrite(operations, { ordered: false });

    const saved = await StaffAttendance.find({ attendance_date: date, checkpoint })
      .populate("user_id", "first_name last_name email")
      .sort({ updatedAt: -1 });

    const auditEntries = saved
      .filter((item) => userIds.some((id) => String(id) === String(item.user_id?._id || item.user_id)))
      .map((item) => {
        const old = existingMap.get(String(item.user_id?._id || item.user_id));
        return {
          target_type: "staff",
          attendance_record_id: item._id,
          subject_user_id: item.user_id?._id || item.user_id,
          action: old ? "corrected" : "marked",
          old_status: old?.status || "",
          new_status: item.status,
          old_remarks: old?.remarks || "",
          new_remarks: item.remarks || "",
          reason: "",
          emergency_override: false,
          actor_user_id: req.user._id,
        };
      });

    await createAuditEntries(auditEntries);

    res.status(200).json({ message: "Staff attendance marked", count: saved.length, records: saved });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getStaffAttendanceDaily = async (req, res) => {
  try {
    const { attendance_date, checkpoint } = req.query;
    if (!checkpoint) return res.status(400).json({ message: "checkpoint is required" });

    const date = normalizeDate(attendance_date);
    if (!date) return res.status(400).json({ message: "Invalid attendance_date" });

    const records = await StaffAttendance.find({ attendance_date: date, checkpoint })
      .populate("user_id", "first_name last_name email")
      .populate("marked_by_user_id", "first_name last_name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({ count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const exportStudentAttendanceCsv = async (req, res) => {
  try {
    const { class_id, section_id, from_date, to_date } = req.query;
    if (!class_id || !section_id) {
      return res.status(400).json({ message: "class_id and section_id are required" });
    }

    const from = normalizeDate(from_date);
    const to = normalizeDate(to_date) || normalizeDate(new Date());

    const filter = { class_id, section_id };
    if (from || to) {
      filter.attendance_date = {};
      if (from) filter.attendance_date.$gte = from;
      if (to) filter.attendance_date.$lte = to;
    }

    const records = await StudentAttendance.find(filter)
      .populate({
        path: "student_id",
        select: "roll_no admission_no user_id",
        populate: { path: "user_id", select: "first_name last_name" },
      })
      .populate("marked_by_user_id", "first_name last_name")
      .populate("emergency_override_by_user_id", "first_name last_name")
      .sort({ attendance_date: 1, checkpoint: 1, student_id: 1 });

    const header = [
      "date",
      "checkpoint",
      "student_name",
      "roll_no",
      "admission_no",
      "status",
      "remarks",
      "marked_by",
      "emergency_override",
      "emergency_override_by",
      "emergency_override_at",
      "emergency_reason",
    ];

    const rows = records.map((item) => {
      const studentName = `${item?.student_id?.user_id?.first_name || ""} ${item?.student_id?.user_id?.last_name || ""}`.trim();
      const markedBy = `${item?.marked_by_user_id?.first_name || ""} ${item?.marked_by_user_id?.last_name || ""}`.trim();
      const overrideBy = `${item?.emergency_override_by_user_id?.first_name || ""} ${item?.emergency_override_by_user_id?.last_name || ""}`.trim();
      return [
        item.attendance_date.toISOString().slice(0, 10),
        item.checkpoint,
        studentName,
        item?.student_id?.roll_no || "",
        item?.student_id?.admission_no || "",
        item.status,
        item.remarks || "",
        markedBy,
        item.emergency_override ? "yes" : "no",
        overrideBy,
        item?.emergency_override_at ? new Date(item.emergency_override_at).toISOString() : "",
        item.emergency_reason || "",
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=student-attendance.csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const exportStaffAttendanceCsv = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const from = normalizeDate(from_date);
    const to = normalizeDate(to_date) || normalizeDate(new Date());

    const filter = {};
    if (from || to) {
      filter.attendance_date = {};
      if (from) filter.attendance_date.$gte = from;
      if (to) filter.attendance_date.$lte = to;
    }

    const records = await StaffAttendance.find(filter)
      .populate("user_id", "first_name last_name email")
      .populate("marked_by_user_id", "first_name last_name")
      .sort({ attendance_date: 1, checkpoint: 1, user_id: 1 });

    const header = ["date", "checkpoint", "staff_name", "staff_email", "status", "remarks", "marked_by"];
    const rows = records.map((item) => [
      item.attendance_date.toISOString().slice(0, 10),
      item.checkpoint,
      `${item?.user_id?.first_name || ""} ${item?.user_id?.last_name || ""}`.trim(),
      item?.user_id?.email || "",
      item.status,
      item.remarks || "",
      `${item?.marked_by_user_id?.first_name || ""} ${item?.marked_by_user_id?.last_name || ""}`.trim(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=staff-attendance.csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const correctStudentAttendance = async (req, res) => {
  try {
    const { status, remarks, reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: "reason is required for correction" });
    }
    if (!ATTENDANCE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` });
    }

    const attendance = await StudentAttendance.findById(req.params.attendanceId).populate("student_id", "user_id");
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    const oldStatus = attendance.status;
    const oldRemarks = attendance.remarks || "";

    attendance.status = status;
    attendance.remarks = remarks ? String(remarks).trim() : "";
    attendance.marked_by_user_id = req.user._id;
    await attendance.save();

    await createAuditEntries([
      {
        target_type: "student",
        attendance_record_id: attendance._id,
        subject_user_id: attendance.student_id?.user_id,
        action: "corrected",
        old_status: oldStatus,
        new_status: attendance.status,
        old_remarks: oldRemarks,
        new_remarks: attendance.remarks || "",
        reason: String(reason).trim(),
        emergency_override: false,
        actor_user_id: req.user._id,
      },
    ]);

    res.status(200).json({ message: "Student attendance corrected", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const correctStaffAttendance = async (req, res) => {
  try {
    const { status, remarks, reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: "reason is required for correction" });
    }
    if (!ATTENDANCE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` });
    }

    const attendance = await StaffAttendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    const oldStatus = attendance.status;
    const oldRemarks = attendance.remarks || "";

    attendance.status = status;
    attendance.remarks = remarks ? String(remarks).trim() : "";
    attendance.marked_by_user_id = req.user._id;
    await attendance.save();

    await createAuditEntries([
      {
        target_type: "staff",
        attendance_record_id: attendance._id,
        subject_user_id: attendance.user_id,
        action: "corrected",
        old_status: oldStatus,
        new_status: attendance.status,
        old_remarks: oldRemarks,
        new_remarks: attendance.remarks || "",
        reason: String(reason).trim(),
        emergency_override: false,
        actor_user_id: req.user._id,
      },
    ]);

    res.status(200).json({ message: "Staff attendance corrected", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listAttendanceAudits = async (req, res) => {
  try {
    const { target_type, subject_user_id, limit = 50 } = req.query;
    const filter = {};
    if (target_type) filter.target_type = target_type;
    if (subject_user_id) filter.subject_user_id = subject_user_id;

    const records = await AttendanceAudit.find(filter)
      .populate("subject_user_id", "first_name last_name email")
      .populate("actor_user_id", "first_name last_name email")
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    res.status(200).json({ count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
