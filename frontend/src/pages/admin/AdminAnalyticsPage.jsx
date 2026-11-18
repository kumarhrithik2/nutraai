import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminGetAnalytics,
  getErrorMessage,
} from "../../services/apiBackend/index.js";
import { formatMoney } from './adminFormatters.js'
import {
  AdminPageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from "./AdminUi.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const LIGHT_COLORS = ["#173d32", "#2f7a63", "#d4a96a", "#718078", "#1a4437", "#0f6a44"];
const DARK_COLORS = ["#7fd4a8", "#4fbf8a", "#e2c078", "#9fb3a8", "#5fae86", "#3d8f68"];

export default function AdminAnalyticsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const COLORS = dark ? DARK_COLORS : LIGHT_COLORS;
  const chartGrid = dark ? "#33453d" : "#e5eae3";
  const chartAxis = dark ? "#9fb3a8" : "#718078";
  const chartBarPrimary = dark ? "#7fd4a8" : "#173d32";
  const chartBarSecondary = dark ? "#4fbf8a" : "#2f7a63";
  const chartTooltipStyle = {
    backgroundColor: dark ? "#18221d" : "#ffffff",
    border: `1px solid ${dark ? "#33453d" : "#e5eae3"}`,
    borderRadius: "12px",
    color: dark ? "#e8f1eb" : "#173d32",
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setError("");
      try {
        const d = await adminGetAnalytics({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (active) {
          setData(d);
          setError("");
        }
      } catch (e) {
        if (active) setError(getErrorMessage(e, "Failed to load analytics."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [dateFrom, dateTo, reload]);

  const revenueSeries = (data?.revenue_by_month || []).map((r) => ({
    month: String(r.month || "").slice(0, 7),
    revenue: Number(r.revenue) || 0,
    orders: r.orders || 0,
  }));
  const customerSeries = (data?.customer_growth || []).map((r) => ({
    month: String(r.month || "").slice(0, 7),
    count: r.count || 0,
  }));
  const statusData = (data?.order_status_breakdown || []).map((r) => ({
    name: String(r.status || "").replace(/_/g, " "),
    value: r.count,
    revenue: Number(r.revenue) || 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Analytics"
        description="Revenue, orders, customers, inventory, and subscription insights from real data."
        actions={
          <button
            type="button"
            onClick={() => setReload((v) => v + 1)}
            className="p-2.5 rounded-xl border border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />
      <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs flex flex-wrap gap-3 items-end">
        <label className="text-xs">
          <span className="font-semibold text-[#20342d]">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="ml-2 px-3 py-2 rounded-xl border border-[#d6ded5]"
          />
        </label>
        <label className="text-xs">
          <span className="font-semibold text-[#20342d]">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="ml-2 px-3 py-2 rounded-xl border border-[#d6ded5]"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="px-3 py-2 rounded-xl border border-[#d6ded5] text-xs font-semibold text-[#20342d] cursor-pointer"
        >
          Clear
        </button>
      </div>
      {error && (
        <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />
      )}
      {loading && !data ? <LoadingState label="Loading analytics..." /> : null}
      {!loading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-widest text-[#718078]">
                Revenue
              </div>
              <div className="text-lg font-bold text-[#173d32] mt-1">
                {formatMoney(data.summary?.revenue)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-widest text-[#718078]">
                Orders
              </div>
              <div className="text-lg font-bold text-[#173d32] mt-1">
                {data.summary?.orders ?? 0}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-widest text-[#718078]">
                Paid orders
              </div>
              <div className="text-lg font-bold text-[#173d32] mt-1">
                {data.summary?.paid_orders ?? 0}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-widest text-[#718078]">
                AOV
              </div>
              <div className="text-lg font-bold text-[#173d32] mt-1">
                {formatMoney(data.summary?.average_order_value)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[#173d32]" />
                <h2 className="text-sm font-bold text-[#173d32]">
                  Revenue by month
                </h2>
              </div>
              {revenueSeries.length === 0 ? (
                <EmptyState title="No revenue data" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={chartGrid}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: chartAxis }}
                        stroke={chartAxis}
                      />
                      <YAxis tick={{ fontSize: 10, fill: chartAxis }} stroke={chartAxis} />
                      <Tooltip formatter={(v) => formatMoney(v)} contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? "#e8f1eb" : "#173d32" }} cursor={{ fill: dark ? "rgba(127,212,168,0.08)" : "rgba(23,61,50,0.06)" }} />
                      <Bar
                        dataKey="revenue"
                        fill={chartBarPrimary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-[#173d32]" />
                <h2 className="text-sm font-bold text-[#173d32]">
                  Customer growth
                </h2>
              </div>
              {customerSeries.length === 0 ? (
                <EmptyState title="No customer growth data" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={chartGrid}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: chartAxis }}
                        stroke={chartAxis}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: chartAxis }}
                        stroke={chartAxis}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? "#e8f1eb" : "#173d32" }} cursor={{ fill: dark ? "rgba(127,212,168,0.08)" : "rgba(23,61,50,0.06)" }} />
                      <Bar
                        dataKey="count"
                        fill={chartBarSecondary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <h2 className="text-sm font-bold text-[#173d32] mb-3">
                Orders by status
              </h2>
              {statusData.length === 0 ? (
                <EmptyState title="No orders" />
              ) : (
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => name + ": " + value}
                      >
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? "#e8f1eb" : "#173d32" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <h2 className="text-sm font-bold text-[#173d32] mb-3">
                Payment breakdown
              </h2>
              <ul className="space-y-2 text-xs">
                {(data.payment_breakdown || []).map((p) => (
                  <li
                    key={p.payment_method}
                    className="flex justify-between border-b border-[#f0f3ef] pb-1"
                  >
                    <span>
                      {p.payment_method === "cod"
                        ? "Cash on Delivery"
                        : "Online"}
                    </span>
                    <span>
                      {p.count} orders - {formatMoney(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
              <h2 className="text-sm font-bold text-[#173d32] mb-3">
                Top products
              </h2>
              {(data.top_products || []).length === 0 ? (
                <EmptyState title="No product sales data" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[#718078] border-b border-[#e5eae3]">
                        <th className="py-2">Product</th>
                        <th className="py-2">Qty</th>
                        <th className="py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_products.map((p) => (
                        <tr
                          key={p.product_id}
                          className="border-b border-[#f0f3ef]"
                        >
                          <td className="py-2">
                            <div className="font-semibold text-[#173d32]">
                              {p.name}
                            </div>
                            <div className="text-[#718078]">{p.sku}</div>
                          </td>
                          <td className="py-2">{p.quantity}</td>
                          <td className="py-2 text-right">
                            {formatMoney(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#173d32] mb-2">
                  Inventory summary
                </h2>
                <ul className="text-xs space-y-1 text-[#20342d]">
                  <li className="flex justify-between">
                    <span>Total products</span>
                    <span className="font-semibold">
                      {data.inventory?.total_products}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Active</span>
                    <span className="font-semibold">
                      {data.inventory?.active_products}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Low stock</span>
                    <span className="font-semibold">
                      {data.inventory?.low_stock}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Out of stock</span>
                    <span className="font-semibold">
                      {data.inventory?.out_of_stock}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total units</span>
                    <span className="font-semibold">
                      {data.inventory?.total_units}
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#173d32] mb-2">
                  Subscriptions
                </h2>
                <div className="text-xs text-[#20342d]">
                  <div className="font-semibold mb-1">Memberships</div>
                  <ul className="space-y-0.5">
                    {(data.subscriptions?.memberships || []).map((m, i) => (
                      <li key={i}>
                        {m.plan} / {m.status}: {m.count}
                      </li>
                    ))}
                  </ul>
                  <div className="font-semibold mt-2 mb-1">Supplement subs</div>
                  <ul className="space-y-0.5">
                    {(data.subscriptions?.supplement_subscriptions || []).map(
                      (m, i) => (
                        <li key={i}>
                          {m.status}: {m.count}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
