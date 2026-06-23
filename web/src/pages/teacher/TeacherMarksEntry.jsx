import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getExams } from "../../api/examService";
import { batchUpsertReports, getExamReport } from "../../api/progressReportService";
import API from "../../api/api";

export default function TeacherMarksEntry() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [examDetail, setExamDetail] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksTable, setMarksTable] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    getExams().then(({ exams }) => setExams(exams));
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setExamDetail(null);
      setStudents([]);
      setMarksTable({});
      return;
    }
    loadExamData();
  }, [selectedExam]);

  const loadExamData = async () => {
    setLoading(true);
    try {
      const exam = exams.find((e) => e._id === selectedExam);
      setExamDetail(exam || null);
      if (!exam) return;

      // Fetch students in this class+section
      const params = { class_id: exam.class_id?._id || exam.class_id, limit: 200 };
      if (exam.section_id) params.section_id = exam.section_id?._id || exam.section_id;
      const { data } = await API.get("/admin/students", { params });
      const studentList = data.students || [];
      setStudents(studentList);

      // Fetch existing reports
      const { reports } = await getExamReport(selectedExam);
      const existingMap = {};
      const existingRemarks = {};
      for (const rpt of reports) {
        const sid = rpt.student_id?._id;
        if (sid) {
          existingMap[sid] = {};
          for (const m of rpt.marks) {
            existingMap[sid][m.subject] = m.marks_obtained;
          }
          existingRemarks[sid] = rpt.remarks || "";
        }
      }

      // Build marks table: { studentId: { subject: value } }
      const table = {};
      for (const s of studentList) {
        const sid = s._id;
        table[sid] = {};
        for (const sub of exam.subjects) {
          table[sid][sub.subject] = existingMap[sid]?.[sub.subject] ?? "";
        }
      }
      setMarksTable(table);
      setRemarksMap(existingRemarks);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, subject, value) => {
    setMarksTable((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: value },
    }));
  };

  const handleSave = async () => {
    if (!examDetail || students.length === 0) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const reports = students
        .filter((s) => {
          const entry = marksTable[s._id];
          return entry && Object.values(entry).some((v) => v !== "" && v !== null);
        })
        .map((s) => ({
          student_id: s._id,
          marks: examDetail.subjects
            .filter((sub) => marksTable[s._id]?.[sub.subject] !== "")
            .map((sub) => ({
              subject: sub.subject,
              max_marks: sub.max_marks,
              marks_obtained: Number(marksTable[s._id]?.[sub.subject] || 0),
            })),
          remarks: remarksMap[s._id] || "",
        }));

      if (reports.length === 0) {
        alert("No marks entered yet.");
        return;
      }

      await batchUpsertReports({ exam_schedule_id: selectedExam, reports });
      setSavedMsg(`Saved marks for ${reports.length} student(s)`);
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marks Entry</h1>
        <p className="text-sm text-slate-500">Enter student marks per exam schedule</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Select Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="input min-w-72"
          >
            <option value="">Choose an exam schedule</option>
            {exams.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} — {e.class_id?.name}
                {e.section_id ? ` · ${e.section_id?.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        {selectedExam && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Saving…" : "Save All Marks"}
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {savedMsg}
        </div>
      )}

      {!selectedExam ? null : loading ? (
        <p className="text-sm text-slate-400">Loading students…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500">No students found for this class/section.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Student</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Roll</th>
                {examDetail?.subjects?.map((s) => (
                  <th key={s.subject} className="px-3 py-3 text-center font-semibold min-w-24">
                    <div>{s.subject}</div>
                    <div className="font-normal text-slate-400">/{s.max_marks}</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-left font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const user = student.user_id || {};
                const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                return (
                  <tr key={student._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2 font-medium text-slate-900">{name}</td>
                    <td className="px-4 py-2 text-slate-400">{student.roll_no || "—"}</td>
                    {examDetail?.subjects?.map((s) => (
                      <td key={s.subject} className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={s.max_marks}
                          value={marksTable[student._id]?.[s.subject] ?? ""}
                          onChange={(e) => handleMarkChange(student._id, s.subject, e.target.value)}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-200"
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <input
                        value={remarksMap[student._id] || ""}
                        onChange={(e) =>
                          setRemarksMap((prev) => ({ ...prev, [student._id]: e.target.value }))
                        }
                        placeholder="Optional…"
                        className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
