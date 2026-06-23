import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BookOpen,
  Cake,
  CalendarCheck2,
  CalendarOff,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  NotebookPen,
  PlaySquare,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

const NAV_ITEMS = [
  { to: "/teacher", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck2 },
  { to: "/teacher/logbook", label: "Daily Logbook", icon: BookOpen },
  { to: "/teacher/marks", label: "Marks Entry", icon: NotebookPen },
  { to: "/teacher/learning", label: "Learning Content", icon: PlaySquare },
  { to: "/teacher/leave", label: "Leave Application", icon: CalendarOff },
  { to: "/teacher/notices", label: "Notices", icon: Megaphone },
  { to: "/teacher/parent-notes", label: "Parent Queries", icon: MessageSquare },
  { to: "/teacher/birthdays", label: "Birthdays", icon: Cake },
  { to: "/teacher/settings", label: "Settings", icon: Settings },
];

export default function TeacherLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 shadow-xl transition-transform lg:static lg:w-auto lg:translate-x-0 lg:shadow-none",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="rounded-2xl bg-linear-to-br from-violet-500 to-violet-700 p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100">
            Kidz Galaxy
          </p>
          <h1 className="mt-2 text-2xl font-bold">Teacher Portal</h1>
          <p className="mt-1 text-xs text-violet-200 font-medium truncate">
            {user?.first_name} {user?.last_name}
          </p>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </aside>

      {/* Main area */}
      <div>
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            onClick={() => setMenuOpen((p) => !p)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <div>
            <p className="text-lg font-semibold text-slate-900">Teacher Portal</p>
            <p className="text-xs text-slate-500">
              {user?.first_name} {user?.last_name} · {user?.role?.replace("_", " ")}
            </p>
          </div>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
