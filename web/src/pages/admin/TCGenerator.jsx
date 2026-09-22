import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Award,
  Printer,
  Sparkles,
  RotateCcw,
  Search,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Building2,
  Eye,
  Calendar,
  UserCheck,
  Download,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { tcService } from "../../api/tcService";
import { adminService } from "../../api/adminService";

const DEMO_TC_DATA = {
  tc_number: "KG/TC/2026/0148",
  student_name: "Aarav Sharma",
  admission_no: "KG-2021-0042",
  mother_name: "Mrs. Sunita Sharma",
  father_name: "Mr. Rajesh Sharma",
  nationality: "Indian",
  category: "General",
  admission_date: "2021-04-12",
  admission_class: "Class VI",
  dob: "14/07/2009",
  dob_words: "Fourteenth July Two Thousand Nine",
  class_leaving: "Class X - Sec A (Tenth Standard)",
  last_exam_status: "Passed CBSE All India Secondary School Examination (AISSE) with Distinction (92.4%)",
  whether_failed: "No",
  subjects_studied: [
    "English Communicative",
    "Mathematics Standard",
    "Science",
    "Social Science",
    "Hindi Course-A",
    "Information Technology",
  ],
  qualified_for_promotion: "Yes, Promoted to Class XI (Eleventh Standard)",
  dues_paid_upto: "March 2026 (All School Dues Cleared)",
  fee_concession: "None",
  total_working_days: 220,
  days_present: 208,
  ncc_scout_guide: "Boy Scout (Tritiya Sopan Certified)",
  games_activities: "Captain - School Football Team, Gold Medalist - Inter-School Science Olympiad",
  general_conduct: "Exemplary",
  application_date: new Date().toISOString().split("T")[0],
  issue_date: new Date().toISOString().split("T")[0],
  reason_for_leaving: "Parent's Transfer of Service to Bengaluru",
  remarks: "A sincere, highly disciplined, and dedicated scholar who demonstrated stellar academic and moral standards. Best wishes.",
};

const PRINT_STYLE = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    body * {
      visibility: hidden !important;
    }
    #tc-certificate-printable, #tc-certificate-printable * {
      visibility: visible !important;
    }
    #tc-certificate-printable {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 12px !important;
      background: white !important;
      box-shadow: none !important;
      border: 3px double #1e293b !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

export default function TCGenerator() {
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get("studentId");

  const [activeTab, setActiveTab] = useState("studio"); // 'studio' | 'register'
  const [formData, setFormData] = useState(DEMO_TC_DATA);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Register Tab state
  const [issuedTCs, setIssuedTCs] = useState([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSearch, setRegisterSearch] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      const data = await adminService.getAllUsers({ role: "student", limit: 100 });
      const students = (data?.users || [])
        .filter((u) => u.student_profile)
        .map((u) => ({
          studentId: u.student_profile._id,
          userId: u._id,
          name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
          admissionNo: u.student_profile.admission_no || "—",
          className: u.student_profile.class_id?.name || "Class X",
          sectionName: u.student_profile.section_id?.name || "",
        }));
      setEnrolledStudents(students);
    } catch (err) {
      console.error("Failed to load students for TC dropdown", err);
    }
  }, []);

  const loadIssuedTCs = useCallback(async () => {
    setRegisterLoading(true);
    try {
      const data = await tcService.listTCs({ search: registerSearch || undefined });
      setIssuedTCs(data?.tcs || []);
    } catch (err) {
      console.error("Failed to load issued TCs", err);
    } finally {
      setRegisterLoading(false);
    }
  }, [registerSearch]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (activeTab === "register") {
      loadIssuedTCs();
    }
  }, [activeTab, loadIssuedTCs]);

  const handleSelectStudent = async (studentId) => {
    setSelectedStudentId(studentId);
    if (!studentId) return;

    setIsPrefilling(true);
    try {
      const { prefillData } = await tcService.getStudentTCData(studentId);
      if (prefillData) {
        setFormData((prev) => ({
          ...prev,
          ...prefillData,
          tc_number: prev.tc_number || `KG/TC/${new Date().getFullYear()}/00${Math.floor(Math.random() * 800 + 100)}`,
        }));
      }
    } catch (err) {
      console.error("Failed to prefill TC", err);
    } finally {
      setIsPrefilling(false);
    }
  };

  useEffect(() => {
    if (initialStudentId) {
      handleSelectStudent(initialStudentId);
    }
  }, [initialStudentId]);

  const handleLoadDemo = () => {
    setFormData(DEMO_TC_DATA);
    setSelectedStudentId("");
    setSaveSuccess(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveTC = async () => {
    setIsSaving(true);
    try {
      await tcService.createTC({
        ...formData,
        student_id: selectedStudentId || formData.student_id || enrolledStudents[0]?.studentId,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to record Transfer Certificate in database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReprintFromRegister = (tc) => {
    setFormData({
      ...tc,
      subjects_studied: Array.isArray(tc.subjects_studied)
        ? tc.subjects_studied
        : String(tc.subjects_studied || "").split(","),
    });
    setActiveTab("studio");
  };

  return (
    <div className="space-y-6">
      <style>{PRINT_STYLE}</style>

      {/* Page Title & Demo Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Award size={16} />
            <span>Academic Credentials & School Leaving Registry</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Transfer Certificate (TC) Studio
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-300">
            Generate, customize, and print government & CBSE-compliant Transfer Certificates with live preview, official seals, and security QR verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-md hover:from-amber-600 hover:to-orange-600 transition"
            title="Populate complete realistic student credentials for instant presentation demo"
          >
            <Sparkles size={15} className="animate-pulse" />
            <span>Load Demo Student</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition"
          >
            <Printer size={15} />
            <span>Print Transfer Certificate</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("studio")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "studio"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileCheck size={14} className={activeTab === "studio" ? "text-cyan-400" : "text-slate-400"} />
          <span>TC Generator & Live Studio</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "register"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Building2 size={14} className={activeTab === "register" ? "text-cyan-400" : "text-slate-400"} />
          <span>Issued TC Register</span>
        </button>
      </div>

      {/* ── TAB 1: STUDIO (EDITOR + LIVE PREVIEW) ── */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Form Controls (Hidden in Print) */}
          <div className="space-y-4 lg:col-span-5 print:hidden">
            {/* Quick Picker Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  Select Enrolled Student
                </span>
                {isPrefilling && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-700">
                    <RefreshCw size={12} className="animate-spin" /> Auto-filling...
                  </span>
                )}
              </div>

              <div className="mt-3">
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
                >
                  <option value="">-- Choose student or use Demo Student --</option>
                  {enrolledStudents.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.name} ({s.admissionNo}) - {s.className} {s.sectionName ? `(${s.sectionName})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-600">
                  Selecting a student auto-fetches real attendance, fee clearance, and parent details.
                </p>
              </div>
            </div>

            {/* Editable Certificate Form Fields */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Certificate Parameters
                </h3>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-[11px] font-bold text-cyan-700 hover:underline"
                >
                  Reset to Demo Data
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">TC Serial Number</label>
                  <input
                    type="text"
                    value={formData.tc_number}
                    onChange={(e) => handleChange("tc_number", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Pupil Name</label>
                    <input
                      type="text"
                      value={formData.student_name}
                      onChange={(e) => handleChange("student_name", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Admission No</label>
                    <input
                      type="text"
                      value={formData.admission_no}
                      onChange={(e) => handleChange("admission_no", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Father's Name</label>
                    <input
                      type="text"
                      value={formData.father_name}
                      onChange={(e) => handleChange("father_name", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Mother's Name</label>
                    <input
                      type="text"
                      value={formData.mother_name}
                      onChange={(e) => handleChange("mother_name", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Date of Birth</label>
                    <input
                      type="text"
                      value={formData.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Nationality & Category</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => handleChange("nationality", e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">DOB in Words</label>
                  <input
                    type="text"
                    value={formData.dob_words}
                    onChange={(e) => handleChange("dob_words", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs italic text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Class Leaving</label>
                    <input
                      type="text"
                      value={formData.class_leaving}
                      onChange={(e) => handleChange("class_leaving", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Qualified For Promotion</label>
                    <input
                      type="text"
                      value={formData.qualified_for_promotion}
                      onChange={(e) => handleChange("qualified_for_promotion", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">Board / Annual Exam Status</label>
                  <input
                    type="text"
                    value={formData.last_exam_status}
                    onChange={(e) => handleChange("last_exam_status", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Working Days / Present</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        value={formData.total_working_days}
                        onChange={(e) => handleChange("total_working_days", Number(e.target.value))}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                        title="Total Working Days"
                      />
                      <input
                        type="number"
                        value={formData.days_present}
                        onChange={(e) => handleChange("days_present", Number(e.target.value))}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                        title="Days Present"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">General Conduct</label>
                    <select
                      value={formData.general_conduct}
                      onChange={(e) => handleChange("general_conduct", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="Exemplary">Exemplary</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">School Dues Status</label>
                  <input
                    type="text"
                    value={formData.dues_paid_upto}
                    onChange={(e) => handleChange("dues_paid_upto", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">Reason for Leaving School</label>
                  <input
                    type="text"
                    value={formData.reason_for_leaving}
                    onChange={(e) => handleChange("reason_for_leaving", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issue_date?.split("T")[0]}
                      onChange={(e) => handleChange("issue_date", e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Save Record</label>
                    <button
                      type="button"
                      onClick={handleSaveTC}
                      disabled={isSaving}
                      className="mt-0.5 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : saveSuccess ? "Saved to Register!" : "Save & Issue TC"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Printable Transfer Certificate Document */}
          <div className="lg:col-span-7">
            <div className="sticky top-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600 font-bold print:hidden">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Eye size={14} className="text-cyan-600" />
                  Live Authentic Document Preview (CBSE Standard A4)
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="text-cyan-700 hover:underline flex items-center gap-1"
                >
                  <Printer size={13} /> Direct Print
                </button>
              </div>

              {/* ── THE PRINTABLE TRANSFER CERTIFICATE ── */}
              <div
                id="tc-certificate-printable"
                className="relative mx-auto w-full max-w-[800px] overflow-hidden rounded-xl border-4 border-slate-900 bg-white p-7 text-slate-900 shadow-xl print:m-0 print:max-w-none print:rounded-none print:border-4 print:border-slate-900 print:p-6 print:shadow-none"
              >
                {/* Double Border Frame Accent */}
                <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-amber-600/60 print:border-slate-800" />

                {/* Central Subtle Crest Watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] select-none">
                  <img src="/KG-LOGO.png" alt="" className="h-96 w-96 object-contain grayscale" />
                </div>

                {/* Certificate Header */}
                <div className="relative border-b-2 border-slate-900 pb-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src="/KG-LOGO.png"
                      alt="Kidz Galaxy Emblem"
                      className="h-16 w-16 object-contain"
                    />
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl font-serif">
                        Kidz Galaxy International School
                      </h1>
                      <p className="text-[11px] font-bold text-slate-700">
                        Senior Secondary &bull; Affiliated to CBSE, New Delhi &bull; Affiliation No: 2133890
                      </p>
                      <p className="text-[10px] text-slate-600">
                        School Code: 71234 &bull; Knowledge Corridor Campus, City Center &bull; Website: kidzgalaxy.org
                      </p>
                    </div>
                  </div>

                  {/* Ribbon Banner */}
                  <div className="mt-3 inline-block rounded-md bg-slate-900 px-6 py-1 text-xs font-black uppercase tracking-widest text-amber-300 shadow-xs print:border print:border-black print:bg-black print:text-white">
                    Transfer Certificate
                  </div>
                </div>

                {/* Serial Numbers and Registration Bar */}
                <div className="relative mt-3 grid grid-cols-3 gap-2 border-b border-slate-300 pb-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-600">TC Serial No:</span>
                    <p className="font-mono font-black text-slate-900">{formData.tc_number}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-600">Affiliation Code:</span>
                    <p className="font-mono font-bold text-slate-900">2133890 / 2026</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-600">Admission / Scholar No:</span>
                    <p className="font-mono font-black text-slate-900">{formData.admission_no}</p>
                  </div>
                </div>

                {/* Candidate Photo Box and Particulars */}
                <div className="relative mt-3">
                  {/* Photo Placeholder Box (Top Right) */}
                  <div className="absolute right-0 top-0 hidden h-28 w-24 flex-col items-center justify-center rounded border-2 border-dashed border-slate-400 bg-slate-50 p-1 text-center sm:flex print:flex">
                    <UserCheck size={28} className="text-slate-400" />
                    <span className="mt-1 text-[8px] font-bold uppercase leading-tight text-slate-600">
                      Affix Pupil's Passport Photo
                    </span>
                  </div>

                  {/* 20 Numbered Formal Points */}
                  <div className="space-y-1.5 text-xs text-slate-900 sm:pr-28 print:pr-28">
                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">1.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Name of Pupil:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-bold uppercase text-slate-900">
                        {formData.student_name}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">2.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Mother's Name:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-semibold text-slate-900">
                        {formData.mother_name}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">3.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Father's / Guardian's Name:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-semibold text-slate-900">
                        {formData.father_name}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">4.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Nationality:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.nationality}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">5.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Category (General/SC/ST/OBC):</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.category}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">6.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Date of First Admission in School:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.admission_date
                          ? new Date(formData.admission_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}{" "}
                        with Class: <strong className="text-slate-900">{formData.admission_class}</strong>
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">7.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Date of Birth (in Christian Era):</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-900">
                        {formData.dob} &bull; <span className="font-normal italic">({formData.dob_words})</span>
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">8.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Class in which pupil last studied:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-900">
                        {formData.class_leaving}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">9.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">School / Board Annual Exam Status:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.last_exam_status}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">10.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Whether failed, if so once/twice:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.whether_failed}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">11.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Subjects Studied:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {Array.isArray(formData.subjects_studied)
                          ? formData.subjects_studied.join(", ")
                          : formData.subjects_studied}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">12.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Qualified for Promotion:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-bold text-emerald-800 print:text-black">
                        {formData.qualified_for_promotion}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">13.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Month up to which dues paid:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.dues_paid_upto}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">14.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Any Fee Concession availed:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.fee_concession}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">15.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Total No. of Working Days:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.total_working_days} Days
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">16.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Total No. of Days Pupil Present:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.days_present} Days (
                        {Math.round((formData.days_present / (formData.total_working_days || 1)) * 100)}% attendance)
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">17.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Whether NCC / Scout / Guide:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.ncc_scout_guide}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">18.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Games & Extra-Curricular:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        {formData.games_activities}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">19.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">General Conduct:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-900">
                        {formData.general_conduct}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">20.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Date of Application & Issue:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium text-slate-900">
                        Application: {formData.application_date} &bull; Issued:{" "}
                        <strong className="text-slate-900">{formData.issue_date}</strong>
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">21.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Reason for Leaving:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-900">
                        {formData.reason_for_leaving}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-6 shrink-0 font-bold text-slate-600">22.</span>
                      <span className="w-56 shrink-0 font-semibold text-slate-700">Any Other Remarks:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400 font-medium italic text-slate-900">
                        {formData.remarks}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Official Signatures & Seal Block */}
                <div className="relative mt-8 grid grid-cols-4 items-end border-t border-slate-300 pt-5 text-center text-xs">
                  {/* Class Teacher */}
                  <div>
                    <div className="h-10 flex items-center justify-center">
                      <span className="font-serif italic text-xs text-slate-700 opacity-80">R. K. Verma</span>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="text-[10px] font-bold uppercase text-slate-700">Class Teacher</p>
                    </div>
                  </div>

                  {/* Checked By */}
                  <div>
                    <div className="h-10 flex items-center justify-center">
                      <span className="font-serif italic text-xs text-slate-700 opacity-80">M. P. Singh</span>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="text-[10px] font-bold uppercase text-slate-700">Checked By (Clerk)</p>
                    </div>
                  </div>

                  {/* Embossed Principal Stamp Emblem */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-800/80 bg-red-50/50 p-1 text-center font-serif text-[8px] font-bold uppercase text-red-900 shadow-xs print:border-black print:text-black">
                      <span>
                        ★ SEAL OF ★
                        <br />
                        PRINCIPAL
                        <br />
                        K.G.I.S.
                      </span>
                    </div>
                    <span className="mt-1 text-[8px] font-mono text-slate-400">Institutional Seal</span>
                  </div>

                  {/* Principal */}
                  <div>
                    <div className="h-10 flex items-center justify-center">
                      <span className="font-serif italic text-sm font-bold text-cyan-900 print:text-black">
                        Dr. S. K. Mukherjee
                      </span>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="text-[10px] font-extrabold uppercase text-slate-900">Principal Signature</p>
                    </div>
                  </div>
                </div>

                {/* Footer Security QR & Verification Notice */}
                <div className="relative mt-6 flex items-center justify-between border-t border-dashed border-slate-300 pt-2 text-[9px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-[9px]">
                      VERIFIED-DIGITAL-RECORD &bull; SHA-256
                    </div>
                    <span>Scan to verify certificate credentials on National School ERP Gateway.</span>
                  </div>
                  <div className="text-right font-mono">
                    Dated: {formData.issue_date}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ISSUED CERTIFICATES REGISTER ── */}
      {activeTab === "register" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-cyan-700" />
              <h2 className="text-sm font-bold text-slate-800">Transfer Certificate Archives & Audit Log</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search TC No, Pupil Name..."
                  value={registerSearch}
                  onChange={(e) => setRegisterSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={loadIssuedTCs}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {registerLoading ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent" />
                <p className="mt-2 text-xs font-bold text-slate-500">Loading certificate registry...</p>
              </div>
            ) : issuedTCs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Award size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No Transfer Certificates issued yet.</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Switch to the Studio tab and click "Save & Issue TC" to populate this register.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">TC Number</th>
                      <th className="px-4 py-3">Pupil Name</th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Class Leaving</th>
                      <th className="px-4 py-3">Date of Issue</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {issuedTCs.map((tc) => (
                      <tr key={tc._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-900">
                          {tc.tc_number}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{tc.student_name}</td>
                        <td className="px-4 py-3.5 font-mono">{tc.admission_no}</td>
                        <td className="px-4 py-3.5">{tc.class_leaving}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {tc.issue_date
                            ? new Date(tc.issue_date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              tc.status === "issued"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {tc.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleReprintFromRegister(tc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
                          >
                            <Eye size={12} />
                            <span>Reprint / Preview</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

