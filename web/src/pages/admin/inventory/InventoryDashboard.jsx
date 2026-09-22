import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Shirt,
  BookOpen,
  PenTool,
  FlaskConical,
  PlusCircle,
  ArrowRight,
  Receipt,
  Users,
  Building2,
  RefreshCw,
} from "lucide-react";
import { inventoryService } from "../../../api/inventoryService";

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function InventoryDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getSummary();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load inventory summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const categoryCards = [
    {
      label: "Uniforms & Apparel",
      icon: Shirt,
      key: "uniform",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      label: "Textbooks & Workbooks",
      icon: BookOpen,
      key: "book",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      label: "Stationery & Supplies",
      icon: PenTool,
      key: "stationery",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      label: "Laboratory Equipment",
      icon: FlaskConical,
      key: "lab_equipment",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Package size={15} />
            Campus Store, Materials & Logistics
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Inventory, Uniform & Book Store
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time stock valuation, student admission distribution, inward vendor procurement, and laboratory assets.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/inventory/distribution"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
          >
            <ShoppingBag size={15} />
            Student POS Distribution
          </Link>
          <Link
            to="/admin/inventory/purchases"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
          >
            <PlusCircle size={15} />
            Inward Stock Entry
          </Link>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Catalog Items */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog SKUs</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Package size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{data?.totalItems || 0}</div>
          <div className="mt-1 text-xs text-slate-500">Active tracked items</div>
        </div>

        {/* Inventory Valuation */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Valuation (Cost)</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-700">{currency(data?.totalStockValueCost)}</div>
          <div className="mt-1 text-xs text-slate-500">
            Sale Valuation: <span className="font-semibold text-slate-700">{currency(data?.totalStockValueSelling)}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Warning</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">{data?.lowStockCount || 0}</div>
          <div className="mt-1 text-xs text-slate-500">Items below minimum reorder level</div>
        </div>

        {/* Today's Sales */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Store Sales</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Receipt size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-cyan-800">{currency(data?.todaySales?.amount)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {data?.todaySales?.count || 0} vouchers today • Month: {currency(data?.monthSales?.amount)}
          </div>
        </div>
      </div>

      {/* ── Category Breakdown Cards ── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">
          Inventory by Division
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            const stat = data?.categoryStats?.[cat.key] || { count: 0, stock: 0, costValue: 0 };
            return (
              <div key={cat.key} className={`rounded-3xl border p-5 bg-white shadow-xs`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                  <div className={`p-2 rounded-xl ${cat.color}`}>
                    <Icon size={18} className={cat.iconColor} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-xl font-black text-slate-900">{stat.stock} units</div>
                    <div className="text-[11px] text-slate-500">{stat.count} distinct SKUs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">{currency(stat.costValue)}</div>
                    <div className="text-[10px] text-slate-400">Total Asset Val</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two Column Activity & Alerts ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={15} />
              </span>
              <h3 className="text-sm font-bold text-slate-800">Critical Low Stock Reorder Alerts</h3>
            </div>
            <Link
              to="/admin/inventory/items?low_stock=true"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {data?.lowStockItems?.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50/60 p-6 text-center text-xs font-semibold text-emerald-700 border border-emerald-100">
              ✓ All inventory items are adequately stocked above threshold levels.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden">
              {data?.lowStockItems?.map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{item.item_name}</div>
                    <div className="text-[11px] text-slate-500">
                      SKU: <span className="font-mono">{item.sku_code}</span> • Category: <span className="capitalize">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                      {item.current_stock} {item.unit} left
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Min Alert: {item.min_alert_stock}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Student Distribution Activity */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <ShoppingBag size={15} />
              </span>
              <h3 className="text-sm font-bold text-slate-800">Recent Student Distributions</h3>
            </div>
            <Link
              to="/admin/inventory/register"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 inline-flex items-center gap-1"
            >
              Full Register <ArrowRight size={13} />
            </Link>
          </div>

          {data?.recentSales?.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
              No distributions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden">
              {data?.recentSales?.map((sale) => {
                const s = sale.student_id;
                const studentName = s?.user_id
                  ? `${s.user_id.first_name || ""} ${s.user_id.last_name || ""}`.trim()
                  : "Student";
                return (
                  <div key={sale._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {s?.class_id?.name || "Class"} • Voucher: <span className="font-mono font-semibold text-slate-700">{sale.sale_number}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{currency(sale.payable_amount)}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{sale.distribution_type?.replace("_", " ")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

