import { useState } from "react";
import { CheckCircle, Lock, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";

export default function TeacherSettings() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      await refreshUser();
      setSuccess("Password updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Profile information and account security</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
            <User size={18} />
          </div>
          <h2 className="font-bold text-slate-900">Profile Details</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "First Name", value: user?.first_name },
            { label: "Last Name", value: user?.last_name },
            { label: "Email", value: user?.email },
            { label: "Mobile", value: user?.mobile },
            { label: "Role", value: user?.role?.replace("_", " ") },
            { label: "Account Status", value: user?.status },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 capitalize">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
            <Lock size={18} />
          </div>
          <h2 className="font-bold text-slate-900">Change Password</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle size={15} /> {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              className="input w-full"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              className="input w-full"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              className="input w-full"
              placeholder="Repeat new password"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
