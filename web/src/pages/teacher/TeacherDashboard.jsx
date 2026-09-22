import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Cake,
  CalendarCheck2,
  CalendarOff,
  ChevronRight,
  Megaphone,
  MessageSquare,
  NotebookPen,
  PlaySquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studentService } from "../../api/studentService";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

const ACTIONS = [
  {
    to: "/teacher/attendance",
    label: "Mark Attendance",
    desc: "1-tap morning classroom roll call & absent SMS",
    icon: CalendarCheck2,
    light: "bg-cyan-50 text-cyan-700",
    guideKey: "teacher_attendance",
  },
  {
    to: "/teacher/logbook",
    label: "Daily Logbook",
    desc: "Record lesson pacing, classwork & homework",
    icon: BookOpen,
    light: "bg-emerald-50 text-emerald-700",
    guideKey: "teacher_logbook",
  },
  {
    to: "/teacher/marks",
    label: "Marks Entry",
    desc: "Enter exam scores with automated grading",
    icon: NotebookPen,
    light: "bg-violet-50 text-violet-700",
    guideKey: "teacher_marks",
  },
  {
    to: "/teacher/learning",
    label: "Learning Content",
    desc: "Upload video lessons, notes & worksheets",
    icon: PlaySquare,
    light: "bg-amber-50 text-amber-700",
    guideKey: "teacher_logbook",
  },
  {
    to: "/teacher/parent-notes",
    label: "Parent Queries",
    desc: "Direct communication & student remarks",
    icon: MessageSquare,
    light: "bg-pink-50 text-pink-700",
    guideKey: "parent_queries",
  },
  {
    to: "/teacher/leave",
    label: "Leave Application",
    desc: "Apply for or track personal leaves",
    icon: CalendarOff,
    light: "bg-rose-50 text-rose-700",
    guideKey: "student_leave",
  },
  {
    to: "/teacher/notices",
    label: "School Notices",
    desc: "Official school bulletins & circulars",
    icon: Megaphone,
    light: "bg-blue-50 text-blue-700",
  },
  {
    to: "/teacher/settings",
    label: "Account Settings",
    desc: "Password updates & personal profile",
    icon: Settings,
    light: "bg-slate-100 text-slate-600",
  },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

  useEffect(() => {
    studentService
      .getBirthdays()
      .then(({ birthdays = [] }) => {
        setTodayBirthdays(birthdays.filter((b) => b.is_today));
        setUpcomingBirthdays(birthdays.filter((b) => !b.is_today && b.days_until <= 7));
      })
      .catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute left-1/2 -top-10 h-40 w-40 rounded-full bg-pink-500/15 blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-violet-100 backdrop-blur-xs">
                <Sparkles size={12} />
                Faculty Workspace
              </span>
              <span className="text-xs text-violet-200">{today}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="text-xs md:text-sm text-violet-100 leading-relaxed">
              Ready to guide today's learners. Mark your homeroom roll call, record today's
              lesson pacing, and review any parent messages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/teacher/attendance"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-violet-900 shadow-md transition hover:bg-violet-50 hover:shadow-lg"
            >
              <CalendarCheck2 size={16} className="text-violet-700" />
              <span>Mark Roll Call</span>
            </Link>
            <Link
              to="/teacher/logbook"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <BookOpen size={16} />
              <span>Daily Logbook</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Instructional Action Grid with Help Icons ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Faculty Quick Actions</h2>
            <p className="text-xs text-slate-500">
              Click the <span className="font-bold text-cyan-600">?</span> icon on any card for
              instant feature instructions.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.to}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-flex rounded-xl p-2.5 ${action.light}`}>
                      <Icon size={20} />
                    </div>
                    {action.guideKey && (
                      <FeatureHelpButton
                        guideKey={action.guideKey}
                        label="?"
                        className="h-6 w-6 p-0 justify-center rounded-full text-[11px]"
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition text-sm">
                    {action.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{action.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={action.to}
                    className="text-xs font-bold text-violet-700 group-hover:text-violet-900 flex items-center gap-1"
                  >
                    <span>Launch</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Student Birthday Widget ── */}
      {(todayBirthdays.length > 0 || upcomingBirthdays.length > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cake size={18} className="text-pink-500" />
              <h2 className="text-sm font-bold text-slate-900">Student Birthdays</h2>
            </div>
            <Link
              to="/teacher/birthdays"
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Today's birthdays banner */}
          {todayBirthdays.length > 0 && (
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 p-4 text-white shadow-md">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider">
                🎉 Celebrating Today in School!
              </p>
              <div className="flex flex-wrap gap-2.5">
                {todayBirthdays.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-xs"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
                      {(b.first_name?.[0] || "") + (b.last_name?.[0] || "")}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {b.first_name} {b.last_name}
                      </p>
                      <p className="text-[10px] text-white/80">
                        {b.class_name}
                        {b.section_name ? ` – ${b.section_name}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming this week */}
          {upcomingBirthdays.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Upcoming This Week
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingBirthdays.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                        {(b.first_name?.[0] || "") + (b.last_name?.[0] || "")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {b.first_name} {b.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {b.class_name}
                          {b.section_name ? ` – ${b.section_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">
                        {String(b.day).padStart(2, "0")}{" "}
                        {
                          [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                          ][b.month - 1]
                        }
                      </p>
                      <span className="text-[10px] font-semibold text-pink-600">
                        in {b.days_until}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

