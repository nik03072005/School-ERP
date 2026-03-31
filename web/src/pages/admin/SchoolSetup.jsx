import { useEffect, useState } from "react";
import { setupService } from "../../api/setupService";
import { adminService } from "../../api/adminService";

function SchoolSetup() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [classForm, setClassForm] = useState({ name: "", grade_level: 1, capacity: 40 });
  const [sectionForm, setSectionForm] = useState({ class_id: "", name: "", class_teacher_user_id: "" });
  const [periodForm, setPeriodForm] = useState({ name: "", period_number: 1, start_time: "08:00", end_time: "08:45", is_break: false });
  const [assignmentForm, setAssignmentForm] = useState({ teacher_user_id: "", class_id: "", section_id: "", is_primary: false, remarks: "" });

  const load = async () => {
    try {
      setError("");
      const [classData, sectionData, periodData, teacherData] = await Promise.all([
        setupService.listClasses({ is_active: true }),
        setupService.listSections({ is_active: true }),
        setupService.listPeriods({ is_active: true }),
        adminService.getAllUsers({ role: "teaching_staff", limit: 100 }),
      ]);

      const assignmentData = await setupService.listTeacherAssignments({ is_active: true });

      setClasses(classData.classes || []);
      setSections(sectionData.sections || []);
      setPeriods(periodData.periods || []);
      setTeachers(teacherData.users || []);
      setAssignments(assignmentData.assignments || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load setup data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createClass = async (event) => {
    event.preventDefault();
    try {
      await setupService.createClass(classForm);
      setNotice("Class created");
      setClassForm({ name: "", grade_level: 1, capacity: 40 });
      await load();
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
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create section");
    }
  };

  const createPeriod = async (event) => {
    event.preventDefault();
    try {
      await setupService.createPeriod(periodForm);
      setNotice("Period created");
      setPeriodForm({ name: "", period_number: 1, start_time: "08:00", end_time: "08:45", is_break: false });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create period");
    }
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    try {
      await setupService.createTeacherAssignment(assignmentForm);
      setNotice("Teacher assignment saved");
      setAssignmentForm({ teacher_user_id: "", class_id: "", section_id: "", is_primary: false, remarks: "" });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create assignment");
    }
  };

  const selectedClassSections = sections.filter((section) => String(section?.class_id?._id) === String(assignmentForm.class_id));

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>School Setup</h2>
          <p>Create classes, sections, periods, and class-teacher mappings.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {notice ? <p className="alert success">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <div className="card-grid">
        <article className="panel">
          <h3>Create Class</h3>
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
            <button type="submit" className="btn btn-primary">Create Class</button>
          </form>
        </article>

        <article className="panel">
          <h3>Create Section</h3>
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
            <button type="submit" className="btn btn-primary">Create Section</button>
          </form>
        </article>

        <article className="panel">
          <h3>Create Period</h3>
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
            <button type="submit" className="btn btn-primary">Create Period</button>
          </form>
        </article>

        <article className="panel">
          <h3>Teacher Assignment</h3>
          <form className="create-form" onSubmit={createAssignment}>
            <label>
              Teacher
              <select value={assignmentForm.teacher_user_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, teacher_user_id: e.target.value }))} required>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.first_name} {teacher.last_name}</option>)}
              </select>
            </label>
            <label>
              Class
              <select value={assignmentForm.class_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, class_id: e.target.value, section_id: "" }))} required>
                <option value="">Select class</option>
                {classes.map((item) => <option key={item._id} value={item._id}>{item.name} (Grade {item.grade_level})</option>)}
              </select>
            </label>
            <label>
              Section
              <select value={assignmentForm.section_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, section_id: e.target.value }))} required>
                <option value="">Select section</option>
                {selectedClassSections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </label>
            <label className="toggle-item">
              <span>Primary Assignment</span>
              <input type="checkbox" checked={assignmentForm.is_primary} onChange={(e) => setAssignmentForm((p) => ({ ...p, is_primary: e.target.checked }))} />
            </label>
            <label>
              Remarks
              <input value={assignmentForm.remarks} onChange={(e) => setAssignmentForm((p) => ({ ...p, remarks: e.target.value }))} />
            </label>
            <button type="submit" className="btn btn-primary">Save Assignment</button>
          </form>
        </article>
      </div>

      <article className="panel table-shell">
        <h3>Current Sections</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Class Teacher</th>
              </tr>
            </thead>
            <tbody>
              {sections.length === 0 ? (
                <tr><td colSpan={3}><p className="empty-state">No sections created yet.</p></td></tr>
              ) : sections.map((section) => (
                <tr key={section._id}>
                  <td>{section?.class_id?.name} (Grade {section?.class_id?.grade_level})</td>
                  <td>{section.name}</td>
                  <td>{section?.class_teacher_user_id ? `${section.class_teacher_user_id.first_name} ${section.class_teacher_user_id.last_name}` : "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel table-shell">
        <h3>Teacher Assignments</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Class</th>
                <th>Section</th>
                <th>Primary</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={5}><p className="empty-state">No assignments configured yet.</p></td></tr>
              ) : assignments.map((assignment) => (
                <tr key={assignment._id}>
                  <td>{assignment?.teacher_user_id?.first_name} {assignment?.teacher_user_id?.last_name}</td>
                  <td>{assignment?.class_id?.name} (Grade {assignment?.class_id?.grade_level})</td>
                  <td>{assignment?.section_id?.name}</td>
                  <td>{assignment.is_primary ? "Yes" : "No"}</td>
                  <td>{assignment.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default SchoolSetup;
