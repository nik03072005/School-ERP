/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { HelpCircle, X, CheckCircle2, Lightbulb, Sparkles, BookOpen } from "lucide-react";

export const FEATURE_GUIDES = {
  admin_overview: {
    title: "Executive Admin Overview",
    badge: "Operations Command",
    summary:
      "A centralized command center giving school leadership immediate visibility into pending user approvals, admission applications, and staff/student ratios.",
    steps: [
      "Review Pending Accounts: Verify applicant credentials before granting system access.",
      "Vet Admissions: Review parent-submitted registration forms, certificates, and assigned sections.",
      "Monitor Total Campus Count: Track current student enrollment versus capacity in real time.",
    ],
    proTip:
      "All pending accounts are automatically partitioned by role (Teaching Staff, Non-Teaching, Student) so you can review in batches.",
    pitchHighlight:
      "Prevents unauthorized campus portal access with bank-grade multi-tier approval workflows.",
  },
  admin_approvals: {
    title: "User Verification & Provisioning",
    badge: "Security & Access",
    summary:
      "Security gatekeeper module to inspect new account sign-ups, assign role permissions, and activate institutional logins.",
    steps: [
      "Click 'Open' on Pending User Accounts to review names, emails, and requested roles.",
      "Verify proof of identity or employment details.",
      "Select 'Approve' to instantly dispatch login authorization or 'Reject' with rejection reason notes.",
    ],
    proTip:
      "Approved users immediately receive access to their respective portal (Admin, Teacher, or Student).",
    pitchHighlight:
      "Complies with digital safety standards and prevents rogue logins across school networks.",
  },
  admin_admissions: {
    title: "Admissions Lifecycle Management",
    badge: "Enrollment Workflow",
    summary:
      "Complete digital pipeline for new student intake, parent documentation, blood group/health records, and class-section allotment.",
    steps: [
      "Open the pending admission application to inspect submitted student biodata and parent contacts.",
      "Verify uploaded previous school records and birth certificates.",
      "Assign the student's class, section, and roll number, then mark admission as 'Approved'.",
    ],
    proTip:
      "Approving an admission automatically creates the student record in fee ledgers and class attendance sheets.",
    pitchHighlight:
      "Cuts admission turnaround time from days of manual paper filing down to 2 minutes per student.",
  },
  attendance_ops: {
    title: "Daily Attendance & Smart Roll-Call",
    badge: "Daily Operations",
    summary:
      "Live synchronization of classroom attendance, tracking student arrival, tardiness, half-day leaves, and unexcused absences.",
    steps: [
      "Class teachers mark attendance on mobile or web within the morning roll-call window.",
      "The system computes real-time class percentages and flags chronic absentees.",
      "Instant SMS and WhatsApp alerts are dispatched to parents of absent students.",
    ],
    proTip:
      "Attendance audit logs preserve timestamps of when teachers submitted their register for accountability.",
    pitchHighlight:
      "Automated WhatsApp & SMS parent notifications eliminate proxy attendance and keep parents informed.",
  },
  fee_management: {
    title: "Smart Fee Structures & Digital Invoicing",
    badge: "Financial Engine",
    summary:
      "Customizable institutional fee engine handling tuition, transport, lab fees, concessions, installment schedules, and payment receipts.",
    steps: [
      "Configure Fee Heads (e.g. Tuition, Computer Lab, Sports, Annual Fest).",
      "Assign Fee Structures to specific classes (e.g. Grade 10 Science stream).",
      "Generate monthly/term invoices, collect online or cash payments, and issue printable digital receipts.",
    ],
    proTip:
      "The collection register automatically tracks partial payments and applies overdue fines per school policy.",
    pitchHighlight:
      "Zero ledger discrepancy: 100% digital audit trails for school trustees and auditors.",
  },
  teacher_attendance: {
    title: "Classroom Roll-Call Guide",
    badge: "Teacher Workflow",
    summary:
      "Fast 1-tap attendance marking designed for teachers during morning homeroom or subject periods.",
    steps: [
      "Select your assigned Class and Section.",
      "All students default to 'Present'. Tap on any absent or late student to toggle their status.",
      "Click 'Submit Register'. Parents of absent students are notified immediately.",
    ],
    proTip:
      "If you make an accidental mistake, you can modify today's register before the daily cutoff time.",
    pitchHighlight:
      "Saves 15 minutes per class every morning compared to physical paper registers.",
  },
  teacher_logbook: {
    title: "Teacher Daily Logbook & Syllabus",
    badge: "Academic Pacing",
    summary:
      "Digital teacher dairy to track lesson plans, syllabus coverage, homework assigned, and class observations.",
    steps: [
      "Select the date, subject, and class.",
      "Enter the topics taught today and specific homework instructions for students.",
      "Save logbook entry — this updates the student portal so parents can review homework.",
    ],
    proTip:
      "School principals can review pacing reports to ensure all classes are on track for exams.",
    pitchHighlight:
      "No more lost homework notebooks: transparent daily sync between teachers, parents, and students.",
  },
  teacher_marks: {
    title: "Exam Marks Entry & Grading",
    badge: "Assessment Engine",
    summary:
      "Streamlined score entry interface with auto-grade calculation, class rank generation, and printable report cards.",
    steps: [
      "Select the Exam (e.g. Term 1, Mid-Term) and Subject.",
      "Input marks for each roll number with real-time validation against maximum marks.",
      "Click 'Save Marks'. Automated grade boundaries (A, B, C) calculate immediately.",
    ],
    proTip:
      "Once marks are finalized, administrators can publish the results to student portals in one click.",
    pitchHighlight:
      "Eliminates manual mark-sheet calculation errors and generates printable CBSE-compliant report cards.",
  },
  parent_queries: {
    title: "Parent Query & Communication Desk",
    badge: "Family Engagement",
    summary:
      "Two-way structured communication channel connecting parents directly with teachers for student guidance.",
    steps: [
      "Review incoming queries tagged by student name and subject.",
      "Click 'Reply' to send confidential, professional feedback directly to the parent's portal.",
      "Mark resolved queries to keep your communication inbox clean.",
    ],
    proTip:
      "Keeps teacher personal phone numbers private while ensuring parents receive timely responses.",
    pitchHighlight:
      "Fosters strong parent-teacher partnerships without disruptive after-hours phone calls.",
  },
  student_attendance: {
    title: "Student Attendance Record & Mandate",
    badge: "Student Compliance",
    summary:
      "Personal attendance tracking dashboard helping students and parents maintain the mandated 75% attendance threshold.",
    steps: [
      "View your month-by-month attendance percentage breakdown.",
      "Green indicates healthy attendance (above 75%). Red warns of low attendance requiring medical excuse.",
      "Tap any date on the calendar to see status: Present, Late, Half-Day, or Absent.",
    ],
    proTip:
      "Always apply for leave in advance via the 'Apply Leave' tab to keep your absence excused.",
    pitchHighlight:
      "Empowers students with self-monitoring to prevent last-minute exam hall ticket issues.",
  },
  student_report: {
    title: "Academic Report Cards & Performance",
    badge: "Learning Analytics",
    summary:
      "Official term scorecards with subject-wise marks, class percentiles, teacher remarks, and attendance summary.",
    steps: [
      "Select your term or exam session to view full grade breakdown.",
      "Review teacher comments and areas of encouragement.",
      "Click 'Download Report Card' to save an official PDF copy for parents.",
    ],
    proTip:
      "Previous academic years' report cards remain permanently archived in your student locker.",
    pitchHighlight:
      "Instant, paperless report card distribution saves thousands in printing costs each term.",
  },
  student_leave: {
    title: "Digital Leave Application",
    badge: "Leave Management",
    summary:
      "Submit leave requests with date range and reason directly to your class teacher without paper notes.",
    steps: [
      "Select the start date and end date of your requested leave.",
      "Pick a leave reason (Medical, Family Function, Personal).",
      "Submit for class teacher approval and track real-time status (Pending, Approved).",
    ],
    proTip:
      "Approved leaves automatically mark the student's daily attendance as 'Excused Leave'.",
    pitchHighlight:
      "100% paperless student absence management with digital parent confirmation.",
  },
};

export function FeatureHelpButton({ guideKey, label = "How it works", className = "" }) {
  const [open, setOpen] = useState(false);
  const guide = FEATURE_GUIDES[guideKey] || {
    title: "Feature Guide",
    badge: "ERP Module",
    summary: "Detailed workflow instructions for this module.",
    steps: ["Review details", "Take required action", "Save changes"],
    proTip: "Consult your school administrator for custom permissions.",
    pitchHighlight: "Enhances digital operational speed.",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 hover:border-cyan-300 shadow-xs cursor-pointer",
          className,
        ].join(" ")}
        title="Click to view interactive feature guide"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
          ?
        </span>
        <span className="hidden sm:inline">{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 uppercase tracking-wider">
                  <Sparkles size={11} className="text-cyan-600" />
                  {guide.badge}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{guide.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Summary */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-cyan-600" />
                  What this feature does:
                </p>
                {guide.summary}
              </div>

              {/* Step by step */}
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Step-by-Step Workflow:
                </p>
                <div className="space-y-2">
                  {guide.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <p className="text-slate-700 leading-snug pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              {guide.proTip && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-amber-900">
                  <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[11px] block">Pro Tip for Staff:</span>
                    <p className="text-[11px] text-amber-800 leading-tight mt-0.5">{guide.proTip}</p>
                  </div>
                </div>
              )}

              {/* Client Pitch Value */}
              {guide.pitchHighlight && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[11px] block">Client Pitch Value:</span>
                    <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                      {guide.pitchHighlight}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FeatureHelpButton;
