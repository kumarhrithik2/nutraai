import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  adminGetOverview,
  getErrorMessage,
} from "../../services/apiBackend/index.js";
import { formatDate, formatMoney } from './adminFormatters.js'
import {
  AdminPageHeader,
  ErrorState,
  KpiCard,
  LoadingState,
  StatusBadge,
} from "./AdminUi.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const STATUS_COLORS = {
  pending_payment: "#d97706",
  paid: "#15803d",
  processing: "#0369a1",
  shipped: "#2563eb",
  delivered: "#16a34a",
  cancelled: "#6b7280",
  refund_required: "#dc2626",
};

const STATUS_COLORS_DARK = {
  pending_payment: "#f3c969",
  paid: "#63d18f",
  processing: "#6cb8f0",
  shipped: "#7da8ff",
  delivered: "#7fd4a8",
  cancelled: "#9fb3a8",
  refund_required: "#ff968b",
};

export default function AdminOverviewPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chartGrid = dark ? "#33453d" : "#e5eae3";
  const chartAxis = dark ? "#9fb3a8" : "#718078";
  const chartTooltipStyle = {
    backgroundColor: dark ? "#18221d" : "#ffffff",
    border: `1px solid ${dark ? "#33453d" : "#e5eae3"}`,
    borderRadius: "12px",
    color: dark ? "#e8f1eb" : "#173d32",
  };
  const statusColors = dark ? STATUS_COLORS_DARK : STATUS_COLORS;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const d = await adminGetOverview();
        if (active) {
          setData(d);
          setError("");
        }
      } catch (e) {
        if (active) setError(getErrorMessage(e, "Failed to load overview."));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reload]);

  const daily = useMemo(
    () =>
      (data?.charts?.daily || []).map((d) => ({
        ...d,
        revenue: Number(d.revenue || 0),
        label: String(d.date || "").slice(5),
      })),
    [data],
  );
  const statusData = useMemo(
    () =>
      (data?.charts?.status_breakdown || []).map((s) => ({
        name: String(s.status || "").replace(/_/g, " "),
        value: s.count,
        status: s.status,
      })),
    [data],
  );
  const k = data?.kpis || {};

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="Live business metrics, recent orders, inventory alerts, and activity from the database."
        actions={
          <button
            type="button"
            onClick={() => setReload((v) => v + 1)}
            className="p-2.5 rounded-xl border border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] cursor-pointer"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />
      {error && (
        <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />
      )}
      {loading && !data ? (
        <div className="bg-white rounded-2xl border border-[#e5eae3]">
          <LoadingState label="Loading overview data..." />
        </div>
      ) : null}
      {data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Customers"
              value={k.total_customers ?? 0}
              hint="Registered customers"
            />
            <KpiCard
              label="Products"
              value={k.active_products ?? 0}
              hint={String(k.total_products ?? 0) + " total in catalogue"}
            />
            <KpiCard
              label="Orders"
              value={k.total_orders ?? 0}
              hint={String(k.pending_orders ?? 0) + " awaiting payment"}
            />
            <KpiCard
              label="Revenue"
              value={formatMoney(k.revenue)}
              hint={"COD collected: " + formatMoney(k.cod_collected_revenue)}
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Subscriptions"
              value={k.subscriptions ?? 0}
              hint="Active memberships and supplement plans"
            />
            <KpiCard
              label="Low stock"
              value={k.low_stock_count ?? 0}
              hint="At or below threshold"
            />
            <KpiCard
              label="Out of stock"
              value={k.out_of_stock_count ?? 0}
              hint="Active products unavailable"
            />
            <KpiCard
              label="Pending orders"
              value={k.pending_orders ?? 0}
              hint="Awaiting payment or action"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[#173d32]" />
                <h2 className="text-sm font-bold text-[#173d32]">
                  Orders and revenue (last 14 days)
                </h2>
              </div>
              {daily.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={daily}
                      margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: chartAxis }} stroke={chartAxis} />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: chartAxis }}
                        stroke={chartAxis}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: chartAxis }}
                        stroke={chartAxis}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? "#e8f1eb" : "#173d32" }} cursor={{ stroke: chartGrid }} />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue (INR)"
                        stroke={dark ? "#7fd4a8" : "#173d32"}
                        fill={dark ? "rgba(127,212,168,0.18)" : "#dce8dc"}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="orders"
                        name="Orders"
                        fill={dark ? "#e2c078" : "#d4a96a"}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#718078]">
                  No order data in this period.
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-[#173d32]" />
                <h2 className="text-sm font-bold text-[#173d32]">
                  Order status
                </h2>
              </div>
              {statusData.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        labelLine={false}
                        label={(entry) => entry.name + ": " + entry.value}
                      >
                        {statusData.map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={statusColors[entry.status] || (dark ? "#9fb3a8" : "#94a3b8")}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? "#e8f1eb" : "#173d32" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#718078]">No orders yet.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag size={16} className="text-[#173d32]" />
                <h2 className="text-sm font-bold text-[#173d32]">
                  Recent orders
                </h2>
              </div>
              {data.recentOrders?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[#718078] border-b border-[#e5eae3]">
                        <th className="py-2 pr-2">Order</th>
                        <th className="py-2 pr-2">Customer</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2 pr-2">Total</th>
                        <th className="py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f3ef]">
                      {data.recentOrders.map((o) => (
                        <tr key={o.number}>
                          <td className="py-2 pr-2 font-semibold text-[#173d32]">
                            {o.number}
                          </td>
                          <td className="py-2 pr-2">
                            {o.customerName ||
                              o.shipFullName ||
                              o.customerEmail ||
                              "-"}
                          </td>
                          <td className="py-2 pr-2">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="py-2 pr-2">
                            {formatMoney(o.total, o.currency)}
                          </td>
                          <td className="py-2 text-[#718078]">
                            {formatDate(o.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#718078]">
                  No orders recorded yet.
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-[#b45309]" />
                <h2 className="text-sm font-bold text-[#173d32]">
                  Low-stock alerts
                </h2>
              </div>
              {data.lowStockProducts?.length ? (
                <ul className="divide-y divide-[#f0f3ef]">
                  {data.lowStockProducts.map((p) => (
                    <li
                      key={p.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#173d32]">
                          {p.name}
                        </div>
                        <div className="text-[#718078]">
                          {p.sku} - {p.category || "-"}
                        </div>
                      </div>
                      <StatusBadge
                        status={
                          p.stock === 0 ? "out_of_stock" : "pending_payment"
                        }
                      />
                      <span className="font-semibold text-[#173d32]">
                        {p.stock} units
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#718078]">
                  No low-stock or out-of-stock active products.
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-[#173d32]" />
              <h2 className="text-sm font-bold text-[#173d32]">
                Recent activity
              </h2>
            </div>
            {data.recentActivity?.length ? (
              <ul className="divide-y divide-[#f0f3ef] text-xs">
                {data.recentActivity.map((a) => (
                  <li
                    key={a.id}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <div>
                      <span className="font-semibold text-[#173d32]">
                        {a.action}
                      </span>
                      {a.actorEmail ? (
                        <span className="text-[#718078]">
                          {" "}
                          by {a.actorEmail}
                        </span>
                      ) : null}
                      {a.targetType ? (
                        <span className="text-[#718078]">
                          {" "}
                          - {a.targetType} #{a.targetId}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[#718078]">
                      {formatDate(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#718078]">
                No activity recorded yet.
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
