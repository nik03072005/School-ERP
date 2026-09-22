import { useState } from "react";
import { X, Edit3, Save, AlertCircle } from "lucide-react";
import { payrollService } from "../../api/payrollService";
import { currency } from "../../utils/indianCurrency";

const Field = ({ label, name, value, onChange, type = "number", hint }) => (
  <div>
    <label className="text-xs font-bold text-slate-700">{label}</label>
    {hint && <span className="ml-1 text-[10px] text-slate-400">({hint})</span>}
    <input
      type={type}
      min="0"
      step="0.5"
      value={value}
      onChange={(e) => onChange(name, type === "number" ? e.target.value : e.target.value)}
      className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
    />
  </div>
);

export default function SlipOverrideModal({ slip, onClose, onSaved }) {
  const [form, setForm] = useState({
    lop_days: slip.lop_days ?? 0,
    bonus: slip.bonus ?? 0,
    overtime_pay: slip.overtime_pay ?? 0,
    tds: slip.tds ?? 0,
    other_deductions: slip.other_deductions ?? 0,
    remarks: slip.remarks ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await payrollService.updateSlip(slip._id, {
        lop_days: Number(form.lop_days),
        bonus: Number(form.bonus),
        overtime_pay: Number(form.overtime_pay),
        tds: Number(form.tds),
        other_deductions: Number(form.other_deductions),
        remarks: form.remarks,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save adjustments.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Edit3 size={17} className="text-cyan-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Adjust Salary Slip</div>
              <div className="text-[11px] text-slate-500">{slip.employee_name} · {slip.employee_code}</div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
            <X size={14} />
          </button>
        </div>

        {/* Current Net */}
        <div className="mx-6 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm">
          <span className="text-slate-600">Current Net Salary: </span>
          <span className="font-black text-emerald-700">{currency(slip.net_salary)}</span>
          <span className="ml-3 text-slate-500 text-xs">(Will be recalculated on save)</span>
        </div>

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Fields */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <Field label="LOP Days" name="lop_days" value={form.lop_days} onChange={setField} hint="Editable" />
          <Field label="Bonus / Incentive (₹)" name="bonus" value={form.bonus} onChange={setField} />
          <Field label="Overtime Pay (₹)" name="overtime_pay" value={form.overtime_pay} onChange={setField} />
          <Field label="TDS Deduction (₹)" name="tds" value={form.tds} onChange={setField} hint="Monthly" />
          <Field label="Other Deductions (₹)" name="other_deductions" value={form.other_deductions} onChange={setField} />
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-700">Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setField("remarks", e.target.value)}
              placeholder="Reason for adjustment..."
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Save size={13} />
            {saving ? "Saving…" : "Save Adjustments"}
          </button>
        </div>
      </div>
    </div>
  );
}

