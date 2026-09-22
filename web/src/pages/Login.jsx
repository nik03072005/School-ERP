import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get("role") || "admin";

  const [activeRoleTab, setActiveRoleTab] = useState(
    ["admin", "teacher", "student"].includes(initialRoleParam)
      ? initialRoleParam
      : "admin"
  );

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleDetails = {
    admin: {
      label: "Admin & Executive Console",
      desc: "Super Admin with full campus setup, admission vetting, and fee controls.",
      badge: "Full Access",
    },
    teacher: {
      label: "Teacher & Faculty Console",
      desc: "Classroom attendance roll-call, lesson logbooks, marks, and parent notes.",
      badge: "Faculty",
    },
    student: {
      label: "Student & Parent Desk",
      desc: "Student attendance ledger, fee receipts, term report cards, and notices.",
      badge: "Student / Parent",
    },
  };

  const handleRoleSelect = (roleKey) => {
    setActiveRoleTab(roleKey);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.identifier.trim() || !form.password) {
      setError("Please provide an email or mobile number, along with your password.");
      return;
    }

    setLoading(true);

    try {
      const user = await login({
        identifier: form.identifier.trim(),
        password: form.password,
      });

      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "teaching_staff" || user.role === "non_teaching_staff") {
        navigate("/teacher", { replace: true });
      } else if (user.role === "student") {
        navigate("/student", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Authentication failed. Please check your credentials or network."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans antialiased">
      {/* ── Left Pitch & Presentation Showcase (Desktop) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden p-12 text-white">
        {/* Background Image with Dark Gradient Tint */}
        <img
          src="/images/school_campus_hero.jpg"
          alt="School Campus"
          className="absolute inset-0 h-full w-full object-cover opacity-25 filter blur-xs scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-cyan-950/80" />

        {/* Top Header branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/40 p-1.5 backdrop-blur-sm group-hover:scale-105 transition">
              <img
                src="/KG-LOGO.png"
                alt="Kidz Galaxy"
                className="h-full w-full object-contain filter drop-shadow"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div>
              <span className="block text-xl font-bold tracking-tight text-white">
                Kidz Galaxy
              </span>
              <span className="block text-xs uppercase tracking-widest text-cyan-400">
                School ERP Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Value Proposition (Client Pitch Highlights) */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300">
            <Sparkles size={14} />
            <span>Modern Institutional ERP Solution</span>
          </div>

          <h2 className="text-3xl font-extrabold sm:text-4xl leading-tight">
            Intelligent School Management, Engineered for Scale.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Eliminate operational friction and unify your academic ecosystem. From
            automated fee reconciliation to digital logbooks and biometric attendance.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <CheckCircle2 size={15} />
              </div>
              <span>Real-Time Daily Attendance & Instant WhatsApp / SMS Alerts</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <CheckCircle2 size={15} />
              </div>
              <span>Automated Fee Structures, Invoicing, and Instant Receipts</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <CheckCircle2 size={15} />
              </div>
              <span>Digital Faculty Logbooks, Syllabus Pacing & Marks Entry</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <CheckCircle2 size={15} />
              </div>
              <span>Encrypted Role-Based Security for Admin, Teachers, and Students</span>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Trust Footnote */}
        <div className="relative z-10 border-t border-slate-800 pt-6 flex items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Kidz Galaxy International School</p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">All Cloud Services Operational</span>
          </div>
        </div>
      </div>

      {/* ── Right Authentication Panel ── */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center bg-slate-50 px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Back to Home Link */}
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cyan-700 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to School Website</span>
          </Link>

          {/* Form Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Sign In to ERP
              </h1>
              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-bold text-cyan-800">
                v2.4
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Select your role below or enter your registered institutional account.
            </p>
          </div>

          {/* ── Role Selector Tabs ── */}
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => handleRoleSelect("admin")}
              className={[
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition",
                activeRoleTab === "admin"
                  ? "bg-white text-cyan-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              <ShieldCheck size={14} />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("teacher")}
              className={[
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition",
                activeRoleTab === "teacher"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              <GraduationCap size={14} />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              className={[
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition",
                activeRoleTab === "student"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              <Users size={14} />
              <span>Student</span>
            </button>
          </div>

          {/* ── Active Role Information ── */}
          <div className="mb-5 rounded-2xl border border-cyan-200/80 bg-cyan-50/60 p-3.5">
            <p className="text-xs font-bold text-cyan-900">
              {roleDetails[activeRoleTab].label}
            </p>
            <p className="text-[11px] text-cyan-700">
              {roleDetails[activeRoleTab].desc}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* ── Login Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email or Mobile Number
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={form.identifier}
                  placeholder="name@school.com or 9876543210"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, identifier: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 hover:text-cyan-600 cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Authenticating Session..." : `Sign In as ${activeRoleTab.toUpperCase()}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
