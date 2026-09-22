import { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Calendar,
  Eye,
  Ban,
  RefreshCw,
  ArrowDownLeft,
} from "lucide-react";
import { inventoryService } from "../../../api/inventoryService";
import StoreReceiptModal from "../../../components/StoreReceiptModal";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function DistributionRegister() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [distributionType, setDistributionType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Cancel Modal
  const [cancelModalSale, setCancelModalSale] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getSales({
        search: search.trim() || undefined,
        distribution_type: distributionType || undefined,
        payment_mode: paymentMode || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setSales(res.sales || []);
    } catch (err) {
      console.error("Failed to load sales register:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [distributionType, paymentMode, from, to]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSales();
  };

  const handleCancelSale = async (e) => {
    e.preventDefault();
    if (!cancelModalSale) return;
    setCancelling(true);
    try {
      await inventoryService.cancelSale(cancelModalSale._id, {
        cancelled_reason: cancelReason,
      });
      setCancelModalSale(null);
      setCancelReason("");
      loadSales();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel sale voucher");
    } finally {
      setCancelling(false);
    }
  };

  const totalDisbursed = sales
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + (s.payable_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Receipt size={15} />
            Dispensary Log & Receipts
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Student Distribution Register
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit trail of all uniform kits, textbook sets, and counter sales issued to students.
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-50/70 border border-cyan-100 px-4 py-2.5 text-right">
          <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider block">
            Filtered Disbursal Total
          </span>
          <span className="text-xl font-black text-cyan-900">{currency(totalDisbursed)}</span>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search voucher #, UTR, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-hidden"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            value={distributionType}
            onChange={(e) => setDistributionType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="">All Distribution Types</option>
            <option value="session_start">Session Start</option>
            <option value="admission_kit">Admission Kit</option>
            <option value="ad_hoc_sale">Ad-Hoc Sale</option>
            <option value="replacement">Replacement</option>
            <option value="lab_issue">Lab Issue</option>
          </select>

          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="included_in_admission_fee">In Admission Fee</option>
            <option value="billed_to_ledger">Ledger Dues</option>
            <option value="complimentary">Complimentary</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-600" />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No sales or material distributions found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Voucher Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student Name & Class</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Payable</th>
                  <th className="py-3 px-4">Channel & Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => {
                  const s = sale.student_id;
                  const studentName = s?.user_id
                    ? `${s.user_id.first_name || ""} ${s.user_id.last_name || ""}`.trim()
                    : "Student";
                  const isCancelled = sale.status === "cancelled";

                  return (
                    <tr
                      key={sale._id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCancelled ? "bg-red-50/20 opacity-70" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">{sale.sale_number}</span>
                        {isCancelled && (
                          <span className="ml-2 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                            Cancelled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {fmtDate(sale.sale_date)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {s?.class_id?.name || "—"} {s?.section_id?.name ? `(${s.section_id.name})` : ""} • Adm: {s?.admission_no || "—"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize text-slate-700 font-semibold">
                          {sale.distribution_type?.replace("_", " ")}
                        </span>
                        {sale.kit_id && (
                          <div className="text-[10px] text-emerald-700 font-medium">{sale.kit_id.name}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {sale.items?.length || 0}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {currency(sale.payable_amount)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="capitalize font-semibold text-slate-800">
                          {sale.payment_mode?.replace(/_/g, " ")}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase rounded-md px-1.5 py-0.2 mt-0.5 ${
                            sale.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : sale.payment_status === "waived"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {sale.payment_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="View / Print Official Receipt"
                            onClick={() => setSelectedSale(sale)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Printer size={13} /> Voucher
                          </button>

                          {!isCancelled && (
                            <button
                              title="Cancel & Restock"
                              onClick={() => setCancelModalSale(sale)}
                              className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Ban size={14} />
                            </button>
                          )}
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

      {/* ── Cancel Sale Modal ── */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">
              Cancel Distribution #{cancelModalSale.sale_number}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Cancelling this voucher will automatically restock all items back into active inventory.
            </p>

            <form onSubmit={handleCancelSale} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cancellation Reason *</label>
                <textarea
                  rows="3"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Student uniform size mismatch return / Admission cancellation"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 shadow-sm"
                >
                  {cancelling ? "Restocking..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {selectedSale && (
        <StoreReceiptModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}

