import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "Overview" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/school-setup", label: "School Setup" },
  { to: "/admin/attendance", label: "Attendance Ops" },
  { to: "/admin/attendance-audit", label: "Attendance Audit" },
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
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")
              }
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
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
