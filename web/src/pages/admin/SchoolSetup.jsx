import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  LayoutGrid,
  Pencil,
  Printer,
  Plus,
  RefreshCcw,
  School,
  Sparkles,
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
  const [periodForm, setPeriodForm] = useState({ name: "", period_number: 1, start_time: "08:00", end_time: "08:45", is_break: false });

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
      setNotice("Class created");
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
      setNotice("Section created");
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
        grade_level: editClassForm.grade_level,
        capacity: editClassForm.capacity,
      });
      setNotice("Class updated");
      setEditClassForm({ class_id: "", name: "", grade_level: 1, capacity: 40 });
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update class");
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
      });
      if (editSectionForm.class_teacher_user_id) {
        await setupService.assignClassTeacher(
          editSectionForm.section_id,
          editSectionForm.class_teacher_user_id
        );
      }
      setNotice("Section updated");
      setEditSectionForm({ section_id: "", name: "", class_teacher_user_id: "" });
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update section");
    }
  };

  const createPeriod = async (event) => {
    event.preventDefault();
    try {
      await setupService.createPeriod(periodForm);
      setNotice("Period created");
      setPeriodForm({ name: "", period_number: 1, start_time: "08:00", end_time: "08:45", is_break: false });
      await load();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create period");
    }
  };

  const timetableClassSections = useMemo(
    () => sections.filter((section) => String(section?.class_id?._id) === String(selectedTimetableClassId)),
    [sections, selectedTimetableClassId]
  );

  const orderedPeriods = useMemo(
    () => [...periods].sort((a, b) => Number(a?.period_number || 0) - Number(b?.period_number || 0)),
    [periods]
  );

  const filteredTimetableEntries = useMemo(
    () => timetableEntries.filter(
      (entry) =>
        String(entry?.class_id?._id || "") === String(selectedTimetableClassId || "")
        && String(entry?.section_id?._id || "") === String(selectedTimetableSectionId || "")
    ),
    [selectedTimetableClassId, selectedTimetableSectionId, timetableEntries]
  );

  const timetableMatrix = useMemo(() => {
    const map = WEEK_DAYS.reduce((acc, day) => {
      acc[day] = {};
      return acc;
    }, {});

    filteredTimetableEntries.forEach((entry) => {
      const day = entry?.day_of_week;
      const periodId = String(entry?.period_id?._id || "");
      if (!day || !periodId || !map[day]) return;
      map[day][periodId] = entry;
    });

    return map;
  }, [filteredTimetableEntries]);

  const teacherTimetableMatrix = useMemo(() => {
    const map = WEEK_DAYS.reduce((acc, day) => {
      acc[day] = {};
      return acc;
    }, {});

    teacherTimetableEntries.forEach((entry) => {
      const day = entry?.day_of_week;
      const periodId = String(entry?.period_id?._id || "");
      if (!day || !periodId || !map[day]) return;
      map[day][periodId] = entry;
    });

    return map;
  }, [teacherTimetableEntries]);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => String(teacher._id) === String(selectedTeacherId)),
    [selectedTeacherId, teachers]
  );

  useEffect(() => {
    if (!isPlannerOpen) return;

    if (!selectedTimetableClassId && classes.length > 0) {
      setSelectedTimetableClassId(String(classes[0]._id));
    }
  }, [classes, isPlannerOpen, selectedTimetableClassId]);

  useEffect(() => {
    if (!isPlannerOpen || plannerView !== "teacher") return;

    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(String(teachers[0]._id));
    }
  }, [isPlannerOpen, plannerView, selectedTeacherId, teachers]);

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

    const sectionStillValid = nextSections.some(
      (section) => String(section._id) === String(selectedTimetableSectionId)
    );

    if (!sectionStillValid) {
      setSelectedTimetableSectionId(String(nextSections[0]._id));
    }
  }, [sections, selectedTimetableClassId, selectedTimetableSectionId]);

  useEffect(() => {
    if (!isPlannerOpen || !selectedTimetableClassId || !selectedTimetableSectionId) {
      setSlotDrafts({});
      return;
    }

    const nextDrafts = {};
    WEEK_DAYS.forEach((day) => {
      orderedPeriods.forEach((period) => {
        const periodId = String(period._id);
        const key = `${day}_${periodId}`;
        const entry = timetableMatrix?.[day]?.[periodId] || null;
        nextDrafts[key] = {
          teacher_user_id: entry?.teacher_user_id?._id ? String(entry.teacher_user_id._id) : "",
          subject_name: entry?.subject_name || "",
          room: entry?.room || "",
        };
      });
    });
    setSlotDrafts(nextDrafts);
  }, [isPlannerOpen, orderedPeriods, selectedTimetableClassId, selectedTimetableSectionId, timetableMatrix]);

  useEffect(() => {
    if (!isPlannerOpen || plannerView !== "teacher") return undefined;

    if (!selectedTeacherId) {
      setTeacherTimetableEntries([]);
      return undefined;
    }

    let cancelled = false;

    const loadTeacherTimetable = async () => {
      try {
        setLoadingTeacherTimetable(true);
        const data = await setupService.listTeacherTimetable({
          teacher_user_id: selectedTeacherId,
          is_active: true,
        });

        if (!cancelled) {
          setTeacherTimetableEntries(data.entries || []);
        }
      } catch (err) {
        if (!cancelled) {
          setTeacherTimetableEntries([]);
          setError(err?.response?.data?.message || "Could not load teacher timetable");
        }
      } finally {
        if (!cancelled) {
          setLoadingTeacherTimetable(false);
        }
      }
    };

    loadTeacherTimetable();
    return () => {
      cancelled = true;
    };
  }, [isPlannerOpen, plannerView, selectedTeacherId]);

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
    const teacherName = `${selectedTeacher?.first_name || ""} ${selectedTeacher?.last_name || ""}`.trim();
    const printTitle = plannerView === "class"
      ? `Class Timetable - ${classObj?.name || "Class"} ${sectionObj?.name || ""}`
      : `Teacher Timetable - ${teacherName || "Teacher"}`;

    const styleBlocks = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((node) => node.outerHTML)
      .join("\n");

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!printDocument) {
      document.body.removeChild(iframe);
      setError("Could not open printable view. Please try again.");
      return;
    }

    printDocument.open();
    printDocument.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${printTitle}</title>
          ${styleBlocks}
          <style>
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .print-shell {
              padding: 16px;
              background: white;
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            @media print {
              body {
                margin: 0;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              .print-shell {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-shell">${timetablePrintRef.current.innerHTML}</div>
        </body>
      </html>
    `);
    printDocument.close();

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      cleanup();
      setError("Could not access printable window. Please try again.");
      return;
    }

    printWindow.onafterprint = cleanup;

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(cleanup, 1500);
    }, 500);
  };

  const updateSlotDraft = (day, periodId, field, value) => {
    const slotKey = `${day}_${periodId}`;
    setSlotDrafts((prev) => ({
      ...prev,
      [slotKey]: {
        teacher_user_id: prev?.[slotKey]?.teacher_user_id || "",
        subject_name: prev?.[slotKey]?.subject_name || "",
        room: prev?.[slotKey]?.room || "",
        [field]: value,
      },
    }));
  };

  const saveSlot = async (day, periodId) => {
    if (!selectedTimetableClassId || !selectedTimetableSectionId) {
      setError("Please select class and section before editing timetable.");
      return;
    }

    const slotKey = `${day}_${periodId}`;
    const draft = slotDrafts?.[slotKey] || {};
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
        String(entry?.class_id?._id || "") === String(selectedTimetableClassId)
        && String(entry?.section_id?._id || "") === String(selectedTimetableSectionId);
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
      setNotice("Timetable slot saved");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save timetable slot");
    } finally {
      setSavingSlotKey("");
    }
  };

  return (
    <section className="school-setup-page">
      <div className="panel-head setup-hero-head">
        <div>
          <span className="setup-kicker inline-flex items-center gap-2">
            <Sparkles size={14} aria-hidden="true" />
            School Configuration Suite
          </span>
          <h2>School Setup</h2>
          <p>
            {isClassSectionView
              ? "Create and organize class structures with better clarity and faster actions."
              : "Plan staffing operations, periods, and timetable workflows in one control center."}
          </p>
        </div>
        <div className="panel-actions">
          <button type="button" className="btn btn-ghost inline-flex items-center gap-2 setup-refresh-btn" onClick={load}>
            <RefreshCcw size={14} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <div className="card-grid">
        {isClassSectionView ? (
          <>
            <article className="panel setup-action-card">
              <div className="setup-card-icon"><School size={18} aria-hidden="true" /></div>
              <h3 className="inline-flex items-center gap-2">Create Class</h3>
              <p>Configure a new class with grade and seat capacity in seconds.</p>
              <div className="panel-actions">
                <button type="button" className="btn btn-primary setup-action-btn" onClick={() => openModal("class")} aria-label="Open create class form">
                  <Plus size={16} aria-hidden="true" />
                  Add Class
                </button>
              </div>
            </article>

            <article className="panel setup-action-card">
              <div className="setup-card-icon"><BookOpen size={18} aria-hidden="true" /></div>
              <h3 className="inline-flex items-center gap-2">Create Section</h3>
              <p>Add and assign sections under existing classes with teacher mapping.</p>
              <div className="panel-actions">
                <button type="button" className="btn btn-primary setup-action-btn" onClick={() => openModal("section")} aria-label="Open create section form">
                  <Plus size={16} aria-hidden="true" />
                  Add Section
                </button>
              </div>
            </article>
          </>
        ) : (
          <>
            <article className="panel setup-action-card">
              <div className="setup-card-icon"><ClipboardCheck size={18} aria-hidden="true" /></div>
              <h3 className="inline-flex items-center gap-2">Create Period</h3>
              <p>Add period timings for the school day.</p>
              <div className="panel-actions">
                <button type="button" className="btn btn-primary setup-action-btn" onClick={() => openModal("period")} aria-label="Open create period form">
                  <Plus size={16} aria-hidden="true" />
                  Add Period
                </button>
              </div>
            </article>

            <article className="panel setup-action-card setup-highlight-card">
              <div className="setup-card-icon"><CalendarClock size={18} aria-hidden="true" /></div>
              <h3 className="inline-flex items-center gap-2">Timetable Planner</h3>
              <p>Prepare weekly timetable and assign teachers period wise for each class-section.</p>
              <div className="panel-actions">
                <button
                  type="button"
                  className="btn btn-primary setup-action-btn"
                  onClick={() => openModal("planner")}
                  aria-label="Open editable timetable planner grid"
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                  Open Planner
                </button>
              </div>
            </article>
          </>
        )}
      </div>

      {activeModal === "class" ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <article className="modal-card create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Class</h3>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Close</button>
            </div>
            <form className="create-form" onSubmit={createClass}>
              <label>
                Class Name
                <input value={classForm.name} onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))} required />
              </label>
              <label>
                Grade Level
                <input type="number" min="1" max="6" value={classForm.grade_level} onChange={(e) => setClassForm((p) => ({ ...p, grade_level: Number(e.target.value) }))} required />
              </label>
              <label>
                Capacity
                <input type="number" min="1" value={classForm.capacity} onChange={(e) => setClassForm((p) => ({ ...p, capacity: Number(e.target.value) }))} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Class</button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {activeModal === "section" ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <article className="modal-card create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Section</h3>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Close</button>
            </div>
            <form className="create-form" onSubmit={createSection}>
              <label>
                Class
                <select value={sectionForm.class_id} onChange={(e) => setSectionForm((p) => ({ ...p, class_id: e.target.value }))} required>
                  <option value="">Select class</option>
                  {classes.map((item) => <option key={item._id} value={item._id}>{item.name} (Grade {item.grade_level})</option>)}
                </select>
              </label>
              <label>
                Section Name
                <input value={sectionForm.name} onChange={(e) => setSectionForm((p) => ({ ...p, name: e.target.value }))} required />
              </label>
              <label>
                Class Teacher
                <select value={sectionForm.class_teacher_user_id} onChange={(e) => setSectionForm((p) => ({ ...p, class_teacher_user_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.first_name} {teacher.last_name}</option>)}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Section</button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {activeModal === "edit-class" ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <article className="modal-card create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit Class</h3>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Close</button>
            </div>
            <form className="create-form" onSubmit={updateClassDetails}>
              <label>
                Class Name
                <input
                  value={editClassForm.name}
                  onChange={(e) => setEditClassForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Grade Level
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={editClassForm.grade_level}
                  onChange={(e) => setEditClassForm((p) => ({ ...p, grade_level: Number(e.target.value) }))}
                  required
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={editClassForm.capacity}
                  onChange={(e) => setEditClassForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {activeModal === "edit-section" ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <article className="modal-card create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit Section</h3>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Close</button>
            </div>
            <form className="create-form" onSubmit={updateSectionDetails}>
              <label>
                Section Name
                <input
                  value={editSectionForm.name}
                  onChange={(e) => setEditSectionForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Class Teacher
                <select
                  value={editSectionForm.class_teacher_user_id}
                  onChange={(e) => setEditSectionForm((p) => ({ ...p, class_teacher_user_id: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.first_name} {teacher.last_name}</option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {activeModal === "period" ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <article className="modal-card create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Period</h3>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Close</button>
            </div>
            <form className="create-form" onSubmit={createPeriod}>
              <label>
                Name
                <input value={periodForm.name} onChange={(e) => setPeriodForm((p) => ({ ...p, name: e.target.value }))} required />
              </label>
              <label>
                Period Number
                <input type="number" min="1" value={periodForm.period_number} onChange={(e) => setPeriodForm((p) => ({ ...p, period_number: Number(e.target.value) }))} required />
              </label>
              <label>
                Start Time
                <input type="time" value={periodForm.start_time} onChange={(e) => setPeriodForm((p) => ({ ...p, start_time: e.target.value }))} required />
              </label>
              <label>
                End Time
                <input type="time" value={periodForm.end_time} onChange={(e) => setPeriodForm((p) => ({ ...p, end_time: e.target.value }))} required />
              </label>
              <label className="toggle-item">
                <span>Break Period</span>
                <input type="checkbox" checked={periodForm.is_break} onChange={(e) => setPeriodForm((p) => ({ ...p, is_break: e.target.checked }))} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Period</button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {isClassSectionView ? (
        <article className="panel table-shell setup-table-card">
          <div className="setup-table-head">
            <h3 className="inline-flex items-center gap-2"><BookOpen size={16} aria-hidden="true" />Current Sections</h3>
          </div>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Class Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr><td colSpan={4}><p className="empty-state">No sections created yet.</p></td></tr>
                ) : sections.map((section) => (
                  <tr key={section._id}>
                    <td>{section?.class_id?.name} (Grade {section?.class_id?.grade_level})</td>
                    <td>{section.name}</td>
                    <td>{section?.class_teacher_user_id ? `${section.class_teacher_user_id.first_name} ${section.class_teacher_user_id.last_name}` : "Unassigned"}</td>
                    <td>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost inline-flex items-center gap-2"
                          onClick={() => openEditClassModal(section?.class_id)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit Class
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost inline-flex items-center gap-2"
                          onClick={() => openEditSectionModal(section)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit Section
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {isPlannerOpen && isOperationsView ? (
      <div className="modal-backdrop px-0 py-2 sm:px-0 sm:py-4" onClick={closeModal}>
      <article
        className="modal-card setup-planner-shell"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 setup-planner-head">
          <div>
            <h3 className="text-lg font-bold text-slate-900">School Timetable Grid</h3>
            <p className="text-sm text-slate-600">Track and edit period assignments directly in the class-wise day-period matrix.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
              {plannerView === "class" ? `${filteredTimetableEntries.length} class slots` : `${teacherTimetableEntries.length} teacher slots`}
            </span>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Close Planner</button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-cyan-200 bg-white/90 p-3 no-print">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${plannerView === "class" ? "bg-cyan-600 text-white" : "border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50"}`}
              onClick={() => setPlannerView("class")}
            >
              Classwise Timetable
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${plannerView === "teacher" ? "bg-cyan-600 text-white" : "border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50"}`}
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
                    <option key={item._id} value={item._id}>{item.name} (Grade {item.grade_level})</option>
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
                    <option key={item._id} value={item._id}>{item.name}</option>
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
                    <option key={teacher._id} value={teacher._id}>{teacher.first_name} {teacher.last_name}</option>
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
                          const entry = plannerView === "class"
                            ? (timetableMatrix?.[day]?.[String(period._id)] || null)
                            : (teacherTimetableMatrix?.[day]?.[String(period._id)] || null);
                          const slotKey = `${day}_${String(period._id)}`;
                          const draft = slotDrafts?.[slotKey] || { teacher_user_id: "", subject_name: "", room: "" };
                          const isSaving = savingSlotKey === slotKey;
                          const gridLocked = !selectedTimetableClassId || !selectedTimetableSectionId || plannerView !== "class";

                        return (
                            <td key={`${day}-${period._id}`} className="border border-orange-200 bg-[#fffdf5] p-2 align-top">
                              {plannerView === "class" ? (
                                <>
                                  <div className="space-y-2 rounded-lg border border-cyan-100 bg-cyan-50/40 p-2 shadow-[0_1px_2px_rgba(15,23,42,0.08)] no-print">
                                    <select
                                      className="w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-hidden focus:border-cyan-400"
                                      value={draft.teacher_user_id}
                                      onChange={(event) => updateSlotDraft(day, String(period._id), "teacher_user_id", event.target.value)}
                                      disabled={gridLocked || isSaving}
                                    >
                                      <option value="">Select teacher</option>
                                      {teachers.map((teacher) => (
                                        <option key={teacher._id} value={teacher._id}>{teacher.first_name} {teacher.last_name}</option>
                                      ))}
                                    </select>

                                    <input
                                      className="w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-hidden focus:border-cyan-400"
                                      value={draft.subject_name}
                                      onChange={(event) => updateSlotDraft(day, String(period._id), "subject_name", event.target.value)}
                                      placeholder="Subject"
                                      disabled={gridLocked || isSaving}
                                    />

                                    <input
                                      className="w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-hidden focus:border-cyan-400"
                                      value={draft.room}
                                      onChange={(event) => updateSlotDraft(day, String(period._id), "room", event.target.value)}
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
                                        <p className="font-semibold text-emerald-700">{entry?.subject_name || "Subject"}</p>
                                        <p>{entry?.teacher_user_id?.first_name || ""} {entry?.teacher_user_id?.last_name || ""}</p>
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
                                      <p className="font-semibold text-emerald-700">{entry?.subject_name || "Subject"}</p>
                                      <p>{entry?.class_id?.name} - {entry?.section_id?.name}</p>
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
    </section>
  );
}

export default SchoolSetup;
