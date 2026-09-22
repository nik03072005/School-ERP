import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  Edit,
} from "lucide-react";
import { feeService } from "../../../api/feeService";
import { setupService } from "../../../api/setupService";

const FREQUENCIES = ["annual", "term", "monthly", "one_time"];
const PENALTY_TYPES = ["flat", "percentage"];
const PENALTY_FREQUENCIES = ["once", "per_day", "per_month"];

const emptyForm = () => ({
  academic_year: "",
  class_id: "",
  section_id: "",
  components: [{ fee_head_id: "", amount: "", frequency: "annual" }],
  installments: [{ name: "", due_date: "", percentage: "" }],
  late_fee_policy: {
    enabled: false,
    grace_days: 0,
    penalty_type: "flat",
    penalty_value: 0,
    penalty_frequency: "once",
    max_penalty: 0,
  },
});

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function FeeStructuresAdmin() {
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
    feeService.getFeeHeads({ active: "true" }).then((d) => setFeeHeads(d.heads || []));
  }, []);

  useEffect(() => {
    loadStructures();
  }, [filterClass]);

  const loadStructures = async () => {
    setLoading(true);
    try {
      const params = filterClass ? { class_id: filterClass } : {};
      const { structures } = await feeService.getFeeStructures(params);
      setStructures(structures || []);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    const { sections } = await setupService.listSections({ class_id: classId });
    setSections(sections || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setSections([]);
    setError("");
    setShowModal(true);
  };

  const openEdit = async (structure) => {
    setEditing(structure._id);
    await loadSections(structure.class_id?._id || structure.class_id);
    setForm({
      academic_year: structure.academic_year,
      class_id: structure.class_id?._id || structure.class_id,
      section_id: structure.section_id?._id || structure.section_id || "",
      components: structure.components.map((c) => ({
        fee_head_id: c.fee_head_id?._id || c.fee_head_id,
        amount: c.amount,
        frequency: c.frequency,
      })),
      installments: structure.installments.map((i) => ({
        name: i.name,
        due_date: i.due_date ? i.due_date.slice(0, 10) : "",
        percentage: i.percentage,
      })),
      late_fee_policy: {
        enabled: !!structure.late_fee_policy?.enabled,
        grace_days: structure.late_fee_policy?.grace_days || 0,
        penalty_type: structure.late_fee_policy?.penalty_type || "flat",
        penalty_value: structure.late_fee_policy?.penalty_value || 0,
        penalty_frequency: structure.late_fee_policy?.penalty_frequency || "once",
        max_penalty: structure.late_fee_policy?.max_penalty || 0,
      },
    });
    setError("");
    setShowModal(true);
  };

  const handleClassChange = async (classId) => {
    setForm((f) => ({ ...f, class_id: classId, section_id: "" }));
    await loadSections(classId);
  };

  const addComponent = () =>
    setForm((f) => ({
      ...f,
      components: [...f.components, { fee_head_id: "", amount: "", frequency: "annual" }],
    }));

  const removeComponent = (idx) =>
    setForm((f) => ({ ...f, components: f.components.filter((_, i) => i !== idx) }));

  const updateComponent = (idx, field, val) =>
    setForm((f) => ({
      ...f,
      components: f.components.map((c, i) => (i === idx ? { ...c, [field]: val } : c)),
    }));

  const addInstallment = () =>
    setForm((f) => ({
      ...f,
      installments: [...f.installments, { name: "", due_date: "", percentage: "" }],
    }));

  const removeInstallment = (idx) =>
    setForm((f) => ({ ...f, installments: f.installments.filter((_, i) => i !== idx) }));

  const updateInstallment = (idx, field, val) =>
    setForm((f) => ({
      ...f,
      installments: f.installments.map((inst, i) => (i === idx ? { ...inst, [field]: val } : inst)),
    }));

  const totalAmount = form.components.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPercentage = form.installments.reduce((sum, i) => sum + Number(i.percentage || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.academic_year.trim()) {
      setError("Academic year is required");
      return;
    }
    if (!form.class_id) {
      setError("Please select a class");
      return;
    }
    if (form.components.some((c) => !c.fee_head_id || !c.amount)) {
      setError("All fee components must have a head and an amount");
      return;
    }
    if (form.installments.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Installment percentages must sum to 100% (currently ${totalPercentage}%)`);
      return;
    }
    if (form.installments.some((i) => !i.name || !i.due_date || !i.percentage)) {
      setError("All installments must have a name, due date, and percentage");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        academic_year: form.academic_year.trim(),
        class_id: form.class_id,
        section_id: form.section_id || undefined,
        components: form.components.map((c) => ({
          fee_head_id: c.fee_head_id,
          amount: Number(c.amount),
          frequency: c.frequency,
        })),
        installments: form.installments.map((i) => ({
          name: i.name.trim(),
          due_date: i.due_date,
          percentage: Number(i.percentage),
        })),
        late_fee_policy: {
          ...form.late_fee_policy,
          grace_days: Number(form.late_fee_policy.grace_days || 0),
          penalty_value: Number(form.late_fee_policy.penalty_value || 0),
          max_penalty: Number(form.late_fee_policy.max_penalty || 0),
        },
      };

      if (editing) {
        await feeService.updateFeeStructure(editing, payload);
      } else {
        await feeService.createFeeStructure(payload);
      }

      setShowModal(false);
      loadStructures();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save fee structure");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm("Archive this fee structure? Existing student assignments will remain intact.")) return;
    try {
      await feeService.archiveFeeStructure(id);
      loadStructures();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to archive");
    }
  };

  const handleClone = async (id) => {
    const toYear = prompt("Enter target academic year for the clone (e.g. 2026-2027):");
    if (!toYear || !toYear.trim()) return;
    try {
      await feeService.cloneFeeStructure(id, toYear.trim());
      loadStructures();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to clone structure");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Layers size={15} />
            Institutional Fee Schedules
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Fee Structures</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Design grade-wise fee models, installment terms, and automated late penalty rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="mt-0 w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
          >
            <option value="">All Academic Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600"
          >
            <Plus size={14} />
            <span>Create Structure</span>
          </button>
        </div>
      </div>

      {/* ── Structure Cards ── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
            <p className="mt-2 text-xs font-bold text-slate-500">Loading fee structures...</p>
          </div>
        </div>
      ) : structures.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Layers size={36} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-bold text-slate-800">No fee structures found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {filterClass ? "No structures configured for this class." : "Build your first class fee structure."}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
          >
            <Plus size={14} /> New Structure
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {structures.map((s) => {
            const isExp = expanded === s._id;
            return (
              <div
                key={s._id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:border-cyan-200"
              >
                <div
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 select-none"
                  onClick={() => setExpanded(isExp ? null : s._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="rounded-xl bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
                      {s.academic_year}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 truncate">
                        {s.class_id?.name} {s.section_id ? `&bull; Section ${s.section_id.name}` : "&bull; All Sections"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {s.components?.length || 0} Components &bull; {s.installments?.length || 0} Installments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Annual</span>
                      <span className="text-sm font-black text-slate-900">{currency(s.total_annual_amount)}</span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        s.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {s.status === "active" ? "Active" : "Archived"}
                    </span>

                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExp && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                    {/* Components Grid */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Fee Breakdown Components
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {s.components.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                          >
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {c.fee_head_id?.name || "Fee Head"}
                            </p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="font-extrabold text-cyan-800 text-xs">{currency(c.amount)}</span>
                              <span className="text-[10px] font-semibold uppercase text-slate-400">
                                {c.frequency}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Installments Plan */}
                    {s.installments?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Installment Payment Schedule
                        </p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {s.installments.map((inst, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-900 text-xs">{inst.name}</p>
                                <span className="rounded-md bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-800">
                                  {inst.percentage}%
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">
                                Due: {inst.due_date ? new Date(inst.due_date).toLocaleDateString("en-IN") : "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Late Fee Notice */}
                    {s.late_fee_policy?.enabled && (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                        <span>
                          Late Fee Policy:{" "}
                          <strong>
                            {s.late_fee_policy.penalty_type === "percentage"
                              ? `${s.late_fee_policy.penalty_value}%`
                              : currency(s.late_fee_policy.penalty_value)}
                          </strong>{" "}
                          applied {s.late_fee_policy.penalty_frequency?.replace("_", " ")} after{" "}
                          {s.late_fee_policy.grace_days} grace day(s)
                          {s.late_fee_policy.max_penalty > 0
                            ? `, capped at ${currency(s.late_fee_policy.max_penalty)}`
                            : ""}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit size={12} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleClone(s._id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
                      >
                        <Copy size={12} /> Clone Structure
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArchive(s._id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 size={12} /> Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Structure Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">
                {editing ? "Modify Fee Structure" : "Create New Fee Structure"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Academic Year *</label>
                  <input
                    required
                    value={form.academic_year}
                    onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                    placeholder="e.g. 2026-2027"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Class Standard *</label>
                  <select
                    required
                    value={form.class_id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Section (Optional)</label>
                  <select
                    value={form.section_id}
                    onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}
                    className="mt-1"
                  >
                    <option value="">All sections</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Components */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                    Fee Components (Total: {currency(totalAmount)})
                  </span>
                  <button
                    type="button"
                    onClick={addComponent}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:underline"
                  >
                    <Plus size={13} /> Add Component
                  </button>
                </div>

                <div className="space-y-2">
                  {form.components.map((c, i) => (
                    <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <select
                        value={c.fee_head_id}
                        onChange={(e) => updateComponent(i, "fee_head_id", e.target.value)}
                        className="mt-0 flex-1 min-w-[140px]"
                      >
                        <option value="">Select Fee Head</option>
                        {feeHeads.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={0}
                        value={c.amount}
                        onChange={(e) => updateComponent(i, "amount", e.target.value)}
                        placeholder="Amount ₹"
                        className="mt-0 w-28"
                      />

                      <select
                        value={c.frequency}
                        onChange={(e) => updateComponent(i, "frequency", e.target.value)}
                        className="mt-0 w-28"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f}>
                            {f.replace("_", " ")}
                          </option>
                        ))}
                      </select>

                      {form.components.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComponent(i)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Installments */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                    Installment Plan (Total: {totalPercentage}%)
                  </span>
                  <button
                    type="button"
                    onClick={addInstallment}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:underline"
                  >
                    <Plus size={13} /> Add Installment
                  </button>
                </div>

                <div className="space-y-2">
                  {form.installments.map((inst, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <input
                        value={inst.name}
                        onChange={(e) => updateInstallment(idx, "name", e.target.value)}
                        placeholder="Term Name (e.g. Q1, Annual)"
                        className="mt-0 flex-1 min-w-[120px]"
                      />
                      <input
                        type="date"
                        value={inst.due_date}
                        onChange={(e) => updateInstallment(idx, "due_date", e.target.value)}
                        className="mt-0 w-36"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={inst.percentage}
                        onChange={(e) => updateInstallment(idx, "percentage", e.target.value)}
                        placeholder="%"
                        className="mt-0 w-20"
                      />
                      {form.installments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInstallment(idx)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Late Fee Rule */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.late_fee_policy.enabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        late_fee_policy: { ...f.late_fee_policy, enabled: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                  />
                  <span className="text-xs font-bold text-slate-800">Enable Automated Late Fee Penalty</span>
                </label>

                {form.late_fee_policy.enabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Grace Days</label>
                      <input
                        type="number"
                        min={0}
                        value={form.late_fee_policy.grace_days}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            late_fee_policy: { ...f.late_fee_policy, grace_days: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Penalty Type</label>
                      <select
                        value={form.late_fee_policy.penalty_type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            late_fee_policy: { ...f.late_fee_policy, penalty_type: e.target.value },
                          }))
                        }
                        className="mt-1"
                      >
                        {PENALTY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Penalty Amount / %</label>
                      <input
                        type="number"
                        min={0}
                        value={form.late_fee_policy.penalty_value}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            late_fee_policy: { ...f.late_fee_policy, penalty_value: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Application Cycle</label>
                      <select
                        value={form.late_fee_policy.penalty_frequency}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            late_fee_policy: { ...f.late_fee_policy, penalty_frequency: e.target.value },
                          }))
                        }
                        className="mt-1"
                      >
                        {PENALTY_FREQUENCIES.map((f) => (
                          <option key={f} value={f}>
                            {f.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update Structure" : "Create Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
