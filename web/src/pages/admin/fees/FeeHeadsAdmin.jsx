import { useEffect, useState } from "react";
import { Plus, Trash2, X, Tag, Edit3, ShieldAlert, CheckCircle2 } from "lucide-react";
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
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Tag size={15} />
            Finance Ledger Setup
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Fee Heads</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Define individual fee components (tuition, laboratory, annual charges, transport) used in institutional fee structures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-2xl bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-800 border border-cyan-200">
            {heads.length} Fee Heads Configured
          </span>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600"
          >
            <Plus size={14} />
            <span>Create Fee Head</span>
          </button>
        </div>
      </div>

      {/* ── Fee Heads Grid ── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
            <p className="mt-2 text-xs font-bold text-slate-500">Loading fee heads...</p>
          </div>
        </div>
      ) : heads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Tag size={36} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-bold text-slate-800">No fee heads created</h3>
          <p className="mt-1 text-xs text-slate-500">Add fee heads to start constructing class fee structures.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
          >
            <Plus size={14} /> Create First Fee Head
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {heads.map((head) => (
            <div
              key={head._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-cyan-200 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <Tag size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{head.name}</h3>
                      {head.code ? (
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          CODE: {head.code}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      head.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {head.is_active ? "Active" : "Archived"}
                  </span>
                </div>

                {head.description && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {head.description}
                  </p>
                )}

                {head.is_refundable && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    Refundable Caution Deposit
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEdit(head)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>

                {head.is_active && (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(head._id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 size={12} />
                    <span>Deactivate</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Dialog ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-black text-slate-900">{editing ? "Edit Fee Head" : "Create New Fee Head"}</h3>
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Head Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tuition Fee, Exam Fee"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Account Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. TUI-01"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details..."
                  className="mt-1"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.is_refundable}
                  onChange={(e) => setForm((f) => ({ ...f, is_refundable: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                />
                <span className="text-xs font-bold text-slate-700">Mark as Refundable Deposit</span>
              </label>

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
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update Fee Head" : "Create Fee Head"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
