import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Shirt,
  BookOpen,
  PenTool,
  FlaskConical,
  Edit2,
  Sliders,
  Check,
  X,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { inventoryService } from "../../../api/inventoryService";
import { setupService } from "../../../api/setupService";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CATEGORIES = [
  { id: "all", label: "All Items", icon: Package },
  { id: "uniform", label: "Uniforms", icon: Shirt },
  { id: "book", label: "Books", icon: BookOpen },
  { id: "stationery", label: "Stationery", icon: PenTool },
  { id: "lab_equipment", label: "Lab Equipment", icon: FlaskConical },
];

export default function InventoryItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("low_stock") === "true");

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);

  // Item Form State
  const [formData, setFormData] = useState({
    item_name: "",
    sku_code: "",
    category: "uniform",
    subcategory: "",
    unit: "piece",
    applicable_class_ids: [],
    specifications: { size: "", edition_or_publisher: "", lab_type: "none", shelf_location: "" },
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    min_alert_stock: 5,
    description: "",
  });

  // Stock Adjust Form State
  const [adjustData, setAdjustData] = useState({
    action_type: "adjustment_damage",
    quantity_change: -1,
    reason: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, classesRes] = await Promise.all([
        inventoryService.getItems({
          category: activeCategory,
          search,
          class_id: selectedClass || undefined,
          low_stock: lowStockOnly ? "true" : undefined,
        }),
        setupService.listClasses(),
      ]);
      setItems(itemsRes.items || []);
      setClasses(classesRes.classes || []);
    } catch (err) {
      console.error("Failed to load inventory items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCategory, selectedClass, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      item_name: "",
      sku_code: "",
      category: activeCategory === "all" ? "uniform" : activeCategory,
      subcategory: "",
      unit: "piece",
      applicable_class_ids: [],
      specifications: { size: "", edition_or_publisher: "", lab_type: "none", shelf_location: "" },
      cost_price: 0,
      selling_price: 0,
      current_stock: 0,
      min_alert_stock: 5,
      description: "",
    });
    setShowItemModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      sku_code: item.sku_code,
      category: item.category,
      subcategory: item.subcategory || "",
      unit: item.unit || "piece",
      applicable_class_ids: item.applicable_class_ids?.map((c) => (typeof c === "object" ? c._id : c)) || [],
      specifications: {
        size: item.specifications?.size || "",
        edition_or_publisher: item.specifications?.edition_or_publisher || "",
        lab_type: item.specifications?.lab_type || "none",
        shelf_location: item.specifications?.shelf_location || "",
      },
      cost_price: item.cost_price || 0,
      selling_price: item.selling_price || 0,
      current_stock: item.current_stock || 0,
      min_alert_stock: item.min_alert_stock || 5,
      description: item.description || "",
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryService.updateItem(editingItem._id, formData);
      } else {
        await inventoryService.createItem(formData);
      }
      setShowItemModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save item");
    }
  };

  const handleOpenAdjustModal = (item) => {
    setAdjustingItem(item);
    setAdjustData({
      action_type: "adjustment_damage",
      quantity_change: -1,
      reason: "",
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustingItem) return;
    try {
      await inventoryService.adjustStock(adjustingItem._id, adjustData);
      setShowAdjustModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to adjust stock");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Package size={15} />
            Stock Master & Catalog
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Store Items & Stock Levels
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage uniforms, books, stationery, and laboratory equipment with live inventory levels.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
        >
          <Plus size={16} />
          Add New Store Item
        </button>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchParams((prev) => {
                  if (cat.id === "all") prev.delete("category");
                  else prev.set("category", cat.id);
                  return prev;
                });
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} className={isActive ? "text-cyan-400" : "text-slate-400"} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by item title, SKU, publisher, size..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-hidden"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
              lowStockOnly
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <AlertTriangle size={13} />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* ── Items Table ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No inventory items match your current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Item Details & SKU</th>
                  <th className="py-3 px-4">Category / Type</th>
                  <th className="py-3 px-4">Specifics</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isLow = item.current_stock <= item.min_alert_stock;
                  const isOut = item.current_stock === 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Item Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.item_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {item.sku_code} {item.specifications?.shelf_location ? `• Shelf: ${item.specifications.shelf_location}` : ""}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 capitalize">
                          {item.category?.replace("_", " ")}
                        </span>
                        {item.subcategory && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.subcategory}</div>
                        )}
                      </td>

                      {/* Specifics */}
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {item.category === "uniform" && item.specifications?.size && (
                          <div>Size: <span className="font-bold text-slate-800">{item.specifications.size}</span></div>
                        )}
                        {item.category === "book" && item.specifications?.edition_or_publisher && (
                          <div>{item.specifications.edition_or_publisher}</div>
                        )}
                        {item.category === "lab_equipment" && item.specifications?.lab_type && (
                          <div className="capitalize">{item.specifications.lab_type}</div>
                        )}
                        {item.applicable_class_ids?.length > 0 && (
                          <div className="text-[10px] text-cyan-700 font-medium">
                            Classes: {item.applicable_class_ids.map((c) => c.name || c).join(", ")}
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isOut
                              ? "bg-red-100 text-red-700"
                              : isLow
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.current_stock} {item.unit}
                        </span>
                        {isLow && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                            Min: {item.min_alert_stock}
                          </div>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {currency(item.cost_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {currency(item.selling_price)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Adjust Stock (Loss / Damage / Return)"
                            onClick={() => handleOpenAdjustModal(item)}
                            className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-700 transition-colors"
                          >
                            <Sliders size={15} />
                          </button>
                          <button
                            title="Edit Item Details"
                            onClick={() => handleOpenEditModal(item)}
                            className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-700 transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Item Modal ── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingItem ? "Edit Catalog Item" : "Add New Store Item"}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Title / Description *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="e.g. Boys Summer Shirt White"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    value={formData.sku_code}
                    onChange={(e) => setFormData({ ...formData, sku_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. UNI-SHT-WHT-28"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-slate-800 focus:border-cyan-500 focus:outline-hidden uppercase disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  >
                    <option value="uniform">Uniform</option>
                    <option value="book">Book</option>
                    <option value="stationery">Stationery</option>
                    <option value="lab_equipment">Lab Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Summer Uniform"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  >
                    <option value="piece">Piece</option>
                    <option value="pair">Pair</option>
                    <option value="set">Set</option>
                    <option value="box">Box</option>
                    <option value="dozen">Dozen</option>
                    <option value="packet">Packet</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Specifics depending on category */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Category Specific Attributes
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {formData.category === "uniform" && (
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Size (e.g. 28, 30, S, M, L)</label>
                      <input
                        type="text"
                        value={formData.specifications.size}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specifications: { ...formData.specifications, size: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {formData.category === "book" && (
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Publisher / Edition</label>
                      <input
                        type="text"
                        value={formData.specifications.edition_or_publisher}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specifications: { ...formData.specifications, edition_or_publisher: e.target.value },
                          })
                        }
                        placeholder="NCERT / Cambridge"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {formData.category === "lab_equipment" && (
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Lab Equipment Type</label>
                      <select
                        value={formData.specifications.lab_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specifications: { ...formData.specifications, lab_type: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden"
                      >
                        <option value="none">None</option>
                        <option value="consumable">Consumable</option>
                        <option value="non_consumable">Non-Consumable Asset</option>
                        <option value="apparatus">Apparatus</option>
                        <option value="glassware">Glassware</option>
                        <option value="chemical">Chemical / Reagent</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Shelf / Locker Location</label>
                    <input
                      type="text"
                      value={formData.specifications.shelf_location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: { ...formData.specifications, shelf_location: e.target.value },
                        })
                      }
                      placeholder="e.g. Shelf B-2"
                      className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing and Stock Counts */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingItem ? "Stock on Hand" : "Opening Stock"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!!editingItem}
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:border-cyan-500 focus:outline-hidden disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_alert_stock}
                    onChange={(e) => setFormData({ ...formData, min_alert_stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Stock Adjustment Modal ── */}
      {showAdjustModal && adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-slate-500 font-medium">{adjustingItem.item_name}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 text-xs">
                Current Stock on Hand:{" "}
                <span className="font-bold text-slate-900">
                  {adjustingItem.current_stock} {adjustingItem.unit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustData.action_type}
                  onChange={(e) => setAdjustData({ ...adjustData, action_type: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:outline-hidden"
                >
                  <option value="adjustment_damage">Damaged / Defective (-)</option>
                  <option value="adjustment_loss">Missing / Lost (-)</option>
                  <option value="adjustment_return">Student Return / Restock (+)</option>
                  <option value="manual_correction">Physical Audit Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity Adjustment (positive to add, negative to subtract)
                </label>
                <input
                  type="number"
                  required
                  value={adjustData.quantity_change}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity_change: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Reference Note *</label>
                <textarea
                  rows="2"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Annual stock audit discrepancy / Water damage"
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

