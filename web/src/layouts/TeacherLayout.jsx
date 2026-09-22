import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BadgeIndianRupee,
  BookOpen,
  Cake,
  CalendarCheck2,
  CalendarOff,
  Compass,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  NotebookPen,
  PlaySquare,
  Settings,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

const NAV_ITEMS = [
  { to: "/teacher", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/attendance", label: "Attendance Ops", icon: CalendarCheck2 },
  { to: "/teacher/logbook", label: "Daily Logbook", icon: BookOpen },
  { to: "/teacher/syllabus", label: "Syllabus Tracker", icon: Compass },
  { to: "/teacher/marks", label: "Marks Entry", icon: NotebookPen },
  { to: "/teacher/learning", label: "Learning Content", icon: PlaySquare },
  { to: "/teacher/gate-passes", label: "Gate Pass Approvals", icon: ShieldCheck },
  { to: "/teacher/leave", label: "Leave Application", icon: CalendarOff },
  { to: "/teacher/payslips", label: "My Payslips", icon: BadgeIndianRupee },
  { to: "/teacher/notices", label: "Notice Board", icon: Megaphone },
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

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "TC";

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 text-slate-800 lg:grid lg:grid-cols-[280px_1fr]">
      {/* ── Mobile Overlay ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Teacher Sidebar (Independent Scrollbar) ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 h-full flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:h-full lg:w-auto lg:translate-x-0 lg:shadow-none overflow-hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand Header */}
        <div className="shrink-0 p-4 pb-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-4 text-white shadow-md shadow-violet-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 p-1 backdrop-blur-xs ring-1 ring-white/20">
                  <img
                    src="/KG-LOGO.png"
                    alt="Kidz Galaxy"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                    Kidz Galaxy ERP
                  </p>
                  <h1 className="text-base font-black leading-tight">Teacher Portal</h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 text-violet-200 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-[11px]">
              <span className="font-medium text-violet-100 truncate max-w-[160px]">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                FACULTY
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List (Independent Scrollbar) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 admin-custom-scrollbar">
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
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-violet-50 text-violet-700 shadow-xs ring-1 ring-violet-200/80 font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={isActive ? "text-violet-600" : "text-slate-400"}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-600" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile & Sign Out (Fixed at bottom) */}
        <div className="shrink-0 border-t border-slate-200/80 p-3.5 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-purple-700 font-bold text-white shadow-xs text-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold uppercase text-slate-500">
                    {user?.role?.replace("_", " ") || "Faculty"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} className="transition group-hover:scale-110" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (Independent Scrollbar) ── */}
      <div className="flex h-full min-w-0 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm md:text-base font-black tracking-tight text-slate-900">
                  Teacher & Faculty Console
                </p>
                <span className="hidden sm:inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                  AY 2026-27
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kidz Galaxy Integrated ERP &bull; Academic Operations & Attendance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              title="Preview School Public Website"
            >
              <Globe size={13} className="text-violet-600" />
              <span>Public Website</span>
            </Link>

            <NotificationBell />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 admin-custom-scrollbar">
          <div className="max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
