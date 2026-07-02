import { useEffect, useState } from "react";
import { Plus, Trash2, X, Tag } from "lucide-react";
import { feeService } from "../../../api/feeService";

const emptyForm = { name: "", code: "", description: "", is_refundable: false };

export default function FeeHeadsAdmin() {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHeads();
  }, []);

  const loadHeads = async () => {
    setLoading(true);
    try {
      const { heads } = await feeService.getFeeHeads();
      setHeads(heads || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (head) => {
    setEditing(head._id);
    setForm({
      name: head.name,
      code: head.code || "",
      description: head.description || "",
      is_refundable: !!head.is_refundable,
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await feeService.updateFeeHead(editing, form);
      } else {
        await feeService.createFeeHead(form);
      }
      setShowModal(false);
      loadHeads();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save fee head");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Deactivate this fee head? It will no longer be selectable in new fee structures.")) return;
    try {
      await feeService.deleteFeeHead(id);
      loadHeads();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to deactivate");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Heads</h1>
          <p className="text-sm text-slate-500">Categories used to build fee structures (tuition, transport, exam, etc.)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
        >
          <Plus size={16} /> New Fee Head
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : heads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Tag size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No fee heads yet</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {heads.map((head) => (
            <div key={head._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{head.name}</p>
                  {head.code && <p className="text-xs text-slate-400">{head.code}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    head.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {head.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {head.description && <p className="mt-2 text-sm text-slate-500">{head.description}</p>}
              {head.is_refundable && (
                <p className="mt-2 text-xs font-semibold text-cyan-700">Refundable</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openEdit(head)}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                >
                  Edit
                </button>
                {head.is_active && (
                  <button
                    onClick={() => handleDeactivate(head._id)}
                    className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
                  >
                    <Trash2 size={12} /> Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Fee Head" : "New Fee Head"}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tuition Fee"
                />
              </div>
              <div>
                <label>Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. TUI"
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="mt-0 w-auto"
                  checked={form.is_refundable}
                  onChange={(e) => setForm((f) => ({ ...f, is_refundable: e.target.checked }))}
                />
                Refundable
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
