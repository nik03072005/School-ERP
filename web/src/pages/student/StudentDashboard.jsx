import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Cake,
  CalendarCheck2,
  CalendarOff,
  ChevronRight,
  GraduationCap,
  Megaphone,
  MessageSquare,
  PartyPopper,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studentService } from "../../api/studentService";
import { noticeService } from "../../api/noticeService";
import { getExams } from "../../api/examService";
import { getMyReports } from "../../api/progressReportService";
import { leaveService } from "../../api/leaveService";

// Parse DOB from "YYYY-MM-DD" (HTML date input) or "DD/MM/YYYY" (legacy)
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
  final: "Final",
  other: "Other",
};

const NOTICE_TYPE_COLORS = {
  general: "bg-slate-100 text-slate-600",
  academic: "bg-blue-100 text-blue-700",
  event: "bg-violet-100 text-violet-700",
  urgent: "bg-red-100 text-red-700",
  holiday: "bg-green-100 text-green-700",
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

    getExams()
      .then((d) => setExams((d.exams || []).slice(0, 4)))
      .catch(() => {});

    getMyReports()
      .then(({ reports }) => {
        if (reports?.length) setLatestReport(reports[0]);
      })
      .catch(() => {});

    leaveService
      .getMyLeaves({ status: "pending" })
      .then((d) => setPendingLeaves((d.leaves || []).length))
      .catch(() => {});

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const toDay = now.toISOString().slice(0, 10);
    studentService
      .getMyAttendance({ from_date: from, to_date: toDay, checkpoint: "start" })
      .then((d) => setAttendance(d))
      .catch(() => {});
  }, []);

  const attendancePct = (() => {
    if (!attendance?.summary) return null;
    const { present = 0, late = 0, half_day = 0, absent = 0 } = attendance.summary;
    const total = present + late + half_day + absent;
    if (!total) return null;
    return Math.round(((present + late) / total) * 100);
  })();

  const GRADE_COLORS = {
    A: "text-green-600",
    B: "text-cyan-600",
    C: "text-amber-600",
    D: "text-red-600",
  };

  const isMyBirthday = profile && isTodayBirthday(profile.date_of_birth);
  const showBirthdayBanner = isMyBirthday && !birthdayDismissed;

  const dismissBirthday = () => {
    sessionStorage.setItem("bday_dismissed", new Date().toDateString());
    setBirthdayDismissed(true);
  };

  return (
    <div className="space-y-6">
      {/* Birthday wish banner */}
      {showBirthdayBanner && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-pink-500 via-rose-500 to-orange-400 p-5 text-white shadow-xl">
          {/* Decorative emojis */}
          <div className="pointer-events-none absolute -right-4 -top-4 select-none text-[90px] leading-none opacity-15">🎂</div>
          <div className="pointer-events-none absolute bottom-0 left-8 select-none text-[60px] leading-none opacity-10">🎉</div>

          <button
            onClick={dismissBirthday}
            className="absolute right-3 top-3 rounded-full bg-white/20 p-1 text-white/80 hover:bg-white/30"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <PartyPopper size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Happy Birthday!
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-extrabold">
                🎉 {user?.first_name}, it's your special day!
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Wishing you a wonderful birthday filled with joy and laughter.
                The whole school wishes you the very best! 🌟
              </p>
              <Link
                to="/student/birthdays"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
              >
                <Cake size={13} /> See who else is celebrating
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero welcome card */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-sm font-medium text-indigo-200">Welcome back,</p>
          <h1 className="mt-1 text-2xl font-bold">
            {user?.first_name} {user?.last_name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-indigo-100">
            {profile?.class_id?.name && (
              <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                <GraduationCap size={13} />
                {profile.class_id.name}
                {profile.section_id?.name ? ` – ${profile.section_id.name}` : ""}
              </span>
            )}
            {profile?.roll_no && (
              <span className="rounded-lg bg-white/10 px-2.5 py-1">
                Roll #{profile.roll_no}
              </span>
            )}
            {profile?.admission_no && (
              <span className="rounded-lg bg-white/10 px-2.5 py-1">
                Adm #{profile.admission_no}
              </span>
            )}
          </div>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 right-16 h-28 w-28 rounded-full bg-white/5" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="This Month"
          value={attendancePct !== null ? `${attendancePct}%` : "—"}
          sub="Attendance"
          icon={CalendarCheck2}
          color="indigo"
          to="/student/attendance"
        />
        <StatCard
          label="Pending"
          value={pendingLeaves}
          sub="Leave Applications"
          icon={CalendarOff}
          color="amber"
          to="/student/leave"
        />
        <StatCard
          label="Notices"
          value={notices.length}
          sub="Active Notices"
          icon={Megaphone}
          color="violet"
          to="/student/notices"
        />
        <StatCard
          label="Latest Grade"
          value={
            latestReport?.overall_grade ? (
              <span className={GRADE_COLORS[latestReport.overall_grade] || "text-slate-700"}>
                {latestReport.overall_grade}
              </span>
            ) : (
              "—"
            )
          }
          sub={latestReport?.percentage != null ? `${latestReport.percentage}%` : "No results yet"}
          icon={BarChart3}
          color="green"
          to="/student/results"
        />
      </div>

      {/* Content grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Notices */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-violet-600" />
              <p className="text-sm font-semibold text-slate-800">Recent Notices</p>
            </div>
            <Link to="/student/notices" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50 p-2">
            {notices.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No notices available</p>
            ) : (
              notices.map((n) => (
                <div key={n._id} className="flex items-start gap-3 rounded-xl px-3 py-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${NOTICE_TYPE_COLORS[n.type] || NOTICE_TYPE_COLORS.general}`}
                  >
                    {n.type}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  {n.is_pinned && (
                    <span className="ml-auto shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                      Pinned
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" />
              <p className="text-sm font-semibold text-slate-800">Upcoming Exams</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50 p-2">
            {exams.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No upcoming exams scheduled</p>
            ) : (
              exams.map((exam) => (
                <div key={exam._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <span className="text-[10px] font-bold text-indigo-600 text-center uppercase leading-tight">
                      {(TYPE_LABELS[exam.exam_type] || "Exam").slice(0, 3)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{exam.name}</p>
                    <p className="text-xs text-slate-400">
                      {exam.class_id?.name || ""}
                      {exam.academic_year ? ` · ${exam.academic_year}` : ""}
                      {exam.subjects?.length ? ` · ${exam.subjects.length} subjects` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { to: "/student/logbook", label: "View Logbook", icon: BookOpen, color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100" },
            { to: "/student/leave", label: "Apply Leave", icon: CalendarOff, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
            { to: "/student/results", label: "My Results", icon: BarChart3, color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { to: "/student/queries", label: "Send Query", icon: MessageSquare, color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${color}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className={`w-fit rounded-xl p-2 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
    </Link>
  );
}
