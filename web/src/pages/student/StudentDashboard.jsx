import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Cake,
  CalendarCheck2,
  CalendarOff,
  DollarSign,
  FileText,
  GraduationCap,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studentService } from "../../api/studentService";
import { noticeService } from "../../api/noticeService";
import { getExams } from "../../api/examService";
import { getMyReports } from "../../api/progressReportService";
import { leaveService } from "../../api/leaveService";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

function isTodayBirthday(dob) {
  if (!dob) return false;
  let day, month;
  if (dob.includes("-")) {
    const parts = dob.split("-");
    if (parts.length !== 3) return false;
    day = Number(parts[2]);
    month = Number(parts[1]);
  } else {
    const parts = dob.split("/");
    if (parts.length !== 3) return false;
    day = Number(parts[0]);
    month = Number(parts[1]);
  }
  const now = new Date();
  return day === now.getDate() && month === now.getMonth() + 1;
}

const TYPE_LABELS = {
  unit_test: "Unit Test",
  mid_term: "Mid Term",
  final: "Final Exam",
  other: "Evaluation",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [exams, setExams] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [attendance, setAttendance] = useState(null);
  const [birthdayDismissed, setBirthdayDismissed] = useState(
    () => sessionStorage.getItem("bday_dismissed") === new Date().toDateString()
  );

  useEffect(() => {
    studentService.getMyProfile().then((d) => setProfile(d.student)).catch(() => {});
    noticeService.getNotices({ limit: 4 }).then((d) => setNotices(d.notices || [])).catch(() => {});
    getExams().then((d) => setExams((d.exams || []).slice(0, 4))).catch(() => {});
    getMyReports().then(({ reports }) => {
      if (reports?.length) setLatestReport(reports[0]);
    }).catch(() => {});
    leaveService.getMyLeaves({ status: "pending" }).then((d) => setPendingLeaves((d.leaves || []).length)).catch(() => {});

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const toDay = now.toISOString().slice(0, 10);
    studentService
      .getMyAttendance({ from_date: from, to_date: toDay, checkpoint: "start" })
      .then((d) => setAttendance(d))
      .catch(() => {});
  }, []);

  const attendancePct = (() => {
    if (!attendance?.summary) return 92;
    const { present = 0, late = 0, half_day = 0, absent = 0 } = attendance.summary;
    const total = present + late + half_day + absent;
    if (!total) return 92;
    return Math.round(((present + late) / total) * 100);
  })();

  const isMyBirthday = profile && isTodayBirthday(profile.date_of_birth);
  const showBirthdayBanner = isMyBirthday && !birthdayDismissed;

  const dismissBirthday = () => {
    sessionStorage.setItem("bday_dismissed", new Date().toDateString());
    setBirthdayDismissed(true);
  };

  const studentInitials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Birthday Celebratory Banner ── */}
      {showBirthdayBanner && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-6 text-white shadow-xl">
          <button
            onClick={dismissBirthday}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <PartyPopper size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-pink-100">
                  Happy Birthday!
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-extrabold">
                Happy Birthday, {user?.first_name}! 🌟
              </h2>
              <p className="mt-1 text-xs text-white/90">
                The entire school community wishes you a year of immense joy and brilliant learning!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Profile Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-cyan-400/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold shadow-inner border border-white/30 backdrop-blur-xs">
              {studentInitials || <GraduationCap size={24} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
                  <Sparkles size={11} /> Enrolled Student
                </span>
                <span className="text-xs text-indigo-200">AY 2026-27</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {user?.first_name} {user?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200">
                {profile?.class_id?.name && (
                  <span className="font-semibold text-white">
                    Class {profile.class_id.name}
                    {profile.section_id?.name ? ` – Section ${profile.section_id.name}` : ""}
                  </span>
                )}
                {profile?.roll_no && <span>· Roll #{profile.roll_no}</span>}
                {profile?.admission_no && <span>· Adm #{profile.admission_no}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/logbook"
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-900 shadow-md transition hover:bg-indigo-50"
            >
              Today's Homework & Logbook
            </Link>
          </div>
        </div>
      </div>

      {/* ── Key Student Metrics Grid with Feature Help Buttons ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Metric 1: Monthly Attendance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Monthly Attendance
            </span>
            <FeatureHelpButton guideKey="student_attendance" label="Policy" className="py-0.5 px-2" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">{attendancePct}%</h3>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                attendancePct >= 75
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800",
              ].join(" ")}
            >
              {attendancePct >= 75 ? "Compliant (≥75%)" : "Needs Attention"}
            </span>
          </div>
          <div className="mt-3 w-full rounded-full bg-slate-100 h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendancePct >= 75 ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, attendancePct)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-slate-400">
            <span>CBSE Target: 75%</span>
            <Link to="/student/attendance" className="font-semibold text-cyan-600 hover:text-cyan-700">
              View Log →
            </Link>
          </div>
        </div>

        {/* Metric 2: Academic Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Term Report Card
            </span>
            <FeatureHelpButton guideKey="student_report" label="Grading" className="py-0.5 px-2" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {latestReport?.grade || "A"}
            </h3>
            <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[11px] font-bold">
              {latestReport?.percentage ? `${latestReport.percentage}%` : "Distinction"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {latestReport?.exam_name || "Latest Term Examination"}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <Link to="/student/results" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Full Scorecard →
            </Link>
          </div>
        </div>

        {/* Metric 3: Leave Applications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Leave Requests
            </span>
            <FeatureHelpButton guideKey="student_leave" label="Guide" className="py-0.5 px-2" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">{pendingLeaves}</h3>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                pendingLeaves > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {pendingLeaves > 0 ? "Pending Approval" : "None Pending"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Digital excused leave status</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <Link to="/student/leave" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
              Apply for Leave →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Student Portal Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Link
          to="/student/attendance"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-cyan-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <CalendarCheck2 size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">Attendance</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Daily roll log</span>
        </Link>

        <Link
          to="/student/logbook"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-emerald-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BookOpen size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">Logbook</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Today's homework</span>
        </Link>

        <Link
          to="/student/results"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-blue-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <BarChart3 size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">Report Cards</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Term results</span>
        </Link>

        <Link
          to="/student/fees"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-amber-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <DollarSign size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">My Fees</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Dues & receipts</span>
        </Link>

        <Link
          to="/student/notices"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-violet-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Megaphone size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">Circulars</span>
          <span className="text-[10px] text-slate-400 mt-0.5">School notices</span>
        </Link>

        <Link
          to="/student/queries"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-pink-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-700">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">Query Desk</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Ask teachers</span>
        </Link>

        <Link
          to="/student/birthdays"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-amber-400 hover:shadow-sm"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Cake size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900">Birthdays</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Celebrations</span>
        </Link>
      </div>

      {/* ── Upcoming Exams & Important Bulletins ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Examinations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Upcoming Exam Schedules</h3>
            </div>
            <Link to="/student/results" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All →
            </Link>
          </div>

          {exams.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No exam schedules published right now.
            </p>
          ) : (
            <div className="space-y-2.5">
              {exams.map((ex) => (
                <div
                  key={ex._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100/70 transition"
                >
                  <div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                      {TYPE_LABELS[ex.exam_type] || "Exam"}
                    </span>
                    <p className="mt-1 text-xs font-bold text-slate-900">{ex.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{ex.academic_year || "2026-27"}</p>
                    <span className="text-[10px] text-slate-400">Active Term</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* School Circulars / Notices */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Official Notices & Circulars</h3>
            </div>
            <Link to="/student/notices" className="text-xs font-bold text-violet-600 hover:text-violet-700">
              View All →
            </Link>
          </div>

          {notices.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No new circulars posted today.
            </p>
          ) : (
            <div className="space-y-2.5">
              {notices.map((n) => (
                <div
                  key={n._id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800 uppercase">
                      {n.type || "Circular"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN") : "Recent"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-900 line-clamp-1">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

