import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Save,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { adminService } from "../../api/adminService";

const EMPTY_FORM = {
  employee_code: "",
  designation: "",
  department: "",
  joining_date: "",
  basic_salary: "",
  bank_account_no: "",
  bank_name: "",
  bank_ifsc: "",
  pan_number: "",
  uan_number: "",
  pf_account_no: "",
  esi_number: "",
  tds_monthly: "",
  epf_applicable: true,
  esi_applicable: false,
  da_amount: "",
  hra_amount: "",
  conveyance_allowance: "",
  medical_allowance: "",
  special_allowance: "",
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
          const struct = data.staff.salary_structure || {};
          setForm({
            employee_code: data.staff.employee_code || "",
            designation: data.staff.designation || "",
            department: data.staff.department || "",
            joining_date: data.staff.joining_date ? String(data.staff.joining_date).slice(0, 10) : "",
            basic_salary: data.staff.basic_salary ?? "",
            bank_account_no: data.staff.bank_account_no || "",
            bank_name: data.staff.bank_name || "",
            bank_ifsc: data.staff.bank_ifsc || "",
            pan_number: data.staff.pan_number || "",
            uan_number: data.staff.uan_number || "",
            pf_account_no: data.staff.pf_account_no || "",
            esi_number: data.staff.esi_number || "",
            tds_monthly: struct.tds_monthly ?? "",
            epf_applicable: struct.epf_applicable ?? true,
            esi_applicable: struct.esi_applicable ?? false,
            da_amount: struct.da_amount ?? "",
            hra_amount: struct.hra_amount ?? "",
            conveyance_allowance: struct.conveyance_allowance ?? "",
            medical_allowance: struct.medical_allowance ?? "",
            special_allowance: struct.special_allowance ?? "",
            is_active: data.staff.is_active ?? true,
            qualification: data.staff_profile?.qualification || "",
            experience_years: data.staff_profile?.experience_years ?? "",
            subjects: Array.isArray(data.staff_profile?.subjects) ? data.staff_profile.subjects.join(", ") : "",
            classes_assigned: Array.isArray(data.staff_profile?.classes_assigned)
              ? data.staff_profile.classes_assigned.join(", ")
              : "",
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
        salary_structure: {
          da_amount: form.da_amount === "" ? 0 : Number(form.da_amount),
          hra_amount: form.hra_amount === "" ? 0 : Number(form.hra_amount),
          conveyance_allowance: form.conveyance_allowance === "" ? 0 : Number(form.conveyance_allowance),
          medical_allowance: form.medical_allowance === "" ? 0 : Number(form.medical_allowance),
          special_allowance: form.special_allowance === "" ? 0 : Number(form.special_allowance),
          epf_applicable: Boolean(form.epf_applicable),
          esi_applicable: Boolean(form.esi_applicable),
          pt_applicable: true,
          tds_monthly: form.tds_monthly === "" ? 0 : Number(form.tds_monthly),
        },
      });

      setMessage("Staff details saved and updated successfully.");
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
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-xs font-bold text-slate-500">Loading staff records...</p>
        </div>
      </div>
    );
  }

  if (!user && error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xs">
        <ShieldAlert size={36} className="mx-auto text-rose-500 mb-2" />
        <p className="text-sm font-bold text-slate-800">{error}</p>
        <Link
          to="/admin/staff"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft size={14} /> Back to Staff Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <UserCheck size={15} />
            Faculty & Personnel File
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {fullName || "Staff Profile Editor"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Update employee designations, academic assignments, payroll details, and operational notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            <span>Cancel</span>
          </Link>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Staff Details"}</span>
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        {/* ── 1. Employment Details ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <Briefcase size={16} className="text-cyan-600" />
            <span>1. Employment & Designation</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Employee Code</label>
              <input
                value={form.employee_code}
                onChange={(e) => setField("employee_code", e.target.value)}
                placeholder="e.g. EMP-101"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Designation / Role</label>
              <input
                value={form.designation}
                onChange={(e) => setField("designation", e.target.value)}
                placeholder="e.g. Senior Teacher"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Department</label>
              <input
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
                placeholder="e.g. Science, Languages"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Date of Joining</label>
              <input
                type="date"
                value={form.joining_date}
                onChange={(e) => setField("joining_date", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Basic Monthly Salary (₹)</label>
              <input
                type="number"
                min="0"
                value={form.basic_salary}
                onChange={(e) => setField("basic_salary", e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* ── 2. Banking, Statutory IDs & Payroll Config ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            <CreditCard size={16} className="text-cyan-600" />
            <span>2. Banking, Statutory IDs & Payroll Config</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Bank Account Number</label>
              <input value={form.bank_account_no} onChange={(e) => setField("bank_account_no", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Bank & Branch Name</label>
              <input value={form.bank_name} onChange={(e) => setField("bank_name", e.target.value)} placeholder="e.g. State Bank of India, Noida" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">IFSC Code</label>
              <input value={form.bank_ifsc} onChange={(e) => setField("bank_ifsc", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" className="mt-1 uppercase" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">PAN Number</label>
              <input value={form.pan_number} onChange={(e) => setField("pan_number", e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="mt-1 uppercase" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">UAN (Universal Account No.)</label>
              <input value={form.uan_number} onChange={(e) => setField("uan_number", e.target.value)} placeholder="100987654321" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">PF Account No.</label>
              <input value={form.pf_account_no} onChange={(e) => setField("pf_account_no", e.target.value)} placeholder="DL/CPM/0023456/000/0001" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">ESIC Number</label>
              <input value={form.esi_number} onChange={(e) => setField("esi_number", e.target.value)} placeholder="3100012345678 (if applicable)" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Monthly TDS (₹)</label>
              <input type="number" min="0" value={form.tds_monthly} onChange={(e) => setField("tds_monthly", e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div className="flex flex-col gap-2 pb-1 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(form.epf_applicable)} onChange={(e) => setField("epf_applicable", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                <span className="text-xs font-bold text-slate-700">EPF Applicable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(form.esi_applicable)} onChange={(e) => setField("esi_applicable", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                <span className="text-xs font-bold text-slate-700">ESI Applicable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setField("is_active", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                <span className="text-xs font-bold text-slate-700">Account Active</span>
              </label>
            </div>
          </div>

          {/* Salary Allowance Breakdown */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Salary Allowance Breakdown (₹/month)</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "DA Amount", key: "da_amount" },
                { label: "HRA Amount", key: "hra_amount" },
                { label: "Conveyance Allow.", key: "conveyance_allowance" },
                { label: "Medical Allow.", key: "medical_allowance" },
                { label: "Special Allow.", key: "special_allowance" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-700">{label}</label>
                  <input type="number" min="0" value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)} placeholder="0" className="mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ── 3. Academic Faculty Profile (If Teaching) ── */}
        {isTeaching && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
              <GraduationCap size={16} className="text-cyan-600" />
              <span>3. Academic & Teaching Profile</span>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Highest Qualification</label>
                  <input
                    value={form.qualification}
                    onChange={(e) => setField("qualification", e.target.value)}
                    placeholder="e.g. M.Sc, B.Ed"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.experience_years}
                    onChange={(e) => setField("experience_years", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Subjects (comma separated)</label>
                  <input
                    value={form.subjects}
                    onChange={(e) => setField("subjects", e.target.value)}
                    placeholder="Mathematics, Physics"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Classes Assigned</label>
                  <input
                    value={form.classes_assigned}
                    onChange={(e) => setField("classes_assigned", e.target.value)}
                    placeholder="Grade 9, Grade 10"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Faculty Notes & Remarks</label>
                <textarea
                  rows={2}
                  value={form.employee_notes}
                  onChange={(e) => setField("employee_notes", e.target.value)}
                  className="mt-1"
                  placeholder="Special responsibilities, club leader, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Non-Teaching Profile ── */}
        {isNonTeaching && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-700">
              <Briefcase size={16} className="text-cyan-600" />
              <span>3. Administrative Operations Profile</span>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Job Category</label>
                  <input
                    value={form.job_category}
                    onChange={(e) => setField("job_category", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Shift</label>
                  <input
                    value={form.shift}
                    onChange={(e) => setField("shift", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Reporting Manager</label>
                  <input
                    value={form.reporting_manager}
                    onChange={(e) => setField("reporting_manager", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Permissions (comma separated)</label>
                  <input
                    value={form.operational_permissions}
                    onChange={(e) => setField("operational_permissions", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Operational Notes</label>
                <textarea
                  rows={2}
                  value={form.employee_notes}
                  onChange={(e) => setField("employee_notes", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
          <Link
            to="/admin/staff"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? "Saving Changes..." : "Save Staff Record"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default StaffEditor;
