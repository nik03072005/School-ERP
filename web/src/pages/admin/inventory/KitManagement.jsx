import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Package,
  Sparkles,
  BookOpen,
  Shirt,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { inventoryService } from "../../../api/inventoryService";
import { setupService } from "../../../api/setupService";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function KitManagement() {
  const [kits, setKits] = useState([]);
  const [classes, setClasses] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    class_id: "",
    category: "combined_kit",
    items: [],
    bundle_price: 0,
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [kRes, cRes, iRes] = await Promise.all([
        inventoryService.getKits(),
        setupService.listClasses(),
        inventoryService.getItems({ is_active: true }),
      ]);
      setKits(kRes.kits || []);
      setClasses(cRes.classes || []);
      setCatalogItems(iRes.items || []);
    } catch (err) {
      console.error("Failed to load kits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingKit(null);
    setForm({
      name: "",
      code: "",
      class_id: classes[0]?._id || "",
      category: "combined_kit",
      items: [
        {
          item_id: catalogItems[0]?._id || "",
          quantity: 1,
        },
      ],
      bundle_price: 0,
      description: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (kit) => {
    setEditingKit(kit);
    setForm({
      name: kit.name,
      code: kit.code || "",
      class_id: kit.class_id?._id || kit.class_id || "",
      category: kit.category,
      items: kit.items.map((i) => ({
        item_id: i.item_id?._id || i.item_id,
        quantity: i.quantity || 1,
      })),
      bundle_price: kit.bundle_price || 0,
      description: kit.description || "",
    });
    setShowModal(true);
  };

  const handleAddLine = () => {
    const defaultItem = catalogItems[0];
    if (!defaultItem) return;
    setForm({
      ...form,
      items: [...form.items, { item_id: defaultItem._id, quantity: 1 }],
    });
  };

  const handleUpdateLine = (idx, field, val) => {
    const updated = [...form.items];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm({ ...form, items: updated });
  };

  const handleRemoveLine = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSaveKit = async (e) => {
    e.preventDefault();
    if (!form.items.length) {
      alert("At least one item is required in a kit");
      return;
    }
    try {
      if (editingKit) {
        await inventoryService.updateKit(editingKit._id, form);
      } else {
        await inventoryService.createKit(form);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save bundle kit");
    }
  };

  const handleDeleteKit = async (id) => {
    if (!confirm("Are you sure you want to remove this bundle kit?")) return;
    try {
      await inventoryService.deleteKit(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete kit");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Layers size={15} />
            Package Configurator
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Class Bundles & Admission Kits
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Pre-bundle uniform sets, textbook collections, and stationery packages for rapid 1-click dispensing.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
        >
          <Plus size={16} />
          Create New Class Kit
        </button>
      </div>

      {/* ── Kits Grid ── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-600" />
        </div>
      ) : kits.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-xs text-slate-500">
          No class kits configured yet. Click "Create New Class Kit" to configure one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <div
              key={kit._id}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-lg bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-800">
                      {kit.class_id?.name || "All Grades"}
                    </span>
                    <span className="ml-1.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                      {kit.code || "KIT"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(kit)}
                      className="p-1 text-slate-400 hover:text-cyan-700"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteKit(kit._id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="mt-2.5 font-black text-slate-900 text-sm">{kit.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {kit.description || "Complete starter package for student distribution."}
                </p>

                {/* Items preview list */}
                <div className="mt-3 rounded-2xl bg-slate-50/80 p-3 border border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bundled Items ({kit.items?.length || 0})
                  </div>
                  {kit.items?.slice(0, 4).map((line, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-700">
                      <span className="truncate pr-2">{line.item_id?.item_name || "Catalog Item"}</span>
                      <span className="font-bold text-slate-900 shrink-0">× {line.quantity}</span>
                    </div>
                  ))}
                  {kit.items?.length > 4 && (
                    <div className="text-[10px] text-cyan-600 font-semibold pt-1">
                      + {kit.items.length - 4} more materials
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500 font-medium">Package Price:</span>
                <span className="text-base font-black text-cyan-800">{currency(kit.bundle_price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Kit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingKit ? "Edit Class Kit" : "Configure New Class Bundle Kit"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Kit Title *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Class 1 Complete Admission & Session Kit"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kit Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. KIT-CLS1"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono uppercase text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:outline-hidden"
                  >
                    <option value="">General / All Classes</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kit Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:outline-hidden"
                  >
                    <option value="combined_kit">Combined Uniform & Book Kit</option>
                    <option value="uniform_kit">Uniform Only Package</option>
                    <option value="book_set">Textbook & Notebook Set</option>
                    <option value="lab_kit">Science Lab Practical Kit</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Items Included in Bundle
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {form.items.map((line, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50/50 flex items-center gap-3">
                      <div className="flex-1">
                        <select
                          value={line.item_id}
                          onChange={(e) => handleUpdateLine(idx, "item_id", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden"
                        >
                          {catalogItems.map((i) => (
                            <option key={i._id} value={i._id}>
                              {i.item_name} ({i.sku_code}) - {currency(i.selling_price)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.quantity}
                          onChange={(e) => handleUpdateLine(idx, "quantity", Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 font-bold text-slate-800 text-center focus:outline-hidden"
                        />
                      </div>

                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bundle Total Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.bundle_price}
                    onChange={(e) => setForm({ ...form, bundle_price: e.target.value })}
                    placeholder="e.g. 1650"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kit Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Given upon admission verification"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  Save Kit Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

