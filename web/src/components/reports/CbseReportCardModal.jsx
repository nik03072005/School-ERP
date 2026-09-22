import React, { useState } from "react";
import {
  Printer,
  X,
  FileSpreadsheet,
  Award,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import CbseReportCard from "./CbseReportCard";

const CBSE_PRINT_STYLES = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
    }
    body {
      background: #ffffff !important;
    }
    body * {
      visibility: hidden !important;
    }
    #cbse-print-area, #cbse-print-area * {
      visibility: visible !important;
    }
    #cbse-print-area {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .cbse-page-break {
      page-break-after: always !important;
      break-after: page !important;
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }
    .print-hide {
      display: none !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

export default function CbseReportCardModal({
  isOpen,
  onClose,
  reports = [],
  activeReportIndex = 0,
  schoolBranding = {},
}) {
  if (!isOpen || !reports || reports.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(activeReportIndex);
  const [viewMode, setViewMode] = useState("two-term"); // "two-term" or "holistic"
  const [printAllBatch, setPrintAllBatch] = useState(false);

  const safeIndex = Math.max(0, Math.min(currentIndex, reports.length - 1));
  const currentReport = reports[safeIndex];
  const currentStudent = currentReport?.student_id;

  const handlePrint = () => {
    window.print();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : reports.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < reports.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-2 sm:p-4 md:p-6 backdrop-blur-sm">
      <style>{CBSE_PRINT_STYLES}</style>

      <div className="relative my-4 w-full max-w-5xl rounded-3xl bg-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Modal Control Bar (Screen only, hidden in print) ── */}
        <div className="print-hide sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-bold">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-slate-900">
                CBSE Official Printable Marksheet & Holistic Card
              </h3>
              <p className="text-[11px] text-slate-500">
                NEP 2020 Compliant • A4 Portrait Ready
              </p>
            </div>
          </div>

          {/* View Mode Toggle: 2-Term Marksheet vs Holistic Progress Card */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("two-term")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                viewMode === "two-term"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>2-Term Marksheet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("holistic")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                viewMode === "holistic"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles size={13} className="text-amber-600" />
              <span>Holistic Progress (NEP)</span>
            </button>
          </div>

          {/* Student Navigator (if multiple reports) */}
          {reports.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-2 py-1 text-xs">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900"
                  title="Previous Student"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-bold text-slate-800 text-[11px] px-1">
                  {safeIndex + 1} of {reports.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900"
                  title="Next Student"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Batch Print Toggle */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printAllBatch}
                  onChange={(e) => setPrintAllBatch(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-[11px]">Print All ({reports.length})</span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-amber-700 transition active:scale-95"
            >
              <Printer size={14} />
              <span>{printAllBatch ? `Print All (${reports.length})` : "Print Report Card"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Document Preview & Print Area ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-200/60">
          <div id="cbse-print-area">
            {printAllBatch ? (
              // Batch Print Mode: Render all reports with page breaks
              reports.map((rpt, idx) => {
                const s = rpt.student_id;
                return (
                  <div
                    key={rpt._id || idx}
                    className={`cbse-print-card-wrapper mb-8 print:mb-0 ${
                      idx < reports.length - 1 ? "cbse-page-break" : ""
                    }`}
                  >
                    <CbseReportCard
                      student={s}
                      report={rpt}
                      allReports={reports.filter((r) => r.student_id?._id === s?._id)}
                      viewMode={viewMode}
                      schoolName={schoolBranding.schoolName}
                      affiliationNo={schoolBranding.affiliationNo}
                      schoolCode={schoolBranding.schoolCode}
                      academicYear={rpt.exam_schedule_id?.academic_year || "2026-2027"}
                    />
                  </div>
                );
              })
            ) : (
              // Single Student Preview Mode
              <div className="cbse-print-card-wrapper">
                <CbseReportCard
                  student={currentStudent}
                  report={currentReport}
                  allReports={reports.filter((r) => r.student_id?._id === currentStudent?._id)}
                  viewMode={viewMode}
                  schoolName={schoolBranding.schoolName}
                  affiliationNo={schoolBranding.affiliationNo}
                  schoolCode={schoolBranding.schoolCode}
                  academicYear={currentReport?.exam_schedule_id?.academic_year || "2026-2027"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

