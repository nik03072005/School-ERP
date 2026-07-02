import { useEffect, useState } from "react";
import { Plus, Trash2, X, Layers, ChevronDown, ChevronUp, Copy } from "lucide-react";
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
    setForm((f) => ({ ...f, components: [...f.components, { fee_head_id: "", amount: "", frequency: "annual" }] }));
  const removeComponent = (i) => setForm((f) => ({ ...f, components: f.components.filter((_, idx) => idx !== i) }));
  const updateComponent = (i, key, val) =>
    setForm((f) => {
      const components = [...f.components];
      components[i] = { ...components[i], [key]: val };
      return { ...f, components };
    });

  const addInstallment = () =>
    setForm((f) => ({ ...f, installments: [...f.installments, { name: "", due_date: "", percentage: "" }] }));
  const removeInstallment = (i) => setForm((f) => ({ ...f, installments: f.installments.filter((_, idx) => idx !== i) }));
  const updateInstallment = (i, key, val) =>
    setForm((f) => {
      const installments = [...f.installments];
      installments[i] = { ...installments[i], [key]: val };
      return { ...f, installments };
    });

  const totalAmount = form.components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalPercentage = form.installments.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.academic_year.trim() || !form.class_id) {
      setError("Academic year and class are required");
      return;
    }
    if (form.installments.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Installment percentages must add up to 100 (currently ${totalPercentage})`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        academic_year: form.academic_year,
        class_id: form.class_id,
        section_id: form.section_id || undefined,
        components: form.components
          .filter((c) => c.fee_head_id && c.amount)
          .map((c) => ({ ...c, amount: Number(c.amount) })),
        installments: form.installments
          .filter((i) => i.name && i.due_date)
          .map((i) => ({ ...i, percentage: Number(i.percentage) })),
        late_fee_policy: {
          ...form.late_fee_policy,
          grace_days: Number(form.late_fee_policy.grace_days),
          penalty_value: Number(form.late_fee_policy.penalty_value),
          max_penalty: Number(form.late_fee_policy.max_penalty),
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
    if (!confirm("Remove this fee structure? If students are already assigned it will be archived instead.")) return;
    try {
      await feeService.archiveFeeStructure(id);
      loadStructures();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to remove");
    }
  };

  const handleClone = async (id) => {
    const academic_year = prompt("Clone into which academic year? (e.g. 2027-2028)");
    if (!academic_year) return;
    try {
      await feeService.cloneFeeStructure(id, { academic_year });
      loadStructures();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to clone");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Structures</h1>
          <p className="text-sm text-slate-500">Define fee components, installments, and late-fee policy per class</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
        >
          <Plus size={16} /> New Structure
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-auto">
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : structures.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Layers size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No fee structures yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {structures.map((s) => (
            <div key={s._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4"
                onClick={() => setExpanded((p) => (p === s._id ? null : s._id))}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 rounded-lg bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                    {s.academic_year}
                  </span>
                  <span className="font-semibold text-slate-900 truncate">
                    {s.class_id?.name} {s.section_id ? `· ${s.section_id.name}` : "· All Sections"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-slate-400 text-xs">
                  <span className="font-semibold text-slate-700">{currency(s.total_annual_amount)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s.status}
                  </span>
                  {expanded === s._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {expanded === s._id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Components</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {s.components.map((c, i) => (
                        <div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <p className="font-semibold text-slate-800">{c.fee_head_id?.name}</p>
                          <p className="text-xs text-slate-500">
                            {currency(c.amount)} · {c.frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {s.installments.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Installments</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {s.installments.map((i, idx) => (
                          <div key={idx} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                            <p className="font-semibold text-slate-800">{i.name}</p>
                            <p className="text-xs text-slate-500">
                              {i.percentage}% · due {new Date(i.due_date).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {s.late_fee_policy?.enabled && (
                    <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Late fee: {s.late_fee_policy.penalty_type === "percentage" ? `${s.late_fee_policy.penalty_value}%` : currency(s.late_fee_policy.penalty_value)}{" "}
                      {s.late_fee_policy.penalty_frequency.replace("_", " ")} after {s.late_fee_policy.grace_days} grace day(s)
                      {s.late_fee_policy.max_penalty > 0 ? `, capped at ${currency(s.late_fee_policy.max_penalty)}` : ""}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(s)} className="btn btn-ghost">
                      Edit
                    </button>
                    <button
                      onClick={() => handleClone(s._id)}
                      className="flex items-center gap-1 rounded-xl bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition"
                    >
                      <Copy size={14} /> Clone to New Year
                    </button>
                    <button
                      onClick={() => handleArchive(s._id)}
                      className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Fee Structure" : "New Fee Structure"}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label>Academic Year *</label>
                  <input
                    required
                    value={form.academic_year}
                    onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                    placeholder="e.g. 2026-2027"
                  />
                </div>
                <div>
                  <label>Class *</label>
                  <select required value={form.class_id} onChange={(e) => handleClassChange(e.target.value)}>
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Section (optional)</label>
                  <select value={form.section_id} onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}>
                    <option value="">All sections</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="mb-0">Fee Components — Total: {currency(totalAmount)}</label>
                  <button type="button" onClick={addComponent} className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700">
                    <Plus size={12} /> Add Component
                  </button>
                </div>
                <div className="space-y-2">
                  {form.components.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={c.fee_head_id}
                        onChange={(e) => updateComponent(i, "fee_head_id", e.target.value)}
                        className="flex-1"
                      >
                        <option value="">Select fee head</option>
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
                        placeholder="Amount"
                        className="w-32"
                      />
                      <select value={c.frequency} onChange={(e) => updateComponent(i, "frequency", e.target.value)} className="w-32">
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f}>
                            {f.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      {form.components.length > 1 && (
                        <button type="button" onClick={() => removeComponent(i)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="mb-0">
                    Installment Plan — Total: {totalPercentage}%{" "}
                    <span className="text-xs font-normal text-slate-400">(leave empty for a single full-payment due today)</span>
                  </label>
                  <button type="button" onClick={addInstallment} className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700">
                    <Plus size={12} /> Add Installment
                  </button>
                </div>
                <div className="space-y-2">
                  {form.installments.map((i, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={i.name}
                        onChange={(e) => updateInstallment(idx, "name", e.target.value)}
                        placeholder="e.g. Term 1"
                        className="flex-1"
                      />
                      <input
                        type="date"
                        value={i.due_date}
                        onChange={(e) => updateInstallment(idx, "due_date", e.target.value)}
                        className="w-40"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={i.percentage}
                        onChange={(e) => updateInstallment(idx, "percentage", e.target.value)}
                        placeholder="%"
                        className="w-24"
                      />
                      {form.installments.length > 1 && (
                        <button type="button" onClick={() => removeInstallment(idx)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="mt-0 w-auto"
                    checked={form.late_fee_policy.enabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, late_fee_policy: { ...f.late_fee_policy, enabled: e.target.checked } }))
                    }
                  />
                  Enable Late Fee Penalty
                </label>
                {form.late_fee_policy.enabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
                    <div>
                      <label>Grace Days</label>
                      <input
                        type="number"
                        min={0}
                        value={form.late_fee_policy.grace_days}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, late_fee_policy: { ...f.late_fee_policy, grace_days: e.target.value } }))
                        }
                      />
                    </div>
                    <div>
                      <label>Penalty Type</label>
                      <select
                        value={form.late_fee_policy.penalty_type}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, late_fee_policy: { ...f.late_fee_policy, penalty_type: e.target.value } }))
                        }
                      >
                        {PENALTY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Penalty Value</label>
                      <input
                        type="number"
                        min={0}
                        value={form.late_fee_policy.penalty_value}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, late_fee_policy: { ...f.late_fee_policy, penalty_value: e.target.value } }))
                        }
                      />
                    </div>
                    <div>
                      <label>Applied</label>
                      <select
                        value={form.late_fee_policy.penalty_frequency}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            late_fee_policy: { ...f.late_fee_policy, penalty_frequency: e.target.value },
                          }))
                        }
                      >
                        {PENALTY_FREQUENCIES.map((f) => (
                          <option key={f} value={f}>
                            {f.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label>Max Penalty (0 = no cap)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.late_fee_policy.max_penalty}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, late_fee_policy: { ...f.late_fee_policy, max_penalty: e.target.value } }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Saving…" : editing ? "Update" : "Create Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
