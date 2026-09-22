import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  FileText,
  GraduationCap,
  Layers,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    parentName: "",
    phone: "",
    email: "",
    studentGrade: "Grade 1",
    message: "",
  });

  const [activeFacilityTab, setActiveFacilityTab] = useState(0);

  const facilities = [
    {
      title: "Interactive Smart Classrooms",
      subtitle: "Digital Learning & Smart Boards",
      description:
        "Ergonomically designed classrooms equipped with interactive 4K smart panels, adaptive learning stations, and collaborative student pods that ignite curiosity.",
      image: "/images/smart_classroom.jpg",
      tags: ["Touchscreen Displays", "High-speed Wi-Fi", "Ergonomic Seating"],
    },
    {
      title: "STEM Robotics & AI Discovery Lab",
      subtitle: "Hands-on Innovation & Prototyping",
      description:
        "Students code autonomous rovers, assemble IoT micro-controllers, and construct 3D models in an inspiring makerspace fostering 21st-century problem solving.",
      image: "/images/stem_robotics_lab.jpg",
      tags: ["Modular Robotics", "3D Printing", "Coding & Electronics"],
    },
    {
      title: "Knowledge Commons & Library Hub",
      subtitle: "Expansive Reading & Media Center",
      description:
        "A multi-level architectural sanctuary housing over 20,000 literary volumes, digital academic databases, quiet study alcoves, and collaborative research pods.",
      image: "/images/modern_school_library.jpg",
      tags: ["20,000+ Books", "Digital Subscriptions", "Quiet Study Pods"],
    },
    {
      title: "Olympic-Standard Sports Arena",
      subtitle: "Athletics, Fitness & Team Sports",
      description:
        "Professional 400m synthetic running track, FIFA-standard football pitch, basketball courts, and indoor sports pavilions driven by certified NIS coaches.",
      image: "/images/sports_complex.jpg",
      tags: ["All-Weather Track", "Football Turf", "Certified Coaches"],
    },
    {
      title: "Vibrant Campus Life & Community",
      subtitle: "Holistic Development & Mentorship",
      description:
        "A nurturing, inclusive ecosystem where dedicated teachers walk alongside learners, promoting leadership, performing arts, and global citizenship.",
      image: "/images/school_community.jpg",
      tags: ["Leadership Clubs", "Performing Arts", "15:1 Ratio"],
    },
  ];

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setInquiryModalOpen(false);
      setInquiryForm({
        parentName: "",
        phone: "",
        email: "",
        studentGrade: "Grade 1",
        message: "",
      });
    }, 2500);
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "teaching_staff" || user.role === "non_teaching_staff") return "/teacher";
    if (user.role === "student") return "/student";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-cyan-500 selection:text-white">
      {/* ── Top Announcement & Helpline Bar ── */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 px-4 py-2 text-xs text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-0.5 font-medium text-cyan-300">
              <Sparkles size={12} className="text-cyan-400" />
              Admissions 2026-27 Open
            </span>
            <span className="hidden sm:inline text-slate-400">
              Limited seats available from Nursery to Grade 12
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-slate-400">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <Phone size={12} />
              <span>+91 98765 43210</span>
            </a>
            <a
              href="mailto:admissions@kidzgalaxy.edu"
              className="hidden md:flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <Mail size={12} />
              <span>admissions@kidzgalaxy.edu</span>
            </a>
            <span className="hidden lg:inline text-slate-500">
              CBSE Affiliation No. 1930482
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Header ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 p-1.5 shadow-md shadow-cyan-600/20 transition group-hover:scale-105">
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
              <span className="block text-lg font-bold tracking-tight text-slate-900 group-hover:text-cyan-700 transition">
                Kidz Galaxy
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-600">
                International School
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition"
            >
              About
            </a>
            <a
              href="#erp-portals"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition"
            >
              ERP Portals
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition"
            >
              ERP Features
            </a>
            <a
              href="#facilities"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition"
            >
              Campus Tour
            </a>
            <a
              href="#academics"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition"
            >
              Academics
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition"
            >
              Contact
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() => setInquiryModalOpen(true)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 shadow-xs"
            >
              Admission Inquiry
            </button>

            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg"
              >
                <span>Enter Workspace</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg"
              >
                <LogIn size={14} />
                <span>ERP Portal Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-xl lg:hidden">
            <nav className="flex flex-col gap-3">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                About School
              </a>
              <a
                href="#erp-portals"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ERP Portals
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ERP System Features
              </a>
              <a
                href="#facilities"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Campus Facilities
              </a>
              <a
                href="#academics"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Academic Programs
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Contact & Location
              </a>

              <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setInquiryModalOpen(true);
                  }}
                  className="w-full rounded-xl border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-700"
                >
                  Admission Inquiry
                </button>
                <Link
                  to={isAuthenticated ? getDashboardLink() : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-cyan-600 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-cyan-600/20"
                >
                  {isAuthenticated ? "Enter Workspace" : "ERP Portal Login"}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-100/70 via-cyan-50/40 to-slate-50 py-16 sm:py-24">
        {/* Background Decorative Blobs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/90 px-3.5 py-1.5 text-xs font-semibold text-cyan-800 shadow-xs">
                <Sparkles size={14} className="text-cyan-600" />
                <span>Next-Gen Smart Campus Ecosystem</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.12]">
                Inspiring <span className="gradient-text-brand">Excellence</span>.
                <br />
                Powered by Smart Campus ERP.
              </h1>

              <p className="max-w-xl text-base text-slate-600 sm:text-lg leading-relaxed">
                Welcome to Kidz Galaxy International School. Where innovative
                pedagogy meets world-class infrastructure and intelligent,
                paperless campus workflows for students, parents, and educators.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#erp-portals"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/30 transition hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <LogIn size={18} />
                  <span>Access ERP Portals</span>
                </a>

                <a
                  href="#facilities"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-400"
                >
                  <Compass size={18} className="text-slate-500" />
                  <span>Explore Campus</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-slate-200/80">
                <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">99.4%</p>
                    <p className="text-xs text-slate-500">Board Distinction</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">2,800+</p>
                    <p className="text-xs text-slate-500">Active Learners</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-600">100%</p>
                    <p className="text-xs text-slate-500">Paperless ERP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right Visuals with Floating Widgets */}
            <div className="relative lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main Hero Campus Image */}
                <div className="overflow-hidden rounded-3xl border-4 border-white shadow-2xl transition hover:shadow-3xl">
                  <img
                    src="/images/school_campus_hero.jpg"
                    alt="Kidz Galaxy Campus Architecture"
                    className="h-[380px] sm:h-[440px] w-full object-cover transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      Kidz Galaxy Main Campus
                    </p>
                    <p className="text-sm font-medium text-slate-100">
                      State-of-the-art 12-Acre Green Smart Campus
                    </p>
                  </div>
                </div>

                {/* Floating Glassmorphic Pill 1 - Attendance & Security */}
                <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-xl backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CalendarCheck2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Smart Roll-Call Active
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ● Real-time Parent App Sync
                    </p>
                  </div>
                </div>

                {/* Floating Glassmorphic Pill 2 - Academic Excellence */}
                <div className="absolute -top-6 -right-6 hidden sm:flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-xl backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Award size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      Ranked #1 Smart School
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ERP Portals Gateway Section (Pitch Focal Point) ── */}
      <section id="erp-portals" className="scroll-mt-16 py-16 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="badge-pill badge-cyan mb-2">Integrated Access Hub</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Direct Gateway to Your Digital ERP Portals
            </h2>
            <p className="mt-3 text-base text-slate-600">
              One unified platform delivering tailored role-based access for school
              leadership, teaching faculty, parents, and students.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Portal 1: Administrator Console */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-7 transition duration-300 hover:border-cyan-400 hover:bg-white hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-md shadow-cyan-600/30 group-hover:scale-105 transition">
                    <ShieldCheck size={26} />
                  </div>
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-bold text-cyan-800 uppercase tracking-wider">
                    Executive
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-700 transition">
                  Admin & Management
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Total administrative control over admissions vetting, fee billing & collection,
                  staff assignments, daily attendance audit, timetable operations, and analytics.
                </p>

                <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-200/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-cyan-600" />
                    <span>Admissions Verification & Approval</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-cyan-600" />
                    <span>Fee Structure & Payment Invoicing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-cyan-600" />
                    <span>Campus Operations & Staff Records</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <Link
                  to="/login?role=admin"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-700 group-hover:shadow-lg"
                >
                  <span>Launch Admin Portal</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Portal 2: Teacher & Faculty Portal */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-7 transition duration-300 hover:border-violet-400 hover:bg-white hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-600/30 group-hover:scale-105 transition">
                    <GraduationCap size={26} />
                  </div>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-800 uppercase tracking-wider">
                    Academic
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-700 transition">
                  Teacher & Faculty Console
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Streamlined instructional workflows: mark daily classroom attendance, log syllabus
                  pacing, input exam marks, issue circulars, and reply to parent queries.
                </p>

                <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-200/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-violet-600" />
                    <span>Digital Roll-Call & Absentee Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-violet-600" />
                    <span>Daily Teaching Logbook & Syllabus</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-violet-600" />
                    <span>Exam Marks Entry & Parent Notes</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <Link
                  to="/login?role=teacher"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 group-hover:shadow-lg"
                >
                  <span>Launch Teacher Portal</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Portal 3: Student & Parent Desk */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-7 transition duration-300 hover:border-emerald-400 hover:bg-white hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition">
                    <Users size={26} />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Parent & Student
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Student & Parent Portal
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time transparent updates on student attendance, fee receipts and balances,
                  examination scorecards, homework logbooks, leave applications, and announcements.
                </p>

                <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-200/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Real-time Attendance Status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Instant Digital Fee Receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Download Term Report Cards</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <Link
                  to="/login?role=student"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 group-hover:shadow-lg"
                >
                  <span>Launch Student Portal</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enterprise ERP Features Grid (Designed to pitch to clients) ── */}
      <section id="features" className="scroll-mt-16 py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill badge-indigo mb-2">Robust Infrastructure</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Engineered for Modern School Operations
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Eliminate administrative bottlenecks, reduce paperwork by 90%, and foster
              collaborative learning with our full-spectrum educational platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <CalendarCheck2 size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Attendance & Real-Time SMS
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                One-tap mobile roll call for teachers with automated instant absent alerts sent
                to parents via notification and SMS.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <DollarSign size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Smart Fee Management
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Configurable fee heads, class-wise structures, fine calculations, digital receipt
                generation, and real-time ledger auditing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Exams & Report Cards
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Centralized exam schedule publishing, streamlined marks entry, automated grading,
                and beautiful printable progress reports.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <BookOpen size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Digital Teacher Logbook
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Daily syllabus pacing, topics completed, homework assignments, and teacher notes
                accessible instantly by school leadership.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Layers size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Admissions & Student Records
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                End-to-end digital lifecycle: online registration forms, document uploads, review &
                approval workflows, and section allocations.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Role-Based Security & Audit
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Granular permissions for Principal, Vice Principal, Accountants, Class Teachers,
                and Parents with encrypted session controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Campus Facilities Showcase (Using Generated Images!) ── */}
      <section id="facilities" className="scroll-mt-16 py-20 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="badge-pill badge-emerald mb-2">World-Class Infrastructure</span>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Experience Our Modern Campus
              </h2>
              <p className="mt-2 text-base text-slate-600 max-w-xl">
                Purpose-built spaces designed to foster innovation, academic focus, athletic
                vitality, and collaborative exploration.
              </p>
            </div>

            {/* Facility Tab Buttons */}
            <div className="flex flex-wrap gap-2">
              {facilities.map((fac, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFacilityTab(idx)}
                  className={[
                    "rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                    activeFacilityTab === idx
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {fac.title.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Active Facility Display Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-2xl">
            <div className="grid lg:grid-cols-12 items-stretch">
              <div className="relative lg:col-span-7 h-72 sm:h-96 lg:h-[480px]">
                <img
                  src={facilities[activeFacilityTab].image}
                  alt={facilities[activeFacilityTab].title}
                  className="h-full w-full object-cover transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:hidden" />
              </div>

              <div className="flex flex-col justify-between p-8 lg:col-span-5 lg:p-12 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                    {facilities[activeFacilityTab].subtitle}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold sm:text-3xl text-white">
                    {facilities[activeFacilityTab].title}
                  </h3>
                  <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                    {facilities[activeFacilityTab].description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {facilities[activeFacilityTab].tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-800/90 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Showing facility {activeFacilityTab + 1} of {facilities.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setActiveFacilityTab((prev) =>
                          prev === 0 ? facilities.length - 1 : prev - 1
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setActiveFacilityTab((prev) =>
                          prev === facilities.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Academic Programs Section ── */}
      <section id="academics" className="scroll-mt-16 py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill badge-amber mb-2">Curriculum Pathways</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Nurturing Learners at Every Milestone
            </h2>
            <p className="mt-3 text-base text-slate-600">
              A carefully sequenced developmental journey designed to build foundational literacy,
              scientific curiosity, and analytical leadership.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Level 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:-translate-y-1 transition duration-300">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Ages 3 - 5
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Early Years (KG)</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Play-based inquiry, phonics foundation, emotional regulation, and joyful motor skill
                exploration.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Focus: Curiosity & Phonics
              </div>
            </div>

            {/* Level 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:-translate-y-1 transition duration-300">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                Grades 1 - 5
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Primary Wing</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Core numeracy, multilingual reading, experimental science discovery, and
                foundational computational thinking.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Focus: Core Literacy & STEM
              </div>
            </div>

            {/* Level 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:-translate-y-1 transition duration-300">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                Grades 6 - 8
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Middle School</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Higher-order reasoning, robotics lab projects, humanities synthesis, and inter-school
                athletic participation.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Focus: Critical Reasoning
              </div>
            </div>

            {/* Level 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:-translate-y-1 transition duration-300">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Grades 9 - 12
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Senior Secondary</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Rigorous CBSE board syllabus mastery, competitive entrance preparation, leadership
                councils, and career mentorship.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Focus: Academic Distinction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="badge-pill badge-cyan mb-2">Community Voices</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Trusted by Parents & Educators
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xs">
              <div className="flex text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "The school ERP system has completely transformed how we follow our daughter's
                growth. Getting instant attendance updates, viewing report cards, and downloading
                fee receipts in one tap gives us complete peace of mind."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-900">Priya & Rajesh Sharma</p>
                <p className="text-xs text-slate-500">Parents of Grade 7 Student</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xs">
              <div className="flex text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "As a senior mathematics teacher, the digital logbook and exam marks entry module
                have saved our department hundreds of hours of repetitive paperwork so we can focus
                on teaching students."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-900">Dr. Anand Verma</p>
                <p className="text-xs text-slate-500">Head of Science & Mathematics</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xs">
              <div className="flex text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "Kidz Galaxy's management console provides executive oversight on fee collection,
                teacher pacing, and student welfare in real time. It is a benchmark in school
                operational excellence."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-900">Meenakshi Sundaram</p>
                <p className="text-xs text-slate-500">School Managing Director</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ── */}
      <section className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to Experience Next-Generation Campus Management?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-cyan-100 sm:text-lg">
            Schedule a school tour, apply for admission, or launch the ERP management console to
            explore our digital workflows.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition hover:bg-cyan-50"
            >
              <LogIn size={18} className="text-cyan-700" />
              <span>Login to School ERP</span>
            </Link>

            <button
              onClick={() => setInquiryModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <FileText size={18} />
              <span>Submit Admission Inquiry</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Comprehensive Footer ── */}
      <footer id="contact" className="bg-slate-950 text-slate-400 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 pb-12 border-b border-slate-800">
            {/* Brand column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 p-1">
                  <img
                    src="/KG-LOGO.png"
                    alt="Kidz Galaxy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="block text-lg font-bold text-white">Kidz Galaxy</span>
                  <span className="block text-xs uppercase tracking-widest text-cyan-400">
                    International School
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                A premier international day-school dedicated to fostering intellectual curiosity,
                character, and global citizenship, powered by intelligent campus technology.
              </p>
              <div className="text-xs text-slate-500">
                CBSE Affiliation Code: 1930482 | School Code: 45210
              </div>
            </div>

            {/* Links: Portals */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                ERP Portals
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login?role=admin" className="hover:text-cyan-400 transition">
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login?role=teacher" className="hover:text-cyan-400 transition">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login?role=student" className="hover:text-cyan-400 transition">
                    Student & Parents
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-cyan-400 transition">
                    Demo Credentials
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links: School */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                School Links
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#about" className="hover:text-cyan-400 transition">
                    About Kidz Galaxy
                  </a>
                </li>
                <li>
                  <a href="#facilities" className="hover:text-cyan-400 transition">
                    Campus Facilities Tour
                  </a>
                </li>
                <li>
                  <a href="#academics" className="hover:text-cyan-400 transition">
                    Curriculum & Academics
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setInquiryModalOpen(true)}
                    className="hover:text-cyan-400 transition text-left"
                  >
                    Admission Procedures 2026-27
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Campus Location
              </p>
              <div className="space-y-2 text-xs">
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>Kidz Galaxy Campus, Knowledge Corridor, City Center</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={15} className="text-cyan-400 shrink-0" />
                  <span>+91 98765 43210 / 080 4123 5678</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={15} className="text-cyan-400 shrink-0" />
                  <span>admissions@kidzgalaxy.edu</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={15} className="text-cyan-400 shrink-0" />
                  <span>Mon - Sat: 8:00 AM - 4:30 PM</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Kidz Galaxy International School. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">ERP Support Desk</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Admission Inquiry Modal ── */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Admission Inquiry 2026-27</h3>
                <p className="text-xs text-slate-500">
                  Our admissions office will reach out within 24 hours.
                </p>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Inquiry Received!</h4>
                <p className="text-xs text-slate-600">
                  Thank you! Our academic admissions counselor has received your details.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={inquiryForm.parentName}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, parentName: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={inquiryForm.phone}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, phone: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Grade Applying</label>
                    <select
                      value={inquiryForm.studentGrade}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, studentGrade: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    >
                      <option>Nursery / Kindergarten</option>
                      <option>Grade 1 - 5</option>
                      <option>Grade 6 - 8</option>
                      <option>Grade 9 - 10</option>
                      <option>Grade 11 - 12</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={inquiryForm.email}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Questions / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any specific interests or questions..."
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, message: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700"
                  >
                    Submit Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
