import { useEffect, useState } from "react";
import {
  ShoppingBag,
  BookOpen,
  Shirt,
  Receipt,
  Printer,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { inventoryService } from "../../api/inventoryService";
import StoreReceiptModal from "../../components/StoreReceiptModal";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function StudentStore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getStudentSelfStore();
      setData(res);
    } catch (err) {
      console.error("Failed to load student store:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const { student, mySales, availableKits, classBooksAndUniforms } = data || {};

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <ShoppingBag size={15} />
            Academic Dispensary & Books
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            My Uniforms, Books & Store Vouchers
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Verify materials issued to you at admission or session start, review receipts, and check prescribed books.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-right text-xs">
          <span className="text-slate-400 font-medium block">Class Enrolled</span>
          <span className="font-bold text-slate-800">
            {student?.class_id?.name || "—"} {student?.section_id?.name ? `(${student.section_id.name})` : ""}
          </span>
        </div>
      </div>

      {/* ── Section 1: Issued Store Vouchers ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <Receipt size={15} />
            </span>
            <h2 className="text-sm font-black text-slate-900">Issued Materials & Receipt Slips</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {mySales?.length || 0} distribution records
          </span>
        </div>

        {mySales?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No uniforms or book packages have been issued under your student account yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mySales?.map((sale) => (
              <div key={sale._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {sale.sale_number}
                    </span>
                    <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 capitalize">
                      {sale.distribution_type?.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-400">• {fmtDate(sale.sale_date)}</span>
                  </div>

                  <div className="text-xs text-slate-600">
                    Items:{" "}
                    <span className="font-medium text-slate-800">
                      {sale.items?.map((i) => `${i.item_name} (×${i.quantity})`).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-black text-slate-900 text-sm">
                      {currency(sale.payable_amount)}
                    </div>
                    <div className="text-[10px] capitalize text-emerald-600 font-bold">
                      {sale.payment_mode?.replace(/_/g, " ")} • {sale.payment_status}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReceipt(sale)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <Printer size={13} /> View Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Prescribed Books & Uniforms for Class ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BookOpen size={15} />
            </span>
            <h2 className="text-sm font-black text-slate-900">
              Prescribed Curriculum Books & Uniform Standards for {student?.class_id?.name || "Your Class"}
            </h2>
          </div>
        </div>

        {classBooksAndUniforms?.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No class-specific items listed yet. Please consult the school administrative desk.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classBooksAndUniforms?.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                      {item.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{item.sku_code}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900 text-xs">{item.item_name}</h3>
                  {item.specifications?.edition_or_publisher && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Publisher: {item.specifications.edition_or_publisher}
                    </div>
                  )}
                  {item.specifications?.size && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Size: {item.specifications.size}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                  <span className="text-slate-400 font-medium">Standard Price</span>
                  <span className="font-black text-slate-800">{currency(item.selling_price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Voucher Modal ── */}
      {selectedReceipt && (
        <StoreReceiptModal sale={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
}

