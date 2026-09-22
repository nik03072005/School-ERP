import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  LayoutGrid,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  School,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { setupService } from "../../api/setupService";
import { adminService } from "../../api/adminService";

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function SchoolSetup({ view = "class-section" }) {
  const isClassSectionView = view === "class-section";
  const isOperationsView = view === "operations";
  const [activeModal, setActiveModal] = useState(null);
  const isPlannerOpen = activeModal === "planner";
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [plannerView, setPlannerView] = useState("class");
  const [selectedTimetableClassId, setSelectedTimetableClassId] = useState("");
  const [selectedTimetableSectionId, setSelectedTimetableSectionId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherTimetableEntries, setTeacherTimetableEntries] = useState([]);
  const [loadingTeacherTimetable, setLoadingTeacherTimetable] = useState(false);
  const [slotDrafts, setSlotDrafts] = useState({});
  const [savingSlotKey, setSavingSlotKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const timetablePrintRef = useRef(null);

  const [classForm, setClassForm] = useState({ name: "", grade_level: 1, capacity: 40 });
  const [editClassForm, setEditClassForm] = useState({ class_id: "", name: "", grade_level: 1, capacity: 40 });
  const [sectionForm, setSectionForm] = useState({ class_id: "", name: "", class_teacher_user_id: "" });
  const [editSectionForm, setEditSectionForm] = useState({ section_id: "", name: "", class_teacher_user_id: "" });
  const [periodForm, setPeriodForm] = useState({
    name: "",
    period_number: 1,
    start_time: "08:00",
    end_time: "08:45",
    is_break: false,
  });

  const load = async () => {
    try {
      setError("");
      const [classData, sectionData, periodData, teacherData] = await Promise.all([
        setupService.listClasses({ is_active: true }),
        setupService.listSections({ is_active: true }),
        setupService.listPeriods({ is_active: true }),
        adminService.getAllUsers({ role: "teaching_staff", limit: 100 }),
      ]);

      const timetableData = await setupService.listTimetableEntries({ is_active: true });

      setClasses(classData.classes || []);
      setSections(sectionData.sections || []);
      setPeriods(periodData.periods || []);
      setTeachers(teacherData.users || []);
      setTimetableEntries(timetableData.entries || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load setup data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!activeModal) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeModal]);

  const openModal = (modalName) => {
    setError("");
    setActiveModal(modalName);
  };

  const closeModal = () => setActiveModal(null);

  const openEditClassModal = (classItem) => {
    if (!classItem?._id) {
      setError("Could not load class details for editing.");
      return;
    }

    setError("");
    setEditClassForm({
      class_id: String(classItem._id),
      name: classItem.name || "",
      grade_level: Number(classItem.grade_level || 1),
      capacity: Number(classItem.capacity || 40),
    });
    setActiveModal("edit-class");
  };

  const openEditSectionModal = (sectionItem) => {
    if (!sectionItem?._id) {
      setError("Could not load section details for editing.");
      return;
    }

    setError("");
    setEditSectionForm({
      section_id: String(sectionItem._id),
      name: sectionItem.name || "",
      class_teacher_user_id: sectionItem?.class_teacher_user_id?._id
        ? String(sectionItem.class_teacher_user_id._id)
        : "",
    });
    setActiveModal("edit-section");
  };

  const createClass = async (event) => {
    event.preventDefault();
    try {
      await setupService.createClass(classForm);
      setNotice("Class created successfully");
      setClassForm({ name: "", grade_level: 1, capacity: 40 });
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create class");
    }
  };

  const createSection = async (event) => {
    event.preventDefault();
    try {
      await setupService.createSection(sectionForm);
      setNotice("Section created successfully");
      setSectionForm({ class_id: "", name: "", class_teacher_user_id: "" });
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create section");
    }
  };

  const updateClassDetails = async (event) => {
    event.preventDefault();
    if (!editClassForm.class_id) {
      setError("Class selection is missing. Please try again.");
      return;
    }

    try {
      await setupService.updateClass(editClassForm.class_id, {
        name: editClassForm.name,
        grade_level: Number(editClassForm.grade_level || 1),
        capacity: Number(editClassForm.capacity || 40),
      });
      setNotice("Class details updated successfully.");
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update class details.");
    }
  };

  const updateSectionDetails = async (event) => {
    event.preventDefault();
    if (!editSectionForm.section_id) {
      setError("Section selection is missing. Please try again.");
      return;
    }

    try {
      await setupService.updateSection(editSectionForm.section_id, {
        name: editSectionForm.name,
        class_teacher_user_id: editSectionForm.class_teacher_user_id || null,
      });
      setNotice("Section details updated successfully.");
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update section details.");
    }
  };

  const createPeriod = async (event) => {
    event.preventDefault();
    try {
      await setupService.createPeriod(periodForm);
      setNotice("Period created successfully");
      setPeriodForm({
        name: "",
        period_number: periods.length + 1,
        start_time: "08:00",
        end_time: "08:45",
        is_break: false,
      });
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create period");
    }
  };

  const orderedPeriods = useMemo(
    () => [...periods].sort((a, b) => Number(a.period_number) - Number(b.period_number)),
    [periods]
  );

  const timetableClassSections = useMemo(
    () => sections.filter((section) => String(section?.class_id?._id || "") === String(selectedTimetableClassId)),
    [sections, selectedTimetableClassId]
  );

  const filteredTimetableEntries = useMemo(
    () =>
      timetableEntries.filter(
        (entry) =>
          String(entry?.class_id?._id || "") === String(selectedTimetableClassId || "") &&
          String(entry?.section_id?._id || "") === String(selectedTimetableSectionId || "")
      ),
    [selectedTimetableClassId, selectedTimetableSectionId, timetableEntries]
  );

  const timetableMatrix = useMemo(() => {
    const map = {};
    WEEK_DAYS.forEach((day) => {
      map[day] = {};
    });

    filteredTimetableEntries.forEach((entry) => {
      const day = entry?.day_of_week;
      const periodId = String(entry?.period_id?._id || "");
      if (day && periodId && map[day]) {
        map[day][periodId] = entry;
      }
    });

    return map;
  }, [filteredTimetableEntries]);

  const teacherTimetableMatrix = useMemo(() => {
    const map = {};
    WEEK_DAYS.forEach((day) => {
      map[day] = {};
    });

    teacherTimetableEntries.forEach((entry) => {
      const day = entry?.day_of_week;
      const periodId = String(entry?.period_id?._id || "");
      if (day && periodId && map[day]) {
        map[day][periodId] = entry;
      }
    });

    return map;
  }, [teacherTimetableEntries]);

  useEffect(() => {
    if (!isPlannerOpen) return;
    if (!selectedTimetableClassId && classes.length > 0) {
      setSelectedTimetableClassId(String(classes[0]._id));
    }
  }, [classes, isPlannerOpen, selectedTimetableClassId]);

  useEffect(() => {
    if (!selectedTimetableClassId) {
      setSelectedTimetableSectionId("");
      return;
    }

    const nextSections = sections.filter(
      (section) => String(section?.class_id?._id || "") === String(selectedTimetableClassId)
    );

    if (nextSections.length === 0) {
      setSelectedTimetableSectionId("");
      return;
    }

    const exists = nextSections.some((section) => String(section._id) === String(selectedTimetableSectionId));
    if (!exists) {
      setSelectedTimetableSectionId(String(nextSections[0]._id));
    }
  }, [sections, selectedTimetableClassId, selectedTimetableSectionId]);

  useEffect(() => {
    if (!isPlannerOpen || !selectedTimetableClassId || !selectedTimetableSectionId) {
      setSlotDrafts({});
      return;
    }

    const drafts = {};
    WEEK_DAYS.forEach((day) => {
      orderedPeriods.forEach((period) => {
        const periodId = String(period._id);
        const slotKey = `${day}_${periodId}`;
        const entry = timetableMatrix?.[day]?.[periodId] || null;
        drafts[slotKey] = {
          teacher_user_id: entry?.teacher_user_id?._id ? String(entry.teacher_user_id._id) : "",
          subject_name: entry?.subject_name || "",
          room: entry?.room || "",
        };
      });
    });

    setSlotDrafts(drafts);
  }, [isPlannerOpen, orderedPeriods, selectedTimetableClassId, selectedTimetableSectionId, timetableMatrix]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(String(teachers[0]._id));
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (!isPlannerOpen || plannerView !== "teacher" || !selectedTeacherId) {
      setTeacherTimetableEntries([]);
      return;
    }

    const loadTeacherTimetable = async () => {
      try {
        setLoadingTeacherTimetable(true);
        const data = await setupService.listTeacherTimetable({
          teacher_user_id: selectedTeacherId,
          is_active: true,
        });
        setTeacherTimetableEntries(data.entries || []);
      } catch (err) {
        setTeacherTimetableEntries([]);
        setError(err?.response?.data?.message || "Could not load teacher timetable");
      } finally {
        setLoadingTeacherTimetable(false);
      }
    };

    loadTeacherTimetable();
  }, [isPlannerOpen, plannerView, selectedTeacherId]);

  const updateSlotDraft = (day, periodId, field, value) => {
    const slotKey = `${day}_${periodId}`;
    setSlotDrafts((prev) => ({
      ...prev,
      [slotKey]: {
        ...(prev[slotKey] || { teacher_user_id: "", subject_name: "", room: "" }),
        [field]: value,
      },
    }));
  };

  const printTimetablePdf = () => {
    if (plannerView === "class" && (!selectedTimetableClassId || !selectedTimetableSectionId)) {
      setError("Select class and section before printing class timetable.");
      return;
    }

    if (plannerView === "teacher" && !selectedTeacherId) {
      setError("Select teacher before printing teacher timetable.");
      return;
    }

    if (!timetablePrintRef.current) {
      setError("Could not prepare printable timetable view.");
      return;
    }

    const classObj = classes.find((item) => String(item._id) === String(selectedTimetableClassId));
    const sectionObj = sections.find((item) => String(item._id) === String(selectedTimetableSectionId));
    const teacherObj = teachers.find((item) => String(item._id) === String(selectedTeacherId));
    const teacherName = teacherObj ? `${teacherObj.first_name || ""} ${teacherObj.last_name || ""}`.trim() : "";

    const title =
      plannerView === "class"
        ? `Class Timetable - ${classObj?.name || "Class"} ${sectionObj?.name || ""}`
        : `Teacher Timetable - ${teacherName || "Teacher"}`;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      setError("Pop-up blocked. Allow pop-ups to print timetable.");
      return;
    }

    const styleSheets = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          ${styleSheets}
          <style>
            @media print {
              @page { size: landscape; margin: 8mm; }
              body { background: #ffffff !important; font-size: 11px; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              th, td { border: 1px solid #d1d5db !important; page-break-inside: avoid; }
            }
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 12px; }
            .print-shell { width: 100%; }
          </style>
        </head>
        <body>
          <div class="print-shell">${timetablePrintRef.current.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  };

  const saveSlot = async (day, periodId) => {
    if (!selectedTimetableClassId || !selectedTimetableSectionId) {
      setError("Please select class and section before editing timetable.");
      return;
    }

    const slotKey = `${day}_${periodId}`;
    const draft = slotDrafts?.[slotKey] || { teacher_user_id: "", subject_name: "", room: "" };
    const teacherId = String(draft.teacher_user_id || "");

    if (!teacherId) {
      setError("Please select a teacher before saving a timetable slot.");
      return;
    }

    const existingEntry = timetableMatrix?.[day]?.[periodId] || null;
    const hasTeacherConflict = timetableEntries.some((entry) => {
      const sameTeacher = String(entry?.teacher_user_id?._id || "") === teacherId;
      const sameDay = String(entry?.day_of_week || "") === String(day);
      const samePeriod = String(entry?.period_id?._id || "") === String(periodId);
      const sameClassSection =
        String(entry?.class_id?._id || "") === String(selectedTimetableClassId) &&
        String(entry?.section_id?._id || "") === String(selectedTimetableSectionId);
      const sameEntry = String(entry?._id || "") === String(existingEntry?._id || "");
      return sameTeacher && sameDay && samePeriod && !sameClassSection && !sameEntry;
    });

    if (hasTeacherConflict) {
      setError("This teacher is already assigned to another class in the same day and period slot.");
      return;
    }

    try {
      setError("");
      setSavingSlotKey(slotKey);
      await setupService.createTimetableEntry({
        class_id: selectedTimetableClassId,
        section_id: selectedTimetableSectionId,
        period_id: periodId,
        day_of_week: day,
        teacher_user_id: teacherId,
        subject_name: draft.subject_name || "",
        room: draft.room || "",
      });
      setNotice("Timetable slot saved successfully.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save timetable slot");
    } finally {
      setSavingSlotKey("");
    }
  };

  const selectedTeacher = teachers.find((item) => String(item._id) === String(selectedTeacherId));

  return (
    <div className="space-y-6">
      {/* ── Page Header Banner ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Sparkles size={14} />
            Academic Architecture Suite
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {isClassSectionView ? "Class & Section Configuration" : "Academic Operations & Timetable"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {isClassSectionView
              ? "Define grade hierarchies, class divisions, student capacities, and assigned class educators."
              : "Orchestrate daily operational periods, bell schedules, teacher assignments, and master weekly timetables."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw size={13} />
            <span>Sync Architecture</span>
          </button>
        </div>
      </div>

      {/* ── View Switcher Strip ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <Link
          to="/admin/school-setup/class-section"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            isClassSectionView
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <School size={14} className={isClassSectionView ? "text-cyan-400" : "text-slate-400"} />
          <span>Classes & Sections</span>
          <span className="rounded-full bg-cyan-100 px-1.5 py-0.2 text-[10px] font-bold text-cyan-800">
            {classes.length} Classes
          </span>
        </Link>

        <Link
          to="/admin/school-setup/operations"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            isOperationsView
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CalendarClock size={14} className={isOperationsView ? "text-cyan-400" : "text-slate-400"} />
          <span>Periods & Timetable Planner</span>
          <span className="rounded-full bg-cyan-100 px-1.5 py-0.2 text-[10px] font-bold text-cyan-800">
            {periods.length} Periods
          </span>
        </Link>
      </div>

      {/* ── Alerts ── */}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
          <X size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Action Cards Strip ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isClassSectionView ? (
          <>
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <School size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Provision New Class</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Define an academic standard, grade level tier, and baseline student capacity.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openModal("class")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-cyan-600"
                >
                  <Plus size={14} /> Add Class
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Add Class Section</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Subdivide classes into batches and designate a dedicated faculty class teacher.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openModal("section")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-cyan-600"
                >
                  <Plus size={14} /> Add Section
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Configure Academic Period</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Define period intervals, start & end bell times, and designate recess breaks.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openModal("period")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-cyan-600"
                >
                  <Plus size={14} /> Add Period
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/50 via-white to-blue-50/40 p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Weekly Timetable Planner</h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Interactive period-by-period matrix scheduler with teacher conflict validation and PDF export.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-100">
                <button
                  type="button"
                  onClick={() => openModal("planner")}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  <LayoutGrid size={14} className="text-cyan-400" />
                  <span>Launch Timetable Grid Planner</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Tables ── */}
      {isClassSectionView && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Active Sections & Class Teachers ({sections.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Class Standard</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Class Teacher</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No sections configured yet. Add your first class and section above.
                    </td>
                  </tr>
                ) : (
                  sections.map((section) => (
                    <tr key={section._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900">
                          {section?.class_id?.name}
                        </span>{" "}
                        <span className="text-slate-400 font-normal">
                          (Grade {section?.class_id?.grade_level})
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
                          Section {section.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {section?.class_teacher_user_id ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {section.class_teacher_user_id.first_name} {section.class_teacher_user_id.last_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditClassModal(section?.class_id)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit Class
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditSectionModal(section)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit Section
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isOperationsView && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Daily Period Bell Schedule ({orderedPeriods.length})
            </h3>
            <button
              type="button"
              onClick={() => openModal("period")}
              className="text-xs font-bold text-cyan-700 hover:underline"
            >
              + Add Period
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orderedPeriods.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400">
                      No periods defined yet.
                    </td>
                  </tr>
                ) : (
                  orderedPeriods.map((period) => (
                    <tr key={period._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900">Period {period.period_number}</span> &bull; {period.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-slate-700 font-semibold">
                          {period.start_time} - {period.end_time}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            period.is_break
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-cyan-50 text-cyan-800 border border-cyan-200"
                          }`}
                        >
                          {period.is_break ? "Break / Recess" : "Instruction Period"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals for Class, Section, and Period ── */}
      {activeModal === "class" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Create Academic Class</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={createClass} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Class Name *</label>
                <input
                  required
                  placeholder="e.g. Grade 1"
                  value={classForm.name}
                  onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Grade Level *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={classForm.grade_level}
                    onChange={(e) => setClassForm((p) => ({ ...p, grade_level: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Student Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "edit-class" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Edit Class Configuration</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={updateClassDetails} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Class Name *</label>
                <input
                  required
                  value={editClassForm.name}
                  onChange={(e) => setEditClassForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Grade Level *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={editClassForm.grade_level}
                    onChange={(e) => setEditClassForm((p) => ({ ...p, grade_level: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={editClassForm.capacity}
                    onChange={(e) => setEditClassForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "section" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Add Class Section</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={createSection} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Class Standard *</label>
                <select
                  required
                  value={sectionForm.class_id}
                  onChange={(e) => setSectionForm((p) => ({ ...p, class_id: e.target.value }))}
                  className="mt-1"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (Grade {c.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Section Designation *</label>
                <input
                  required
                  placeholder="e.g. A, B, Rose"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Assigned Class Teacher</label>
                <select
                  value={sectionForm.class_teacher_user_id}
                  onChange={(e) => setSectionForm((p) => ({ ...p, class_teacher_user_id: e.target.value }))}
                  className="mt-1"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "edit-section" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Edit Section Assignment</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={updateSectionDetails} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Section Designation *</label>
                <input
                  required
                  value={editSectionForm.name}
                  onChange={(e) => setEditSectionForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Class Teacher</label>
                <select
                  value={editSectionForm.class_teacher_user_id}
                  onChange={(e) => setEditSectionForm((p) => ({ ...p, class_teacher_user_id: e.target.value }))}
                  className="mt-1"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "period" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">Define Academic Period</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={createPeriod} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Period Name *</label>
                <input
                  required
                  placeholder="e.g. Mathematics, Morning Recess"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Period Number *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={periodForm.period_number}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, period_number: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={periodForm.start_time}
                    onChange={(e) => setPeriodForm((p) => ({ ...p, start_time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">End Time *</label>
                  <input
                    type="time"
                    required
                    value={periodForm.end_time}
                    onChange={(e) => setPeriodForm((p) => ({ ...p, end_time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={periodForm.is_break}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, is_break: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                />
                <span className="text-xs font-bold text-slate-700">Designate as Break / Recess Period</span>
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TIMETABLE PLANNER (STRICTLY PRESERVED AS REQUESTED BY USER)
          DO NOT ALTER THE MATRIX, COLOR CODES, OR PLANNING LOGIC
      ────────────────────────────────────────────────────────────── */}
      {isPlannerOpen && isOperationsView ? (
        <div className="modal-backdrop px-0 py-2 sm:px-0 sm:py-4" onClick={closeModal}>
          <article
            className="modal-card setup-planner-shell"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 setup-planner-head">
              <div>
                <h3 className="text-lg font-bold text-slate-900">School Timetable Grid</h3>
                <p className="text-sm text-slate-600">
                  Track and edit period assignments directly in the class-wise day-period matrix.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                  {plannerView === "class"
                    ? `${filteredTimetableEntries.length} class slots`
                    : `${teacherTimetableEntries.length} teacher slots`}
                </span>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Close Planner
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-cyan-200 bg-white/90 p-3 no-print">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    plannerView === "class"
                      ? "bg-cyan-600 text-white"
                      : "border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50"
                  }`}
                  onClick={() => setPlannerView("class")}
                >
                  Classwise Timetable
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    plannerView === "teacher"
                      ? "bg-cyan-600 text-white"
                      : "border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50"
                  }`}
                  onClick={() => setPlannerView("teacher")}
                >
                  Teacher Timetable
                </button>
              </div>

              {plannerView === "class" ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                  <label className="text-sm font-medium text-slate-700">
                    Class
                    <select
                      className="mt-1 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-hidden focus:border-cyan-400"
                      value={selectedTimetableClassId}
                      onChange={(event) => setSelectedTimetableClassId(event.target.value)}
                    >
                      <option value="">Select class</option>
                      {classes.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name} (Grade {item.grade_level})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Section
                    <select
                      className="mt-1 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-hidden focus:border-cyan-400"
                      value={selectedTimetableSectionId}
                      onChange={(event) => setSelectedTimetableSectionId(event.target.value)}
                      disabled={!selectedTimetableClassId || timetableClassSections.length === 0}
                    >
                      <option value="">Select section</option>
                      {timetableClassSections.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                      onClick={printTimetablePdf}
                    >
                      <Printer size={14} aria-hidden="true" />
                      Print / Save PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="text-sm font-medium text-slate-700">
                    Teacher
                    <select
                      className="mt-1 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-hidden focus:border-cyan-400"
                      value={selectedTeacherId}
                      onChange={(event) => setSelectedTeacherId(event.target.value)}
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.first_name} {teacher.last_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                      onClick={printTimetablePdf}
                    >
                      <Printer size={14} aria-hidden="true" />
                      Print / Save PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div ref={timetablePrintRef} className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 hidden print-only rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800">
                {plannerView === "class"
                  ? `Class: ${classes.find((item) => String(item._id) === String(selectedTimetableClassId))?.name || "-"} | Section: ${sections.find((item) => String(item._id) === String(selectedTimetableSectionId))?.name || "-"}`
                  : `Teacher: ${selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : "-"}`}
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-orange-200 bg-white shadow-sm">
                <table className="w-full min-w-full border-collapse table-fixed">
                  <thead>
                    <tr>
                      <th className="w-40 border border-orange-200 bg-[#f47f62] px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-white">
                        Day
                      </th>
                      {orderedPeriods.length === 0 ? (
                        <th className="border border-orange-200 bg-[#fff7e6] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                          No periods created yet
                        </th>
                      ) : (
                        orderedPeriods.map((period) => (
                          <th
                            key={period._id}
                            className="border border-orange-200 bg-[#fff7e6] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"
                          >
                            <div className="flex flex-col">
                              <span>P{period.period_number}</span>
                              <span className="mt-1 text-[11px] normal-case tracking-normal text-slate-500">
                                {period.start_time} - {period.end_time}
                              </span>
                            </div>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEK_DAYS.map((day, dayIndex) => {
                      const dayLabel = `${day[0].toUpperCase()}${day.slice(1)}`;
                      const dayColors = [
                        "bg-[#ff8a65]",
                        "bg-[#ffb16b]",
                        "bg-[#ffe36e] text-slate-700",
                        "bg-[#77d3ff] text-slate-800",
                        "bg-[#00d6d6] text-slate-800",
                        "bg-[#d6b6ff] text-slate-800",
                      ];

                      return (
                        <tr key={day}>
                          <td
                            className={`border border-orange-200 px-3 py-4 text-sm font-extrabold uppercase tracking-[0.08em] text-white ${dayColors[dayIndex % dayColors.length]}`}
                          >
                            {dayLabel}
                          </td>

                          {orderedPeriods.length === 0 ? (
                            <td className="border border-orange-200 bg-[#fffdf5] px-4 py-6 text-sm text-slate-500">
                              Create periods to start timetable mapping.
                            </td>
                          ) : (
                            orderedPeriods.map((period) => {
                              const entry =
                                plannerView === "class"
                                  ? timetableMatrix?.[day]?.[String(period._id)] || null
                                  : teacherTimetableMatrix?.[day]?.[String(period._id)] || null;
                              const slotKey = `${day}_${String(period._id)}`;
                              const draft = slotDrafts?.[slotKey] || {
                                teacher_user_id: "",
                                subject_name: "",
                                room: "",
                              };
                              const isSaving = savingSlotKey === slotKey;
                              const gridLocked =
                                !selectedTimetableClassId ||
                                !selectedTimetableSectionId ||
                                plannerView !== "class";

                              return (
                                <td
                                  key={`${day}-${period._id}`}
                                  className="border border-orange-200 bg-[#fffdf5] p-2 align-top"
                                >
                                  {plannerView === "class" ? (
                                    <>
                                      <div className="space-y-2 rounded-lg border border-cyan-100 bg-cyan-50/40 p-2 shadow-[0_1px_2px_rgba(15,23,42,0.08)] no-print">
                                        <select
                                          className="w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-hidden focus:border-cyan-400"
                                          value={draft.teacher_user_id}
                                          onChange={(event) =>
                                            updateSlotDraft(
                                              day,
                                              String(period._id),
                                              "teacher_user_id",
                                              event.target.value
                                            )
                                          }
                                          disabled={gridLocked || isSaving}
                                        >
                                          <option value="">Select teacher</option>
                                          {teachers.map((teacher) => (
                                            <option key={teacher._id} value={teacher._id}>
                                              {teacher.first_name} {teacher.last_name}
                                            </option>
                                          ))}
                                        </select>

                                        <input
                                          className="w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-hidden focus:border-cyan-400"
                                          value={draft.subject_name}
                                          onChange={(event) =>
                                            updateSlotDraft(
                                              day,
                                              String(period._id),
                                              "subject_name",
                                              event.target.value
                                            )
                                          }
                                          placeholder="Subject"
                                          disabled={gridLocked || isSaving}
                                        />

                                        <input
                                          className="w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-hidden focus:border-cyan-400"
                                          value={draft.room}
                                          onChange={(event) =>
                                            updateSlotDraft(
                                              day,
                                              String(period._id),
                                              "room",
                                              event.target.value
                                            )
                                          }
                                          placeholder="Room"
                                          disabled={gridLocked || isSaving}
                                        />

                                        <button
                                          type="button"
                                          className="w-full rounded-lg bg-cyan-600 px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                                          onClick={() => saveSlot(day, String(period._id))}
                                          disabled={gridLocked || isSaving}
                                        >
                                          {isSaving ? "Saving..." : entry ? "Update" : "Save"}
                                        </button>
                                      </div>

                                      <div className="print-only hidden rounded-lg border border-emerald-100 bg-emerald-50/60 p-2 text-[11px] text-slate-700">
                                        {entry ? (
                                          <div className="space-y-1">
                                            <p className="font-semibold text-emerald-700">
                                              {entry?.subject_name || "Subject"}
                                            </p>
                                            <p>
                                              {entry?.teacher_user_id?.first_name || ""}{" "}
                                              {entry?.teacher_user_id?.last_name || ""}
                                            </p>
                                            <p>Room: {entry?.room || "-"}</p>
                                          </div>
                                        ) : (
                                          <p className="font-medium text-slate-500">No slot</p>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2 text-[11px] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
                                      {loadingTeacherTimetable ? (
                                        <p className="font-medium text-slate-500">Loading...</p>
                                      ) : entry ? (
                                        <div className="space-y-1">
                                          <p className="font-semibold text-emerald-700">
                                            {entry?.subject_name || "Subject"}
                                          </p>
                                          <p>
                                            {entry?.class_id?.name} - {entry?.section_id?.name}
                                          </p>
                                          <p>Room: {entry?.room || "-"}</p>
                                        </div>
                                      ) : (
                                        <p className="font-medium text-slate-500">No slot</p>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

export default SchoolSetup;
