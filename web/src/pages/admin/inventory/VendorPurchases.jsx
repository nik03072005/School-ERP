import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Receipt,
  Truck,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import { inventoryService } from "../../../api/inventoryService";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function VendorPurchases() {
  const [tab, setTab] = useState("purchases"); // 'purchases' | 'vendors'
  const [loading, setLoading] = useState(true);

  // Purchases list & filters
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsCatalog, setItemsCatalog] = useState([]);

  // New Purchase Inward Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    vendor_id: "",
    invoice_no: "",
    purchase_date: new Date().toISOString().split("T")[0],
    items: [],
    subtotal: 0,
    tax_amount: 0,
    discount: 0,
    grand_total: 0,
    payment_status: "paid",
    payment_mode: "bank_transfer",
    remarks: "",
  });

  // Vendor Modal State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    code: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    gstin: "",
    categories_supplied: ["stationery"],
    notes: "",
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, vRes, iRes] = await Promise.all([
        inventoryService.getPurchases(),
        inventoryService.getVendors(),
        inventoryService.getItems({ is_active: true }),
      ]);
      setPurchases(pRes.purchases || []);
      setVendors(vRes.vendors || []);
      setItemsCatalog(iRes.items || []);
    } catch (err) {
      console.error("Failed to load purchases/vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ── Purchase Inward Operations ──
  const handleOpenNewPurchase = () => {
    setPurchaseForm({
      vendor_id: vendors[0]?._id || "",
      invoice_no: "",
      purchase_date: new Date().toISOString().split("T")[0],
      items: [
        {
          item_id: itemsCatalog[0]?._id || "",
          item_name: itemsCatalog[0]?.item_name || "",
          quantity: 10,
          unit_cost: itemsCatalog[0]?.cost_price || 0,
          tax_percent: 0,
          total: (itemsCatalog[0]?.cost_price || 0) * 10,
        },
      ],
      subtotal: (itemsCatalog[0]?.cost_price || 0) * 10,
      tax_amount: 0,
      discount: 0,
      grand_total: (itemsCatalog[0]?.cost_price || 0) * 10,
      payment_status: "paid",
      payment_mode: "bank_transfer",
      remarks: "",
    });
    setShowPurchaseModal(true);
  };

  const handleAddPurchaseLine = () => {
    const defaultItem = itemsCatalog[0];
    if (!defaultItem) return;
    const newItems = [
      ...purchaseForm.items,
      {
        item_id: defaultItem._id,
        item_name: defaultItem.item_name,
        quantity: 10,
        unit_cost: defaultItem.cost_price || 0,
        tax_percent: 0,
        total: (defaultItem.cost_price || 0) * 10,
      },
    ];
    recalcPurchase(newItems);
  };

  const handleUpdatePurchaseLine = (idx, field, val) => {
    const updated = [...purchaseForm.items];
    const row = { ...updated[idx], [field]: val };

    if (field === "item_id") {
      const selected = itemsCatalog.find((i) => i._id === val);
      if (selected) {
        row.item_name = selected.item_name;
        row.unit_cost = selected.cost_price || 0;
      }
    }

    const qty = Number(row.quantity) || 0;
    const cost = Number(row.unit_cost) || 0;
    const taxP = Number(row.tax_percent) || 0;
    const base = qty * cost;
    row.total = base + (base * taxP) / 100;

    updated[idx] = row;
    recalcPurchase(updated);
  };

  const handleRemovePurchaseLine = (idx) => {
    const updated = purchaseForm.items.filter((_, i) => i !== idx);
    recalcPurchase(updated);
  };

  const recalcPurchase = (lines) => {
    const sub = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0), 0);
    const tax = lines.reduce((acc, l) => {
      const base = (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0);
      return acc + (base * (Number(l.tax_percent) || 0)) / 100;
    }, 0);
    const grand = sub + tax - (Number(purchaseForm.discount) || 0);
    setPurchaseForm((prev) => ({
      ...prev,
      items: lines,
      subtotal: sub,
      tax_amount: tax,
      grand_total: Math.max(0, grand),
    }));
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.vendor_id) {
      alert("Please select a vendor");
      return;
    }
    if (!purchaseForm.items.length) {
      alert("At least one purchase item is required");
      return;
    }
    try {
      await inventoryService.createPurchase(purchaseForm);
      setShowPurchaseModal(false);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record inward purchase");
    }
  };

  // ── Vendor Operations ──
  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: "",
      code: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      gstin: "",
      categories_supplied: ["stationery"],
      notes: "",
    });
    setShowVendorModal(true);
  };

  const handleOpenEditVendor = (v) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      code: v.code || "",
      contact_person: v.contact_person || "",
      phone: v.phone || "",
      email: v.email || "",
      address: v.address || "",
      city: v.city || "",
      gstin: v.gstin || "",
      categories_supplied: v.categories_supplied || ["stationery"],
      notes: v.notes || "",
    });
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await inventoryService.updateVendor(editingVendor._id, vendorForm);
      } else {
        await inventoryService.createVendor(vendorForm);
      }
      setShowVendorModal(false);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save vendor");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Truck size={15} />
            Supply Chain & Procurement
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Vendors & Stock Inward Purchases
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Record supplier purchase orders, GST invoices, and automatic stock level increments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {tab === "purchases" ? (
            <button
              onClick={handleOpenNewPurchase}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
            >
              <Plus size={15} />
              Record Inward Stock Bill
            </button>
          ) : (
            <button
              onClick={handleOpenAddVendor}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
            >
              <Plus size={15} />
              Add New Supplier Vendor
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "purchases", label: "Inward Stock Purchase Register", icon: Receipt },
          { key: "vendors", label: "Vendors & Suppliers Directory", icon: Building2 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} className={isActive ? "text-cyan-400" : "text-slate-400"} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Inward Purchases ── */}
      {tab === "purchases" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-cyan-600" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No inward stock purchase orders recorded yet. Click "Record Inward Stock Bill" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3 px-4">Purchase Order #</th>
                    <th className="py-3 px-4">Vendor / Supplier</th>
                    <th className="py-3 px-4">Vendor Bill #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Items Received</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4">Payment Channel</th>
                    <th className="py-3 px-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((pur) => (
                    <tr key={pur._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {pur.purchase_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{pur.vendor_id?.name || "Vendor"}</div>
                        {pur.vendor_id?.gstin && (
                          <div className="text-[10px] text-slate-400 font-mono">GST: {pur.vendor_id.gstin}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                        {pur.invoice_no || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{fmtDate(pur.purchase_date)}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {pur.items?.reduce((acc, i) => acc + i.quantity, 0)} units ({pur.items?.length} SKUs)
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {currency(pur.grand_total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-800">
                          {pur.payment_mode?.replace(/_/g, " ")}
                        </span>
                        <span className="ml-1.5 inline-block text-[10px] font-bold uppercase rounded-md px-1.5 py-0.2 bg-emerald-100 text-emerald-800">
                          {pur.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {pur.received_by ? `${pur.received_by.first_name || ""} ${pur.received_by.last_name || ""}`.trim() : "Admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Vendors Directory ── */}
      {tab === "vendors" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <div
              key={v._id}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                    {v.code || "VND"}
                  </span>
                  <button
                    onClick={() => handleOpenEditVendor(v)}
                    className="p-1 text-slate-400 hover:text-cyan-700"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <h3 className="mt-2 font-black text-slate-900 text-sm">{v.name}</h3>
                {v.contact_person && (
                  <div className="text-xs text-slate-600 mt-0.5">Contact: {v.contact_person}</div>
                )}

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {v.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" /> {v.phone}
                    </div>
                  )}
                  {v.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" /> {v.email}
                    </div>
                  )}
                  {v.gstin && (
                    <div className="text-[11px] font-mono text-slate-600">
                      GSTIN: <span className="font-bold">{v.gstin}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {v.categories_supplied?.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 capitalize"
                    >
                      {cat.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              {v.notes && (
                <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400 italic">
                  {v.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Record Inward Purchase Bill Modal ── */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Inward Stock Purchase Bill</h3>
                <p className="text-xs text-slate-500">Stock will be automatically incremented in the catalog upon saving</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Supplier Vendor *</label>
                  <select
                    required
                    value={purchaseForm.vendor_id}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:outline-hidden"
                  >
                    <option value="">Choose Supplier...</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor Bill / Invoice # *</label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.invoice_no}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_no: e.target.value })}
                    placeholder="e.g. INV-90481"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchase_date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Purchased Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseLine}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <Plus size={13} /> Add Line Item
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {purchaseForm.items.map((line, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/50 flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-48">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Item</label>
                        <select
                          value={line.item_id}
                          onChange={(e) => handleUpdatePurchaseLine(idx, "item_id", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 font-medium text-slate-800 focus:outline-hidden"
                        >
                          {itemsCatalog.map((i) => (
                            <option key={i._id} value={i._id}>
                              {i.item_name} ({i.sku_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.quantity}
                          onChange={(e) => handleUpdatePurchaseLine(idx, "quantity", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Unit Cost (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={line.unit_cost}
                          onChange={(e) => handleUpdatePurchaseLine(idx, "unit_cost", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Tax %</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.tax_percent}
                          onChange={(e) => handleUpdatePurchaseLine(idx, "tax_percent", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>

                      <div className="w-24 text-right">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Total</label>
                        <span className="block font-black text-slate-900 pt-2">{currency(line.total)}</span>
                      </div>

                      {purchaseForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePurchaseLine(idx)}
                          className="text-slate-400 hover:text-red-600 pt-4"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement and Grand Total */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={purchaseForm.payment_mode}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_mode: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-medium text-slate-800 focus:outline-hidden"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                      <option value="cash">Cash</option>
                      <option value="credit">On Credit (Pending)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Remarks / Note</label>
                    <input
                      type="text"
                      value={purchaseForm.remarks}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, remarks: e.target.value })}
                      placeholder="e.g. Received in 4 boxes with seals intact"
                      className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{currency(purchaseForm.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST / Tax Amount:</span>
                    <span className="font-semibold">{currency(purchaseForm.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-cyan-800">{currency(purchaseForm.grand_total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  Save Inward Purchase & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add / Edit Vendor Modal ── */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingVendor ? "Edit Vendor Details" : "Add New Supplier Vendor"}
              </h3>
              <button
                onClick={() => setShowVendorModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    placeholder="e.g. Oxford Book House"
                    className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor Code</label>
                  <input
                    type="text"
                    value={vendorForm.code}
                    onChange={(e) => setVendorForm({ ...vendorForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. VND-01"
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono uppercase text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorForm.contact_person}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    placeholder="+91 98112 34567"
                    className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={vendorForm.gstin}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value.toUpperCase() })}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono uppercase text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / City</label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  placeholder="Market Street, City"
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

