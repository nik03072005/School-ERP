import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  User,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { inventoryService } from "../../../api/inventoryService";
import { studentService } from "../../../api/studentService";
import { setupService } from "../../../api/setupService";
import StoreReceiptModal from "../../../components/StoreReceiptModal";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function StudentDistribution() {
  // Student Lookup
  const [studentSearch, setStudentSearch] = useState("");
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Class & Catalog Items
  const [availableItems, setAvailableItems] = useState([]);
  const [availableKits, setAvailableKits] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");

  // Cart / Line Items
  const [cartItems, setCartItems] = useState([]);
  const [distributionType, setDistributionType] = useState("session_start");
  const [academicSession, setAcademicSession] = useState("2026-2027");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState(null);

  // Load Inventory Catalog
  useEffect(() => {
    loadCatalog();
  }, [catalogCategory]);

  const loadCatalog = async () => {
    try {
      const res = await inventoryService.getItems({
        category: catalogCategory !== "all" ? catalogCategory : undefined,
        is_active: true,
      });
      setAvailableItems(res.items || []);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    }
  };

  // Student Search Handler
  const handleStudentSearch = async (val) => {
    setStudentSearch(val);
    if (!val || val.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const res = await studentService.listStudents({ search: val.trim() });
      setStudentResults(res.students || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Select a Student
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentResults([]);
    setStudentSearch("");

    // Look for preset kits for the student's class
    if (student.class_id?._id || student.class_id) {
      const classId = student.class_id?._id || student.class_id;
      try {
        const res = await inventoryService.getKits({ class_id: classId });
        setAvailableKits(res.kits || []);
      } catch (e) {
        console.error("Failed to load kits:", e);
      }
    }
  };

  // Load Kit into Cart
  const handleLoadKit = (kit) => {
    const newItems = [...cartItems];
    kit.items.forEach((kitLine) => {
      const itemObj = kitLine.item_id;
      if (!itemObj) return;

      const existingIndex = newItems.findIndex((c) => c.item_id === itemObj._id);
      if (existingIndex > -1) {
        newItems[existingIndex].quantity += kitLine.quantity;
        newItems[existingIndex].total =
          newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      } else {
        newItems.push({
          item_id: itemObj._id,
          item_name: itemObj.item_name,
          sku_code: itemObj.sku_code,
          category: itemObj.category,
          unit: itemObj.unit || "piece",
          unit_price: itemObj.selling_price || 0,
          quantity: kitLine.quantity || 1,
          discount: 0,
          total: (itemObj.selling_price || 0) * (kitLine.quantity || 1),
          max_stock: itemObj.current_stock,
        });
      }
    });

    setCartItems(newItems);
  };

  // Add individual item to cart
  const handleAddItem = (item) => {
    const existingIndex = cartItems.findIndex((c) => c.item_id === item._id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      if (updated[existingIndex].quantity + 1 > item.current_stock) {
        alert(`Cannot exceed available stock of ${item.current_stock} ${item.unit}.`);
        return;
      }
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total =
        updated[existingIndex].quantity * updated[existingIndex].unit_price - updated[existingIndex].discount;
      setCartItems(updated);
    } else {
      if (item.current_stock < 1) {
        alert(`"${item.item_name}" is out of stock.`);
        return;
      }
      setCartItems([
        ...cartItems,
        {
          item_id: item._id,
          item_name: item.item_name,
          sku_code: item.sku_code,
          category: item.category,
          unit: item.unit || "piece",
          unit_price: item.selling_price || 0,
          quantity: 1,
          discount: 0,
          total: item.selling_price || 0,
          max_stock: item.current_stock,
        },
      ]);
    }
  };

  const handleUpdateQty = (index, delta) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    if (newQty > updated[index].max_stock) {
      alert(`Only ${updated[index].max_stock} available in stock.`);
      return;
    }
    updated[index].quantity = newQty;
    updated[index].total = newQty * updated[index].unit_price - updated[index].discount;
    setCartItems(updated);
  };

  const handleUpdateDiscount = (index, disc) => {
    const updated = [...cartItems];
    const val = Number(disc) || 0;
    updated[index].discount = val;
    updated[index].total = updated[index].quantity * updated[index].unit_price - val;
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Calculations
  const grossSubtotal = cartItems.reduce(
    (sum, i) => sum + i.quantity * i.unit_price,
    0
  );
  const totalDiscount = cartItems.reduce((sum, i) => sum + (i.discount || 0), 0);
  const netPayable = Math.max(0, grossSubtotal - totalDiscount);

  // Submit Distribution Sale
  const handleCheckout = async () => {
    if (!selectedStudent) {
      alert("Please select a student before dispensing materials.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Cart is empty. Add items or load a preset bundle.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        student_id: selectedStudent._id,
        distribution_type: distributionType,
        academic_session: academicSession,
        items: cartItems.map((c) => ({
          item_id: c.item_id,
          item_name: c.item_name,
          sku_code: c.sku_code,
          category: c.category,
          quantity: c.quantity,
          unit_price: c.unit_price,
          discount: c.discount || 0,
          total: c.total,
        })),
        subtotal: grossSubtotal,
        discount_total: totalDiscount,
        payable_amount: netPayable,
        paid_amount:
          paymentMode === "billed_to_ledger" || paymentMode === "complimentary"
            ? 0
            : netPayable,
        payment_mode: paymentMode,
        payment_status:
          paymentMode === "complimentary"
            ? "waived"
            : paymentMode === "billed_to_ledger"
            ? "pending"
            : "paid",
        transaction_ref: transactionRef,
        remarks,
      };

      const res = await inventoryService.createStudentSale(payload);
      setCompletedSale(res.sale);

      // Reset cart and reload catalog stock
      setCartItems([]);
      setRemarks("");
      setTransactionRef("");
      loadCatalog();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete distribution");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = availableItems.filter((item) => {
    if (!catalogSearch) return true;
    const q = catalogSearch.toLowerCase();
    return (
      item.item_name.toLowerCase().includes(q) ||
      item.sku_code.toLowerCase().includes(q) ||
      item.specifications?.size?.toLowerCase().includes(q) ||
      item.specifications?.edition_or_publisher?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <ShoppingBag size={15} />
            Student POS & Material Issuance
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Direct Student Sale & Kit Distribution
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Instant distribution of uniform kits, textbook sets, and stationery at admission or session launch.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
            Session: <span className="text-cyan-700 font-mono">2026-2027</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Left Column: Student Selector & Item Catalog (7 Cols) ── */}
        <div className="space-y-6 lg:col-span-7">
          {/* Student Search & Profile Box */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Step 1: Select Student Beneficiary
            </div>

            {!selectedStudent ? (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Type student name, admission no, or roll no to search..."
                  value={studentSearch}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-hidden"
                />

                {searchingStudents && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-600" />
                  </div>
                )}

                {studentResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {studentResults.map((s) => {
                      const name = `${s.user_id?.first_name || ""} ${s.user_id?.last_name || ""}`.trim();
                      return (
                        <div
                          key={s._id}
                          onClick={() => handleSelectStudent(s)}
                          className="cursor-pointer border-b border-slate-100 p-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{name}</div>
                            <div className="text-[11px] text-slate-500">
                              Class: {s.class_id?.name || "—"} • Roll: {s.roll_no || "—"} • Adm: {s.admission_no || "—"}
                            </div>
                          </div>
                          <button className="rounded-xl bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">
                            Select
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl bg-cyan-50/50 p-4 border border-cyan-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 font-bold text-white text-sm">
                    {selectedStudent.user_id?.first_name?.[0] || "S"}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm">
                      {selectedStudent.user_id?.first_name} {selectedStudent.user_id?.last_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Class: <span className="font-bold text-slate-800">{selectedStudent.class_id?.name || "—"}</span>
                      {selectedStudent.section_id?.name ? ` (${selectedStudent.section_id.name})` : ""} • Adm No:{" "}
                      <span className="font-bold text-slate-800">{selectedStudent.admission_no || "—"}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setAvailableKits([]);
                  }}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
                >
                  Change Student
                </button>
              </div>
            )}

            {/* Pre-configured Kits recommendation banner */}
            {selectedStudent && availableKits.length > 0 && (
              <div className="mt-4 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-emerald-600" size={16} />
                    <span className="text-xs font-bold text-emerald-900">
                      Pre-Configured Class Kit Available
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  {availableKits.map((kit) => (
                    <div
                      key={kit._id}
                      className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-emerald-100 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{kit.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {kit.items?.length || 0} bundled items • Package:{" "}
                          <span className="font-bold text-emerald-700">{currency(kit.bundle_price)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadKit(kit)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                      >
                        <Plus size={13} /> Load Kit to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Catalog Item Picker */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 2: Add Catalog Materials
              </div>
              <div className="flex items-center gap-1.5">
                {["all", "uniform", "book", "stationery", "lab_equipment"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-colors ${
                      catalogCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search uniform size, book title, publisher, stationery..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-96 overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const isOutOfStock = item.current_stock === 0;
                return (
                  <div
                    key={item._id}
                    className={`rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                      isOutOfStock
                        ? "border-slate-200 bg-slate-50 opacity-60"
                        : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/20 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                          {item.item_name}
                        </span>
                        <span className="text-xs font-black text-cyan-800 shrink-0">
                          {currency(item.selling_price)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                          {item.sku_code}
                        </span>
                        {item.specifications?.size && (
                          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700">
                            Size: {item.specifications.size}
                          </span>
                        )}
                        {item.specifications?.edition_or_publisher && (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                            {item.specifications.edition_or_publisher}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                      <span className={item.current_stock <= 5 ? "font-bold text-amber-700" : "text-slate-500"}>
                        {item.current_stock} in stock
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddItem(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-cyan-600 transition-colors disabled:bg-slate-300"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Distribution Cart & Settlement (5 Cols) ── */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 3: Materials Cart ({cartItems.length})
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-[11px] font-semibold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Distribution Mode selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Distribution Purpose
              </label>
              <select
                value={distributionType}
                onChange={(e) => setDistributionType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="session_start">Session Start Distribution</option>
                <option value="admission_kit">Admission Starter Kit</option>
                <option value="ad_hoc_sale">Ad-Hoc Counter Sale</option>
                <option value="replacement">Uniform / Book Replacement</option>
                <option value="lab_issue">Lab Kit & Apparatus Issue</option>
              </select>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No items in cart. Add materials or load a class kit from the catalog.
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.item_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {currency(item.unit_price)} / {item.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Qty Stepper */}
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-l-xl"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black text-slate-800">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-r-xl"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-16 font-bold text-slate-900">
                        {currency(item.total)}
                      </div>

                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Settlement Details */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Settlement / Payment Channel
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="cash">Cash Settlement</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="included_in_admission_fee">Included in Admission Fee Package</option>
                  <option value="billed_to_ledger">Bill to Student Fee Ledger (Pay Later)</option>
                  <option value="complimentary">Complimentary / Free Distribution</option>
                </select>
              </div>

              {(paymentMode === "upi" || paymentMode === "card" || paymentMode === "bank_transfer") && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Transaction Ref / UTR / Auth No
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/62819208381"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-800 font-mono focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Remarks / Voucher Note
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional note e.g. issued with 2 sets of uniform"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Total:</span>
                  <span>{currency(grossSubtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- {currency(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-black text-slate-900">
                  <span>Net Payable:</span>
                  <span className="text-cyan-800">{currency(netPayable)}</span>
                </div>
              </div>
            </div>

            {/* Complete Button */}
            <button
              type="button"
              disabled={submitting || cartItems.length === 0 || !selectedStudent}
              onClick={handleCheckout}
              className="w-full rounded-2xl bg-cyan-600 py-3 text-xs font-black text-white shadow-md hover:bg-cyan-700 transition-all disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Processing Distribution...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Complete Distribution & Generate Voucher
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Voucher Modal ── */}
      {completedSale && (
        <StoreReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
    </div>
  );
}

