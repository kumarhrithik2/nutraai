import { useEffect, useState } from 'react'
import { AlertTriangle, History, Package, RefreshCw, Save, Search } from 'lucide-react'
import { adminAdjustStock, adminGetInventoryAlerts, adminListInventory, adminListStockAdjustments, getErrorMessage } from '../../services/apiBackend/index.js'
import { formatDate } from './adminFormatters.js'
import { AdminPageHeader, Badge, EmptyState, ErrorState, KpiCard, LoadingState, Pagination, StatusBadge } from './AdminUi.jsx'

const REASONS = [
  { value: 'manual', label: 'Manual adjustment' },
  { value: 'restock', label: 'Restock' },
  { value: 'correction', label: 'Correction' },
  { value: 'damage', label: 'Damage / loss' },
  { value: 'other', label: 'Other' },
]

export default function AdminInventoryPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState(null)
  const [adjustments, setAdjustments] = useState([])
  const [adjPage, setAdjPage] = useState(1)
  const [adjTotal, setAdjTotal] = useState(1)
  const [reload, setReload] = useState(0)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({ productId: '', delta: '', reason: 'restock', note: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [inv, al] = await Promise.all([
          adminListInventory({ q: search, stockStatus: stockStatus || undefined, page, pageSize: 15 }),
          adminGetInventoryAlerts(),
        ])
        if (active) { setItems(inv.results); setTotalPages(inv.totalPages); setAlerts(al); setError('') }
      } catch (e) {
        if (active) setError(getErrorMessage(e, 'Failed to load inventory.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [search, stockStatus, page, reload])

  useEffect(() => {
    let active = true
    adminListStockAdjustments({ page: adjPage, pageSize: 10 })
      .then((d) => { if (active) { setAdjustments(d.results); setAdjTotal(d.totalPages) } })
      .catch(() => {})
    return () => { active = false }
  }, [adjPage, reload])

  async function submitAdjust(e) {
    e.preventDefault()
    setFormError('')
    const delta = parseInt(form.delta, 10)
    if (!form.productId) { setFormError('Select a product.'); return }
    if (!Number.isInteger(delta) || delta === 0) { setFormError('Enter a non-zero stock change (use negative to reduce).'); return }
    if (!form.reason) { setFormError('Select a reason.'); return }
    setSaving(true)
    try {
      await adminAdjustStock(form.productId, { delta, reason: form.reason, note: form.note })
      setToast('Stock updated and adjustment recorded.')
      setForm({ productId: '', delta: '', reason: 'restock', note: '' })
      setPage(1); setAdjPage(1); setReload((v) => v + 1)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not update stock.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border bg-[#173d32] text-white border-[#275c4d] text-xs font-semibold" role="status">{toast}</div>}
      <AdminPageHeader eyebrow="Operations" title="Inventory Management" description="View stock levels, adjust quantities, review adjustment history, and monitor low/out-of-stock alerts."
        actions={<button type="button" onClick={() => setReload((v) => v + 1)} className="p-2.5 rounded-xl border border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] cursor-pointer"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>} />
      {error && <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Alert threshold" value={alerts?.threshold ?? 5} hint="Units or fewer = low stock" />
        <KpiCard label="Low stock" value={alerts?.lowStock?.length ?? 0} hint="Active products at/below threshold" />
        <KpiCard label="Out of stock" value={alerts?.outOfStock?.length ?? 0} hint="Active products with 0 units" />
        <KpiCard label="Tracked products" value={items.length ? '-' : 0} hint="See inventory table below" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3"><Package size={16} className="text-[#173d32]" /><h2 className="text-sm font-bold text-[#173d32]">Inventory</h2></div>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718078]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearch(q.trim()) } }} placeholder="Search name, SKU, category…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#d6ded5] text-xs" />
            </div>
            <select value={stockStatus} onChange={(e) => { setPage(1); setStockStatus(e.target.value) }} className="px-3 py-2 rounded-xl border border-[#d6ded5] text-xs bg-white">
              <option value="">All stock statuses</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <button type="button" onClick={() => { setPage(1); setSearch(q.trim()) }} className="px-3 py-2 rounded-xl bg-[#173d32] text-white text-xs font-semibold cursor-pointer">Search</button>
          </div>
          {loading ? <LoadingState label="Loading inventory…" /> : items.length === 0 ? <EmptyState title="No products found" description="Try adjusting filters or add products in the catalogue." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-[#718078] border-b border-[#e5eae3]"><th className="py-2 pr-2">Product</th><th className="py-2 pr-2">SKU</th><th className="py-2 pr-2">Stock</th><th className="py-2 pr-2">Status</th><th className="py-2">Updated</th></tr></thead>
                <tbody className="divide-y divide-[#f0f3ef]">
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-2"><div className="font-semibold text-[#173d32]">{p.name}</div><div className="text-[#718078]">{p.category || '-'}</div></td>
                      <td className="py-2.5 pr-2 font-mono text-[11px]">{p.sku}</td>
                      <td className="py-2.5 pr-2 font-semibold">{p.stock}</td>
                      <td className="py-2.5 pr-2">{p.stock === 0 ? <StatusBadge status="out_of_stock" /> : p.lowStock ? <Badge tone="warn">Low stock</Badge> : <Badge tone="success">In stock</Badge>}{!p.isActive ? <span className="ml-1"><Badge>Unpublished</Badge></span> : null}</td>
                      <td className="py-2.5 text-[#718078]">{formatDate(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3"><Save size={16} className="text-[#173d32]" /><h2 className="text-sm font-bold text-[#173d32]">Adjust stock</h2></div>
            <form onSubmit={submitAdjust} className="space-y-3">
              <label className="block text-xs"><span className="font-semibold text-[#20342d]">Product</span>
                <select required value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#d6ded5] bg-white">
                  <option value="">Select product</option>
                  {items.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {p.stock}</option>)}
                </select>
              </label>
              <label className="block text-xs"><span className="font-semibold text-[#20342d]">Quantity change</span>
                <input type="number" required value={form.delta} onChange={(e) => setForm((f) => ({ ...f, delta: e.target.value }))} placeholder="e.g. 10 or -3" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#d6ded5]" />
                <span className="text-[#718078]">Positive to add, negative to reduce.</span>
              </label>
              <label className="block text-xs"><span className="font-semibold text-[#20342d]">Reason</span>
                <select value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#d6ded5] bg-white">
                  {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              <label className="block text-xs"><span className="font-semibold text-[#20342d]">Note</span>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} maxLength={300} placeholder="Optional note" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#d6ded5]" />
              </label>
              {formError && <p className="text-xs text-[#dc2626]" role="alert">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-[#173d32] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer">{saving ? 'Saving…' : 'Update stock'}</button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-[#b45309]" /><h2 className="text-sm font-bold text-[#173d32]">Alerts</h2></div>
            {!alerts || (!alerts.lowStock?.length && !alerts.outOfStock?.length) ? <p className="text-xs text-[#718078]">No low-stock or out-of-stock alerts.</p> : (
              <ul className="space-y-2 text-xs max-h-64 overflow-auto">
                {(alerts.outOfStock || []).map((p) => <li key={'o'+p.id} className="flex justify-between gap-2"><span className="text-[#173d32]">{p.name}</span><Badge tone="danger">Out: 0</Badge></li>)}
                {(alerts.lowStock || []).map((p) => <li key={'l'+p.id} className="flex justify-between gap-2"><span className="text-[#173d32]">{p.name}</span><Badge tone="warn">Low: {p.stock}</Badge></li>)}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5eae3] p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3"><History size={16} className="text-[#173d32]" /><h2 className="text-sm font-bold text-[#173d32]">Stock adjustment history</h2></div>
        {adjustments.length === 0 ? <EmptyState title="No adjustments recorded" description="Manual adjustments and order reserve/restock events will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#718078] border-b border-[#e5eae3]"><th className="py-2 pr-2">Date</th><th className="py-2 pr-2">Product</th><th className="py-2 pr-2">Change</th><th className="py-2 pr-2">Stock</th><th className="py-2 pr-2">Reason</th><th className="py-2">Note / By</th></tr></thead>
              <tbody className="divide-y divide-[#f0f3ef]">
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-2 text-[#718078]">{formatDate(a.createdAt)}</td>
                    <td className="py-2 pr-2"><div className="font-semibold text-[#173d32]">{a.productName}</div><div className="text-[#718078]">{a.productSku}</div></td>
                    <td className="py-2 pr-2 font-semibold">{a.delta > 0 ? '+' : ''}{a.delta}</td>
                    <td className="py-2 pr-2">{a.previousStock}{' -> '}{a.newStock}</td>
                    <td className="py-2 pr-2">{a.reasonLabel || a.reason}</td>
                    <td className="py-2 text-[#718078]">{(a.note || '-') + (a.adjustedByEmail ? (' - by ' + a.adjustedByEmail) : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={adjPage} totalPages={adjTotal} onPage={setAdjPage} />
      </div>
    </div>
  )
}