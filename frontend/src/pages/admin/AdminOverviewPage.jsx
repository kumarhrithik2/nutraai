import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, RefreshCw, TrendingUp, ShoppingBag, Shield } from 'lucide-react'
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
} from 'recharts'
import { adminGetOverview, getErrorMessage } from '../../services/apiBackend/index.js'
import { formatDate, formatMoney } from './adminFormatters.js'
import {
  AdminPageHeader,
  ErrorState,
  KpiCard,
  StatusBadge,
  ChartSkeleton,
  SkeletonCard,
} from './AdminUi.jsx'
import AdminHeroSection from '../../components/admin/AdminHeroSection.jsx'
import PlatformHealthSection from '../../components/admin/PlatformHealthSection.jsx'
import ActivityTimeline from '../../components/admin/ActivityTimeline.jsx'
import AnimatedHealthNetwork from '../../components/admin/AnimatedHealthNetwork.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const STATUS_COLORS_DARK = {
  pending_payment: '#F0DDB7',
  paid: '#C6A36B',
  processing: '#7fd4a8',
  shipped: '#9fc5e8',
  delivered: '#7fd4a8',
  cancelled: '#9fb3a8',
  refund_required: '#ff968b',
}

export default function AdminOverviewPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const chartGrid = dark ? '#383027' : '#e5eae3'
  const chartAxis = dark ? '#B9AA98' : '#718078'
  const chartTooltipStyle = {
    backgroundColor: dark ? '#141414' : '#ffffff',
    border: `1px solid ${dark ? '#383027' : '#e5eae3'}`,
    borderRadius: '12px',
    color: dark ? '#F5EBDD' : '#173d32',
  }
  const statusColors = dark ? STATUS_COLORS_DARK : {
    pending_payment: '#d97706',
    paid: '#15803d',
    processing: '#0369a1',
    shipped: '#2563eb',
    delivered: '#16a34a',
    cancelled: '#6b7280',
    refund_required: '#dc2626',
  }

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const d = await adminGetOverview()
        if (active) {
          setData(d)
          setError('')
        }
      } catch (e) {
        if (active) setError(getErrorMessage(e, 'Failed to load overview.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [reload])

  const daily = useMemo(
    () =>
      (data?.charts?.daily || []).map((d) => ({
        ...d,
        revenue: Number(d.revenue || 0),
        label: String(d.date || '').slice(5),
      })),
    [data],
  )
  const statusData = useMemo(
    () =>
      (data?.charts?.status_breakdown || []).map((s) => ({
        name: String(s.status || '').replace(/_/g, ' '),
        value: s.count,
        status: s.status,
      })),
    [data],
  )
  const k = data?.kpis || {}

  if (error) {
    return <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 admin-stagger-child">
        <AdminPageHeader eyebrow="Dashboard" title="Overview" description="Live business metrics, recent orders, inventory alerts, and activity from the database." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonCard label="Customers" />
          <SkeletonCard label="Products" />
          <SkeletonCard label="Orders" />
          <SkeletonCard label="Revenue" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (!data) return null

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
            className={`p-2.5 rounded-xl border transition-all duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98] hover:bg-[#222] hover:border-[#C6A36B]' : 'border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec]'}`} aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <AdminHeroSection />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 admin-stagger-child">
        <KpiCard label="Total Customers" value={k.total_customers ?? 0} hint="Registered customers" icon={null} trend="up" />
        <KpiCard label="Active Products" value={k.active_products ?? 0} hint={`${k.total_products ?? 0} total in catalogue`} icon={null} trend="up" />
        <KpiCard label="Total Orders" value={k.total_orders ?? 0} hint={`${k.pending_orders ?? 0} awaiting payment`} icon={null} trend="up" />
        <KpiCard label="Revenue" value={formatMoney(k.revenue)} hint={`COD collected: ${formatMoney(k.cod_collected_revenue)}`} icon={null} trend="up" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 admin-stagger-child">
        <KpiCard label="Subscriptions" value={k.subscriptions ?? 0} hint="Active memberships" icon={null} trend="up" />
        <KpiCard label="Low Stock" value={k.low_stock_count ?? 0} hint="At or below threshold" icon={null} trend="down" />
        <KpiCard label="Out of Stock" value={k.out_of_stock_count ?? 0} hint="Active products unavailable" icon={null} trend="down" />
        <KpiCard label="Pending Orders" value={k.pending_orders ?? 0} hint="Awaiting payment or action" icon={null} trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 admin-stagger-child">
        <div className="lg:col-span-2 admin-card-hover rounded-2xl border p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className={`text-[#C6A36B]`} />
            <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Orders and revenue (last 14 days)
            </h2>
          </div>
          {daily.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: chartAxis }} stroke={chartAxis} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: chartAxis }} stroke={chartAxis} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: chartAxis }} stroke={chartAxis} />
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? '#F5EBDD' : '#173d32' }} cursor={{ stroke: chartGrid }} />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (INR)"
                    stroke={dark ? '#C6A36B' : '#173d32'}
                    fill={dark ? 'rgba(198,163,107,0.12)' : '#dce8dc'}
                  />
                  <Bar yAxisId="left" dataKey="orders" name="Orders" fill={dark ? '#e2c078' : '#d4a96a'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`text-xs transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              No order data in this period.
            </p>
          )}
        </div>

        <div className="admin-card-hover rounded-2xl border p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#C6A36B]" />
            <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Order status
            </h2>
          </div>
          {statusData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    labelLine={false}
                    label={({ name, value }) => name + ': ' + value}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status] || (dark ? '#9fb3a8' : '#94a3b8')} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartAxis }} itemStyle={{ color: dark ? '#F5EBDD' : '#173d32' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`text-xs transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              No orders yet.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 admin-stagger-child">
        <div className="admin-card-hover rounded-2xl border p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={16} className="text-[#C6A36B]" />
            <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Recent orders
            </h2>
          </div>
          {data.recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`text-left text-[#718078] border-b border-[#e2e7df] uppercase text-[10px] tracking-wider font-bold transition-colors duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98]' : 'bg-[#fbfaf6] border-[#e5eae3] text-[#718078]'}`}>
                    <th className="py-2 pr-2">Order</th>
                    <th className="py-2 pr-2">Customer</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Total</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-[#e2e7df] transition-colors duration-300 ${dark ? 'divide-[#383027]' : ''}`}>
                  {data.recentOrders.map((o) => (
                    <tr key={o.number} className={`hover:bg-[#222]/40 transition-colors ${dark ? '' : 'hover:bg-[#fcfbf7]'}`}>
                      <td className={`py-2 pr-2 font-semibold transition-colors duration-300 ${dark ? 'text-[#F5EBDD]' : 'text-[#173d32]'}`}>{o.number}</td>
                      <td className={`py-2 pr-2 transition-colors duration-300 ${dark ? 'text-[#F5EBDD]' : 'text-[#20342d]'}`}>{o.customerName || o.shipFullName || o.customerEmail || '-'}</td>
                      <td className="py-2 pr-2"><StatusBadge status={o.status} /></td>
                      <td className={`py-2 pr-2 transition-colors duration-300 ${dark ? 'text-[#F5EBDD]' : 'text-[#173d32]'}`}>{formatMoney(o.total, o.currency)}</td>
                      <td className={`py-2 transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`text-xs transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              No orders recorded yet.
            </p>
          )}
        </div>

        <div className="admin-card-hover rounded-2xl border p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-[#F0DDB7]" />
            <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Low-stock alerts
            </h2>
          </div>
          {data.lowStockProducts?.length ? (
            <ul className={`divide-y divide-[#e2e7df] ${dark ? 'divide-[#383027]' : ''}`}>
              {data.lowStockProducts.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className={`font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
                      {p.name}
                    </div>
                    <div className={`transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>{p.sku} - {p.category || '-'}</div>
                  </div>
                  <StatusBadge status={p.stock === 0 ? 'out_of_stock' : 'pending_payment'} />
                  <span className={`font-semibold transition-colors duration-300 ${dark ? 'text-[#F0DDB7]' : 'text-[#173d32]'}`}>{p.stock} units</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-xs transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              No low-stock or out-of-stock active products.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 admin-stagger-child">
        <div className="lg:col-span-1 admin-card-hover rounded-2xl border p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-[#C6A36B]" />
            <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Recent activity
            </h2>
          </div>
          <ActivityTimeline activities={data.recentActivity || []} />
        </div>

        <div className="lg:col-span-1 admin-card-hover rounded-2xl border p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[#C6A36B]" />
            <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Platform health
            </h2>
          </div>
          <PlatformHealthSection />
        </div>
      </div>

      <div className="admin-card-hover rounded-2xl border p-6 shadow-xs transition-all duration-300 admin-enter admin-enter-delay-4">
        <div className="flex items-center gap-2 mb-4">
          <BrainIcon size={16} className="text-[#C6A36B]" />
          <h2 className={`text-sm font-bold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
            Health-data network
          </h2>
        </div>
        <div className="h-80">
          <AnimatedHealthNetwork width={520} height={340} />
        </div>
        <p className={`text-[11px] mt-3 transition-colors duration-300 ${dark ? 'text-[#8a7a66]' : 'text-[#718078]'}`}>
          Connected nodes represent health data points — assessments, orders, subscriptions, and AI interactions flowing through the platform.
        </p>
      </div>
    </div>
  )
}

function BrainIcon(props) {
  return <Activity {...props} />
}
