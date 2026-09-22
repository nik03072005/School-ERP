import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Bus,
  Cake,
  CalendarCheck2,
  CalendarOff,
  Compass,
  DollarSign,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

const NAV_ITEMS = [
  { to: "/student", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/attendance", label: "My Attendance", icon: CalendarCheck2 },
  { to: "/student/syllabus", label: "Curriculum & Syllabus", icon: Compass },
  { to: "/student/logbook", label: "Class Logbook", icon: BookOpen },
  { to: "/student/notices", label: "Notice Board", icon: Megaphone },
  { to: "/student/leave", label: "Leave Requests", icon: CalendarOff },
  { to: "/student/results", label: "Report Cards", icon: BarChart3 },
  { to: "/student/fees", label: "Fee Ledger", icon: DollarSign },
  { to: "/student/store", label: "My Store & Books", icon: ShoppingBag },
  { to: "/student/transport", label: "My Bus & Route", icon: Bus },
  { to: "/student/gate-passes", label: "Gate Pass & Pickup", icon: ShieldCheck },
  { to: "/student/queries", label: "Parent Queries", icon: MessageSquare },
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
    .toUpperCase() || "ST";

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 text-slate-800 lg:grid lg:grid-cols-[270px_1fr]">
      {/* ── Mobile Backdrop ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Student Sidebar (Independent Scrollbar) ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 h-full flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:h-full lg:w-auto lg:translate-x-0 lg:shadow-none overflow-hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand Header */}
        <div className="shrink-0 p-4 pb-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-4 text-white shadow-md shadow-indigo-700/20">
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">
                    Kidz Galaxy ERP
                  </p>
                  <h1 className="text-base font-black leading-tight">Student Portal</h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 text-indigo-200 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-[11px]">
              <span className="font-medium text-indigo-100 truncate max-w-[150px]">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                STUDENT
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
                      ? "bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-200/80 font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={isActive ? "text-indigo-600" : "text-slate-400"}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-700 font-bold text-white shadow-xs text-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] font-semibold text-slate-500">Student & Parent Desk</p>
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
                  {user?.first_name} {user?.last_name}
                </p>
                <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  AY 2026-27
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kidz Galaxy Student & Parent Digital Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              title="Preview School Public Website"
            >
              <Globe size={13} className="text-indigo-600" />
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
