import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminService } from "../../api/adminService";

const EMPTY_FORM = {
  employee_code: "",
  designation: "",
  department: "",
  joining_date: "",
  basic_salary: "",
  bank_account_no: "",
  bank_name: "",
  is_active: true,
  qualification: "",
  experience_years: "",
  subjects: "",
  classes_assigned: "",
  job_category: "",
  shift: "",
  reporting_manager: "",
  operational_permissions: "",
  employee_notes: "",
};

function StaffEditor() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");

        const data = await adminService.getStaffByUser(userId);
        setUser(data.user);

        if (data.staff) {
          setForm({
            employee_code: data.staff.employee_code || "",
            designation: data.staff.designation || "",
            department: data.staff.department || "",
            joining_date: data.staff.joining_date ? String(data.staff.joining_date).slice(0, 10) : "",
            basic_salary: data.staff.basic_salary ?? "",
            bank_account_no: data.staff.bank_account_no || "",
            bank_name: data.staff.bank_name || "",
            is_active: data.staff.is_active ?? true,
            qualification: data.staff_profile?.qualification || "",
            experience_years: data.staff_profile?.experience_years ?? "",
            subjects: Array.isArray(data.staff_profile?.subjects) ? data.staff_profile.subjects.join(", ") : "",
            classes_assigned: Array.isArray(data.staff_profile?.classes_assigned) ? data.staff_profile.classes_assigned.join(", ") : "",
            job_category: data.staff_profile?.job_category || "",
            shift: data.staff_profile?.shift || "",
            reporting_manager: data.staff_profile?.reporting_manager || "",
            operational_permissions: Array.isArray(data.staff_profile?.operational_permissions)
              ? data.staff_profile.operational_permissions.join(", ")
              : "",
            employee_notes: data.staff_profile?.employee_notes || "",
          });
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load staff details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!userId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await adminService.upsertStaffByUser(userId, {
        ...form,
        basic_salary: form.basic_salary === "" ? "" : Number(form.basic_salary),
        experience_years: form.experience_years === "" ? "" : Number(form.experience_years),
      });

      setMessage("Staff details saved successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save staff details.");
    } finally {
      setSaving(false);
    }
  };

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  }, [user]);

  const roleName = user?.role_id?.name;
  const isTeaching = roleName === "teaching_staff";
  const isNonTeaching = roleName === "non_teaching_staff";

  if (loading) {
    return <div className="panel loading-panel"><div className="loader" /></div>;
  }

  if (!user && error) {
    return <div className="panel"><p className="alert error">{error}</p></div>;
  }

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>Edit Staff Details</h2>
          <p>{fullName || "Staff user"}</p>
        </div>
        <Link className="btn btn-ghost" to="/admin/users">
          Back
        </Link>
      </div>

      {message ? <p className="alert success">{message}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}

      <form className="editor-form" onSubmit={save}>
        <article className="form-section">
          <h3>Employment</h3>
          <div className="form-grid">
            <label>
              Employee Code
              <input value={form.employee_code} onChange={(e) => setField("employee_code", e.target.value)} />
            </label>
            <label>
              Designation
              <input value={form.designation} onChange={(e) => setField("designation", e.target.value)} />
            </label>
            <label>
              Department
              <input value={form.department} onChange={(e) => setField("department", e.target.value)} />
            </label>
            <label>
              Joining Date
              <input type="date" value={form.joining_date} onChange={(e) => setField("joining_date", e.target.value)} />
            </label>
            <label>
              Basic Salary
              <input
                type="number"
                min="0"
                value={form.basic_salary}
                onChange={(e) => setField("basic_salary", e.target.value)}
              />
            </label>
          </div>
        </article>

        <article className="form-section">
          <h3>Bank Details</h3>
          <div className="form-grid">
            <label>
              Bank Account Number
              <input value={form.bank_account_no} onChange={(e) => setField("bank_account_no", e.target.value)} />
            </label>
            <label>
              Bank Name
              <input value={form.bank_name} onChange={(e) => setField("bank_name", e.target.value)} />
            </label>
            <label className="toggle-item">
              <span>Staff Account Active</span>
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(e) => setField("is_active", e.target.checked)}
              />
            </label>
          </div>
        </article>

        {isTeaching ? (
          <article className="form-section">
            <h3>Teaching Profile</h3>
            <div className="form-grid">
              <label>
                Qualification
                <input value={form.qualification} onChange={(e) => setField("qualification", e.target.value)} />
              </label>
              <label>
                Experience (years)
                <input
                  type="number"
                  min="0"
                  value={form.experience_years}
                  onChange={(e) => setField("experience_years", e.target.value)}
                />
              </label>
              <label>
                Subjects (comma separated)
                <input value={form.subjects} onChange={(e) => setField("subjects", e.target.value)} />
              </label>
              <label>
                Classes Assigned (comma separated)
                <input value={form.classes_assigned} onChange={(e) => setField("classes_assigned", e.target.value)} />
              </label>
            </div>
            <label>
              Notes
              <textarea rows={2} value={form.employee_notes} onChange={(e) => setField("employee_notes", e.target.value)} />
            </label>
          </article>
        ) : null}

        {isNonTeaching ? (
          <article className="form-section">
            <h3>Non-Teaching Profile</h3>
            <div className="form-grid">
              <label>
                Job Category
                <input value={form.job_category} onChange={(e) => setField("job_category", e.target.value)} />
              </label>
              <label>
                Shift
                <input value={form.shift} onChange={(e) => setField("shift", e.target.value)} />
              </label>
              <label>
                Reporting Manager
                <input value={form.reporting_manager} onChange={(e) => setField("reporting_manager", e.target.value)} />
              </label>
              <label>
                Operational Permissions (comma separated)
                <input
                  value={form.operational_permissions}
                  onChange={(e) => setField("operational_permissions", e.target.value)}
                />
              </label>
            </div>
            <label>
              Notes
              <textarea rows={2} value={form.employee_notes} onChange={(e) => setField("employee_notes", e.target.value)} />
            </label>
          </article>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Details"}
        </button>
      </form>
    </section>
  );
}

export default StaffEditor;
