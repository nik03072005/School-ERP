import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Cake,
  CalendarCheck2,
  CalendarOff,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

const NAV_ITEMS = [
  { to: "/student", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/attendance", label: "Attendance", icon: CalendarCheck2 },
  { to: "/student/logbook", label: "Daily Logbook", icon: BookOpen },
  { to: "/student/notices", label: "Notices", icon: Megaphone },
  { to: "/student/leave", label: "Leave", icon: CalendarOff },
  { to: "/student/results", label: "My Results", icon: BarChart3 },
  { to: "/student/queries", label: "Queries", icon: MessageSquare },
  { to: "/student/birthdays", label: "Birthdays", icon: Cake },
];

export default function StudentLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[268px_1fr]">
      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white flex flex-col shadow-xl transition-transform lg:static lg:w-auto lg:translate-x-0 lg:shadow-none",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="m-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
            Kidz Galaxy
          </p>
          <h1 className="mt-1 text-xl font-bold">Student Portal</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {initials || <GraduationCap size={16} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-indigo-200">Student</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <p className="text-base font-semibold text-slate-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500">Student Dashboard</p>
          </div>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
