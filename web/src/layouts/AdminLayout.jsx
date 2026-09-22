import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Award,
  BarChart3,
  BookCopy,
  BookMarked,
  BookOpen,
  Bus,
  Cake,
  CalendarCheck2,
  CalendarOff,
  ChevronDown,
  ClipboardList,
  Compass,
  DollarSign,
  Globe,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  Layers,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  NotebookPen,
  Package,
  PlaySquare,
  Search,
  Settings2,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Tag,
  Truck,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

const NAV_GROUPS = [
  {
    group: "Command Center",
    items: [
      { to: "/admin", end: true, label: "Overview Hub", icon: LayoutDashboard, badge: "Live" },
      { to: "/admin/users", label: "User Accounts", icon: Users },
    ],
  },
  {
    group: "People & Admissions",
    items: [
      { to: "/admin/students", label: "Student Directory", icon: GraduationCap },
      { to: "/admin/staff", label: "Staff Roster", icon: UserCheck },
      { to: "/admin/tc-generator", label: "TC Generator", icon: Award, badge: "Live" },
      { to: "/admin/birthdays", label: "Birthdays", icon: Cake },
    ],
  },
  {
    group: "Academic Operations",
    items: [
      {
        label: "School Structure",
        icon: Settings2,
        children: [
          { to: "/admin/school-setup/class-section", label: "Class & Section", icon: BookCopy },
          { to: "/admin/school-setup/operations", label: "Operations & Timetable", icon: ClipboardList },
          { to: "/admin/subjects", label: "Subject Master", icon: BookMarked },
        ],
      },
      { to: "/admin/syllabus", label: "Syllabus Tracker", icon: Compass, badge: "CBSE" },
      { to: "/admin/attendance", label: "Attendance Ops", icon: CalendarCheck2 },
      { to: "/admin/attendance-audit", label: "Attendance Audit", icon: ShieldCheck },
      { to: "/admin/logbook", label: "Daily Logbook", icon: BookOpen },
      { to: "/admin/exams", label: "Exam Schedules", icon: NotebookPen },
      { to: "/admin/progress-reports", label: "Progress Reports", icon: BarChart3 },
      { to: "/admin/learning", label: "Learning Goals", icon: PlaySquare },
    ],
  },
  {
    group: "Campus Safety",
    items: [
      { to: "/admin/campus-security", label: "Gate Pass & Visitors", icon: ShieldCheck, badge: "POCSO" },
    ],
  },
  {
    group: "Fleet & Logistics",
    items: [
      { to: "/admin/transport", label: "Transport & Routes", icon: Bus, badge: "Fleet" },
    ],
  },
  {
    group: "Store & Inventory",
    items: [
      {
        label: "Inventory & Store",
        icon: Package,
        children: [
          { to: "/admin/inventory", end: true, label: "Store Overview", icon: LayoutDashboard },
          { to: "/admin/inventory/items", label: "Stock Catalog", icon: Shirt },
          { to: "/admin/inventory/distribution", label: "Student POS / Sale", icon: ShoppingBag },
          { to: "/admin/inventory/register", label: "Distribution Register", icon: ClipboardList },
          { to: "/admin/inventory/purchases", label: "Inward & Vendors", icon: Truck },
          { to: "/admin/inventory/kits", label: "Class Kits & Bundles", icon: Layers },
        ],
      },
    ],
  },
  {
    group: "Fee & Revenue",
    items: [
      {
        label: "Fee Management",
        icon: DollarSign,
        children: [
          { to: "/admin/fees/heads", label: "Fee Heads", icon: Tag },
          { to: "/admin/fees/structures", label: "Fee Structures", icon: Layers },
          { to: "/admin/fees/assignments", label: "Assignments & Dues", icon: Users },
          { to: "/admin/fees/collection", label: "Fee Collection", icon: Wallet },
        ],
      },
    ],
  },
  {
    group: "Payroll & HRMS",
    items: [
      {
        label: "Staff Payroll",
        icon: IndianRupee,
        children: [
          { to: "/admin/payroll", end: true, label: "Payroll Dashboard", icon: Wallet },
        ],
      },
    ],
  },
  {
    group: "Communications & Queries",
    items: [
      { to: "/admin/notices", label: "Notice Board", icon: Megaphone },
      { to: "/admin/leaves", label: "Leave Requests", icon: CalendarOff },
      { to: "/admin/parent-notes", label: "Parent Queries", icon: MessageSquare },
    ],
  },
];

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userInitials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "AD";

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50/70 text-slate-800 lg:grid lg:grid-cols-[290px_1fr]">
      {/* ── Mobile Backdrop ── */}
      {menuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* ── Executive Modern Sidebar (Independent Scrollbar) ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[290px] h-full flex-col border-r border-slate-200/80 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:h-full lg:w-auto lg:translate-x-0 lg:shadow-none overflow-hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand Header */}
        <div className="shrink-0 p-5 pb-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 p-4 text-white shadow-lg shadow-cyan-950/20">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/15 blur-xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur-md ring-1 ring-white/20">
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
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">
                    Kidz Galaxy ERP
                  </span>
                  <h1 className="text-base font-black tracking-tight text-white">Admin Console</h1>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
              <span className="font-medium text-cyan-200/90">Session 2026-27</span>
              <span className="rounded-md bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-100 ring-1 ring-cyan-400/30">
                PRO ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Quick Nav Search Filter */}
        <div className="shrink-0 px-5 py-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Jump to section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-0 w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>

        {/* Navigation List (Independent Scrollbar) */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-4 text-xs admin-custom-scrollbar">
          {NAV_GROUPS.map((group) => {
            const filteredItems = group.items.filter((item) => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              if (item.label.toLowerCase().includes(q)) return true;
              if (item.children && item.children.some((c) => c.label.toLowerCase().includes(q))) return true;
              return false;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.group}
                </p>

                {filteredItems.map((item) => {
                  if (item.children) {
                    const GroupIcon = item.icon;
                    const isAnyChildActive = item.children.some((child) =>
                      location.pathname.startsWith(child.to)
                    );

                    return (
                      <div
                        key={item.label}
                        className={`rounded-xl border transition-all ${
                          isAnyChildActive
                            ? "border-cyan-200/90 bg-cyan-50/40 p-1.5 shadow-xs"
                            : "border-slate-200/60 bg-slate-50/50 p-1.5"
                        }`}
                      >
                        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-2">
                            <GroupIcon size={14} className={isAnyChildActive ? "text-cyan-600" : "text-slate-400"} />
                            {item.label}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400">Sub-menu</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) =>
                                  [
                                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                                    isActive
                                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-sm shadow-cyan-600/30"
                                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                                  ].join(" ")
                                }
                              >
                                <ChildIcon size={13} aria-hidden="true" />
                                <span className="truncate">{child.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        [
                          "group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                          isActive
                            ? "bg-cyan-500/10 text-cyan-800 shadow-xs ring-1 ring-cyan-500/30 font-bold"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ItemIcon
                              size={16}
                              className={`shrink-0 transition-colors ${
                                isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge ? (
                            <span className="ml-2 rounded-full bg-cyan-100 px-1.5 py-0.2 text-[9px] font-bold text-cyan-700">
                              {item.badge}
                            </span>
                          ) : isActive ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Footer Profile & Logout (Fixed at bottom of sidebar) */}
        <div className="shrink-0 border-t border-slate-200/80 p-4 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 font-bold text-white shadow-xs">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold uppercase text-slate-500">
                    {user?.role || "Administrator"}
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
        <header className="shrink-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:px-6">
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
                  Institutional Admin Console
                </p>
                <span className="hidden sm:inline-flex items-center rounded-full bg-cyan-50 border border-cyan-200/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-700">
                  AY 2026-27
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500">
                Kidz Galaxy Integrated ERP &bull; School Administration & Student Records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              title="Preview School Public Website"
            >
              <Globe size={13} className="text-cyan-600" />
              <span className="hidden sm:inline">Public Site</span>
            </Link>

            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 admin-custom-scrollbar">
          <div className="max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
