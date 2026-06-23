import ExamSchedule from "../models/ExamSchedule.js";
import ProgressReport from "../models/ProgressReport.js";
import Student from "../models/Student.js";
import { createNotification } from "./notificationController.js";

const computeGrade = (obtained, max) => {
  if (!max || max <= 0) return "N/A";
  const pct = (obtained / max) * 100;
  if (pct >= 80) return "A";
  if (pct >= 60) return "B";
  if (pct >= 40) return "C";
  return "D";
};

const calcTotals = (marks) => {
  const totalObtained = marks.reduce((s, m) => s + m.marks_obtained, 0);
  const totalMax = marks.reduce((s, m) => s + m.max_marks, 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;
  const overall_grade = computeGrade(totalObtained, totalMax);
  return { total_marks_obtained: totalObtained, total_max_marks: totalMax, percentage, overall_grade };
};

// POST /api/progress-reports  — upsert single student's report (teacher/admin)
export const upsertReport = async (req, res) => {
  try {
    const { exam_schedule_id, student_id, marks, remarks } = req.body;
    if (!exam_schedule_id || !student_id || !marks?.length) {
      return res.status(400).json({ message: "exam_schedule_id, student_id, and marks are required" });
    }

    const exam = await ExamSchedule.findById(exam_schedule_id).lean();
    if (!exam) return res.status(404).json({ message: "Exam schedule not found" });

    const enrichedMarks = marks.map((m) => ({
      subject: m.subject,
      max_marks: m.max_marks,
      marks_obtained: Math.min(Number(m.marks_obtained), m.max_marks),
      grade: computeGrade(m.marks_obtained, m.max_marks),
    }));

    const totals = calcTotals(enrichedMarks);

    const report = await ProgressReport.findOneAndUpdate(
      { student_id, exam_schedule_id },
      {
        marks: enrichedMarks,
        remarks: remarks || "",
        entered_by: req.user._id,
        ...totals,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json({ message: "Marks saved", report });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/progress-reports/batch  — upsert multiple students for an exam (teacher/admin)
export const batchUpsertReports = async (req, res) => {
  try {
    const { exam_schedule_id, reports } = req.body;
    if (!exam_schedule_id || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ message: "exam_schedule_id and reports[] required" });
    }

    const exam = await ExamSchedule.findById(exam_schedule_id).lean();
    if (!exam) return res.status(404).json({ message: "Exam schedule not found" });

    const ops = reports.map(({ student_id, marks, remarks }) => {
      const enrichedMarks = (marks || []).map((m) => ({
        subject: m.subject,
        max_marks: m.max_marks,
        marks_obtained: Math.min(Number(m.marks_obtained ?? 0), m.max_marks),
        grade: computeGrade(m.marks_obtained ?? 0, m.max_marks),
      }));
      const totals = calcTotals(enrichedMarks);
      return {
        updateOne: {
          filter: { student_id, exam_schedule_id },
          update: {
            $set: {
              marks: enrichedMarks,
              remarks: remarks || "",
              entered_by: req.user._id,
              ...totals,
            },
          },
          upsert: true,
        },
      };
    });

    await ProgressReport.bulkWrite(ops);
    res.json({ message: `Saved marks for ${ops.length} student(s)` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/progress-reports/mine  — student: own published reports
export const getMyReports = async (req, res) => {
  try {
    const studentDoc = await Student.findOne({ user_id: req.user._id }).lean();
    if (!studentDoc) return res.status(404).json({ message: "Student profile not found" });

    const reports = await ProgressReport.find({
      student_id: studentDoc._id,
      is_published: true,
    })
      .populate({
        path: "exam_schedule_id",
        select: "name exam_type academic_year class_id",
        populate: { path: "class_id", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/progress-reports/exam/:examId  — all student reports for an exam (admin/teacher)
export const getExamReport = async (req, res) => {
  try {
    const reports = await ProgressReport.find({ exam_schedule_id: req.params.examId })
      .populate({
        path: "student_id",
        select: "admission_no roll_no",
        populate: { path: "user_id", select: "first_name last_name" },
      })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/progress-reports/exam/:examId/publish  — publish all + notify students (admin)
export const publishReports = async (req, res) => {
  try {
    const result = await ProgressReport.updateMany(
      { exam_schedule_id: req.params.examId, is_published: false },
      {
        $set: {
          is_published: true,
          published_by: req.user._id,
          published_at: new Date(),
        },
      }
    );

    // Notify students whose reports were just published
    if (result.modifiedCount > 0) {
      const exam = await ExamSchedule.findById(req.params.examId).lean();
      const publishedReports = await ProgressReport.find({
        exam_schedule_id: req.params.examId,
        is_published: true,
      })
        .populate({ path: "student_id", select: "user_id" })
        .lean();

      const notifTitle = `Result Published: ${exam?.name ?? "Exam"}`;
      const notifMsg = "Your progress report is now available. Check your results!";

      for (const rpt of publishedReports) {
        if (rpt.student_id?.user_id) {
          createNotification({
            userId: rpt.student_id.user_id,
            type: "result",
            title: notifTitle,
            message: notifMsg,
            data: { exam_schedule_id: req.params.examId },
          }).catch(() => {});
        }
      }
    }

    res.json({ message: `Published ${result.modifiedCount} report(s)` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
