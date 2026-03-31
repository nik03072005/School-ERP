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

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Details"}
        </button>
      </form>
    </section>
  );
}

export default StaffEditor;
