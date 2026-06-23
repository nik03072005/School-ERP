import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studentService } from "../../api/studentService";

const ACTIONS = [
  {
    to: "/teacher/attendance",
    label: "Mark Attendance",
    desc: "Record today's class attendance",
    icon: CalendarCheck2,
    gradient: "from-cyan-500 to-cyan-600",
    light: "bg-cyan-50 text-cyan-700",
  },
  {
    to: "/teacher/logbook",
    label: "Daily Logbook",
    desc: "Log classwork & homework entries",
    icon: BookOpen,
    gradient: "from-emerald-500 to-emerald-600",
    light: "bg-emerald-50 text-emerald-700",
  },
  {
    to: "/teacher/marks",
    label: "Marks Entry",
    desc: "Enter exam marks for students",
    icon: NotebookPen,
    gradient: "from-violet-500 to-violet-600",
    light: "bg-violet-50 text-violet-700",
  },
  {
    to: "/teacher/learning",
    label: "Learning Content",
    desc: "Upload videos, audios & documents",
    icon: PlaySquare,
    gradient: "from-amber-500 to-amber-600",
    light: "bg-amber-50 text-amber-700",
  },
  {
    to: "/teacher/leave",
    label: "Leave Application",
    desc: "Apply for or track your leaves",
    icon: CalendarOff,
    gradient: "from-rose-500 to-rose-600",
    light: "bg-rose-50 text-rose-700",
  },
  {
    to: "/teacher/notices",
    label: "Notices",
    desc: "View school announcements",
    icon: Megaphone,
    gradient: "from-blue-500 to-blue-600",
    light: "bg-blue-50 text-blue-700",
  },
  {
    to: "/teacher/parent-notes",
    label: "Parent Queries",
    desc: "Respond to parent messages",
    icon: MessageSquare,
    gradient: "from-pink-500 to-pink-600",
    light: "bg-pink-50 text-pink-700",
  },
  {
    to: "/teacher/settings",
    label: "Settings",
    desc: "Profile info & change password",
    icon: Settings,
    gradient: "from-slate-500 to-slate-600",
    light: "bg-slate-100 text-slate-600",
  },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

  useEffect(() => {
    studentService.getBirthdays().then(({ birthdays = [] }) => {
      setTodayBirthdays(birthdays.filter((b) => b.is_today));
      setUpcomingBirthdays(birthdays.filter((b) => !b.is_today && b.days_until <= 7));
    }).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-linear-to-br from-violet-600 to-violet-800 p-6 text-white md:p-8">
        <p className="text-sm font-medium text-violet-200">{today}</p>
        <h1 className="mt-2 text-3xl font-bold">
          Welcome back, {user?.first_name}! 👋
        </h1>
        <p className="mt-1 text-violet-200">
          {user?.role?.replace("_", " ")} · Kidz Galaxy School
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/teacher/attendance"
            className="rounded-2xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition"
          >
            Mark Today's Attendance →
          </Link>
          <Link
            to="/teacher/logbook"
            className="rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            Open Logbook →
          </Link>
        </div>
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-violet-200"
              >
                <div className={`inline-flex w-fit rounded-xl p-3 ${action.light}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-violet-700 transition">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-snug">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Birthday widget */}
      {(todayBirthdays.length > 0 || upcomingBirthdays.length > 0) && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Cake size={18} className="text-pink-500" /> Birthdays
            </h2>
            <Link
              to="/teacher/birthdays"
              className="flex items-center gap-1 text-sm font-medium text-pink-500 hover:text-pink-600"
            >
              View calendar <ChevronRight size={14} />
            </Link>
          </div>

          {/* Today's birthdays — celebratory banner */}
          {todayBirthdays.length > 0 && (
            <div className="mb-3 overflow-hidden rounded-2xl bg-linear-to-r from-pink-500 via-rose-500 to-orange-400 p-4 text-white shadow-md">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                🎉 Celebrating Today!
              </p>
              <div className="flex flex-wrap gap-2">
                {todayBirthdays.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
                      {(b.first_name?.[0] || "") + (b.last_name?.[0] || "")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {b.first_name} {b.last_name}
                      </p>
                      <p className="text-[10px] text-white/70">
                        {b.class_name}{b.section_name ? ` – ${b.section_name}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming this week */}
          {upcomingBirthdays.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-700">Upcoming This Week</p>
              </div>
              <div className="divide-y divide-slate-50">
                {upcomingBirthdays.map((b) => (
                  <div key={b._id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                      {(b.first_name?.[0] || "") + (b.last_name?.[0] || "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {b.first_name} {b.last_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {b.class_name}{b.section_name ? ` – ${b.section_name}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700">
                        {String(b.day).padStart(2, "0")}{" "}
                        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][b.month - 1]}
                      </p>
                      <p className="text-[11px] font-medium text-pink-500">in {b.days_until}d</p>
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
