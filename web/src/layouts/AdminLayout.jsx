import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BookCopy,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  {
    label: "School Setup",
    icon: Settings2,
    children: [
      { to: "/admin/school-setup/class-section", label: "Class & Section", icon: BookCopy },
      { to: "/admin/school-setup/operations", label: "Academic Operations", icon: ClipboardList },
    ],
  },
  // { to: "/admin/attendance", label: "Attendance Ops", icon: CalendarCheck2 },
  // { to: "/admin/attendance-audit", label: "Attendance Audit", icon: ShieldCheck },
];

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[280px_1fr]">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 shadow-xl transition-transform lg:static lg:w-auto lg:translate-x-0 lg:shadow-none",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="rounded-2xl bg-linear-to-br from-cyan-500 to-cyan-700 p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">School ERP</p>
          <h1 className="mt-2 text-2xl font-bold">Admin Console</h1>
        </div>

        <nav className="mt-6 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              const GroupIcon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2">
                  <p className="mb-1 flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <GroupIcon size={14} aria-hidden="true" />
                    {item.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            [
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                              isActive
                                ? "bg-cyan-100 text-cyan-700"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            ].join(" ")
                          }
                          onClick={() => setMenuOpen(false)}
                        >
                          <ChildIcon size={15} aria-hidden="true" />
                          <span>{child.label}</span>
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
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
                onClick={() => setMenuOpen(false)}
              >
                <ItemIcon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </aside>

      <div>
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <div>
            <p className="text-lg font-semibold text-slate-900">Administration</p>
            <p className="text-xs text-slate-500">
              {user?.first_name} {user?.last_name} ({user?.role})
            </p>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
