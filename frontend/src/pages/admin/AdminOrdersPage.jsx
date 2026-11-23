import { useEffect, useMemo, useState } from 'react'
import { Eye, RefreshCw, Search, X } from 'lucide-react'
import { adminCancelOrder, adminCollectCod, adminGetOrder, adminListOrders, adminUpdateOrderStatus, getErrorMessage } from '../../services/apiBackend/index.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import { formatDate, formatMoney } from './adminFormatters.js'
import { AdminPageHeader, Badge, EmptyState, ErrorState, LoadingState, Pagination, StatusBadge } from './AdminUi.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const STATUS_OPTIONS = ['', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refund_required']
const STATUS_LABEL = { pending_payment: 'Awaiting payment', paid: 'Paid', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refund_required: 'Refund required' }

function allowedTransitions(order) {
  const s = order?.status
  if (!s) return []
  const map = {
    pending_payment: ['cancelled'],
    paid: ['processing', 'cancelled', 'refund_required'],
    processing: ['shipped', 'cancelled', 'refund_required'],
    shipped: ['delivered', 'refund_required'],
    delivered: ['refund_required'],
    cancelled: [],
    refund_required: [],
  }
  return map[s] || []
}

export default function AdminOrdersPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [tracking, setTracking] = useState('')

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t) }, [toast])

  useEffect(() => {
    let active = true
    ;(async () => {
      setError('')
      try {
        const d = await adminListOrders({ q: search, status: status || undefined, paymentMethod: paymentMethod || undefined, page, pageSize: 15 })
        if (active) { setItems(d.results); setTotalPages(d.totalPages); setError('') }
      } catch (e) {
        if (active) setError(getErrorMessage(e, 'Failed to load orders.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [search, status, paymentMethod, page, reload])

  async function openDetail(number) {
    setSelected(number); setDetail(null); setDetailLoading(true)
    try { const d = await adminGetOrder(number); setDetail(d); setNewStatus(''); setStatusNote(''); setTracking(d.trackingNote || '') }
    catch (e) { setToast(getErrorMessage(e, 'Could not load order details.')); setSelected(null) }
    finally { setDetailLoading(false) }
  }

  async function refreshDetail() {
    if (!selected) return
    try { const d = await adminGetOrder(selected); setDetail(d) } catch { /* ignore */ }
    setReload((v) => v + 1)
  }

  async function applyStatus() {
    if (!detail || !newStatus) return
    setBusy(true)
    try {
      await adminUpdateOrderStatus(detail.number, { status: newStatus, note: statusNote, trackingNote: tracking })
      setToast('Order status updated.'); setStatusNote(''); await refreshDetail()
    } catch (e) { setToast(getErrorMessage(e, 'Could not update order status.')) }
    finally { setBusy(false) }
  }

  async function confirmAction() {
    if (!action || !detail) return
    setBusy(true)
    try {
      if (action.type === 'collect') { await adminCollectCod(detail.number, action.note || ''); setToast('COD payment marked as collected. Order is not unpaid now.') }
      if (action.type === 'cancel') { await adminCancelOrder(detail.number, action.note || ''); setToast('Order cancelled. Reserved stock restored where applicable.') }
      await refreshDetail(); setAction(null)
    } catch (e) { setToast(getErrorMessage(e, 'Action failed.')) }
    finally { setBusy(false) }
  }

  const transitions = useMemo(() => allowedTransitions(detail), [detail])
  const canCollectCod = detail && detail.paymentMethod === 'cod' && !detail.paidAt && detail.status !== 'cancelled' && detail.status !== 'refund_required'
  const canCancel = detail && ['pending_payment', 'paid', 'processing'].includes(detail.status)

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold" role="status">{toast}</div>}
      <AdminPageHeader eyebrow="Operations" title="Orders & Fulfillment" description="View orders, update fulfillment statuses, handle COD collection, and cancel orders with inventory restoration."
        actions={<button type="button" onClick={() => setReload((v) => v + 1)} className={`p-2.5 rounded-xl border transition-all duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98] hover:bg-[#222] hover:border-[#C6A36B]' : 'border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec]'}`} aria-label="Refresh"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>} />
      {error && <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />}

      <div className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718078]" /><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearch(q.trim()) } }} placeholder="Search order, customer, phone…" className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs transition-colors duration-300 ${dark ? 'border-[#383027] text-[#F5EBDD] bg-[#1a1a1a]' : 'border-[#d6ded5] text-[#20342d] bg-white'}`} /></div>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className={`px-3 py-2 rounded-xl border text-xs transition-colors duration-300 ${dark ? 'border-[#383027] text-[#F5EBDD] bg-[#1a1a1a]' : 'border-[#d6ded5] text-[#20342d] bg-white'}`}><option value="">All statuses</option>{STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}</select>
          <select value={paymentMethod} onChange={(e) => { setPage(1); setPaymentMethod(e.target.value) }} className={`px-3 py-2 rounded-xl border text-xs transition-colors duration-300 ${dark ? 'border-[#383027] text-[#F5EBDD] bg-[#1a1a1a]' : 'border-[#d6ded5] text-[#20342d] bg-white'}`}><option value="">All payment methods</option><option value="cod">Cash on Delivery</option><option value="online">Online</option></select>
        </div>
        <div><button type="button" onClick={() => { setPage(1); setSearch(q.trim()) }} className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#173d32] text-white hover:bg-[#11241e]'}`}>Apply filters</button></div>
      </div>

      <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
        {loading ? <LoadingState label="Loading orders…" /> : items.length === 0 ? <EmptyState title="No orders found" description="Orders matching your filters will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className={`text-left text-[#718078] border-b border-[#e5eae3] bg-[#fbfaf6] uppercase text-[10px] tracking-wider transition-colors duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98]' : ''}`}><th className="py-3 px-4">Order</th><th className="py-3 px-3">Customer</th><th className="py-3 px-3">Payment</th><th className="py-3 px-3">Status</th><th className="py-3 px-3">Total</th><th className="py-3 px-3">Date</th><th className="py-3 px-4 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#f0f3ef] transition-colors duration-300">
                {items.map((o) => (
                  <tr key={o.number} className={`hover:bg-[#fcfbf7] transition-colors ${dark ? 'hover:bg-[#222]/40' : ''}`}>
                    <td className="py-3 px-4"><div className={`font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>{o.number}</div><div className={`text-[#718078] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : ''}`}>{o.itemCount} item(s)</div></td>
                    <td className="py-3 px-3"><div className={`text-[#173d32] transition-colors duration-300 ${dark ? 'text-white' : ''}`}>{o.customerName || o.shipFullName || '—'}</div><div className={`text-[#718078] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : ''}`}>{o.customerEmail || o.contactEmail || ''}</div></td>
                    <td className="py-3 px-3"><Badge tone={o.paymentMethod === 'cod' ? 'info' : 'neutral'}>{o.paymentMethod === 'cod' ? 'COD' : 'Online'}</Badge>{o.paidAt ? <span className="ml-1"><Badge tone="success">Paid</Badge></span> : (o.paymentMethod === 'cod' && o.status !== 'cancelled' ? <span className="ml-1"><Badge tone="warn">Unpaid</Badge></span> : null)}</td>
                    <td className="py-3 px-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3 px-3 font-semibold">{formatMoney(o.total, o.currency)}</td>
                    <td className="py-3 px-3 text-[#718078]">{formatDate(o.createdAt)}</td>
                    <td className="py-3 px-4 text-right"><button type="button" onClick={() => openDetail(o.number)} className="p-1.5 rounded-lg border border-[#e2e7df] text-[#718078] hover:text-[#173d32] hover:bg-[#e8f0e5] cursor-pointer" title="View details"><Eye size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl bg-white rounded-2xl border shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-[#173d32]">Order {selected}</h2><p className="text-xs text-[#718078]">Manage status, COD collection, and fulfillment.</p></div>
              <button type="button" onClick={() => { setSelected(null); setDetail(null) }} className="p-1 text-[#718078] hover:text-[#173d32] cursor-pointer"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailLoading || !detail ? <LoadingState label="Loading order details…" /> : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl border bg-[#fbfaf6]"><div className="text-[#718078]">Status</div><div className="mt-1"><StatusBadge status={detail.status} /></div></div>
                    <div className="p-3 rounded-xl border bg-[#fbfaf6]"><div className="text-[#718078]">Payment</div><div className="mt-1 font-semibold">{detail.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} {detail.paidAt ? '(Paid)' : '(Unpaid)'}</div></div>
                    <div className="p-3 rounded-xl border bg-[#fbfaf6]"><div className="text-[#718078]">Total</div><div className="mt-1 font-semibold">{formatMoney(detail.total, detail.currency)}</div></div>
                    <div className="p-3 rounded-xl border bg-[#fbfaf6]"><div className="text-[#718078]">Placed</div><div className="mt-1 font-semibold">{formatDate(detail.createdAt)}</div></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-xl p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32] mb-2">Items</h3>
                      <ul className="space-y-2 text-xs">{(detail.items || []).map((i) => <li key={i.id || i.sku} className="flex justify-between gap-2"><span><span className="font-semibold text-[#173d32]">{i.name}</span> <span className="text-[#718078]">({i.sku}) × {i.quantity}</span></span><span>{formatMoney(i.lineTotal, detail.currency)}</span></li>)}</ul>
                      <div className="mt-3 pt-2 border-t text-xs space-y-1"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(detail.subtotal, detail.currency)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{formatMoney(detail.shippingFee, detail.currency)}</span></div><div className="flex justify-between font-semibold text-[#173d32]"><span>Total</span><span>{formatMoney(detail.total, detail.currency)}</span></div></div>
                    </div>
                    <div className="border rounded-xl p-4 text-xs space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32]">Customer & shipping</h3>
                      <p><strong>Customer:</strong> {detail.customerName || detail.shipFullName} ({detail.customerEmail || detail.contactEmail})</p>
                      <p><strong>Ship to:</strong> {detail.shipFullName}, {detail.shipPhone}<br />{detail.shipLine1}{detail.shipLine2 ? ', ' + detail.shipLine2 : ''}<br />{detail.shipCity}, {detail.shipState} {detail.shipPincode}</p>
                      {detail.notes ? <p><strong>Notes:</strong> {detail.notes}</p> : null}
                      {detail.trackingNote ? <p><strong>Tracking:</strong> {detail.trackingNote}</p> : null}
                    </div>
                  </div>

                  <div className="border rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32]">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {canCollectCod && <button type="button" disabled={busy} onClick={() => setAction({ type: 'collect', note: 'Cash collected on delivery' })} className={`px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#15803d] text-white hover:bg-[#166534]'}`}>Mark COD as collected</button>}
                      {canCancel && <button type="button" disabled={busy} onClick={() => setAction({ type: 'cancel', note: '' })} className="px-3 py-2 rounded-xl bg-[#dc2626] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer">Cancel order (restock)</button>}
                      {!canCollectCod && !canCancel && <p className="text-xs text-[#718078]">No collection/cancellation actions available for this state.</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <label className="text-xs"><span className="font-semibold text-[#20342d]">Update status</span>
                        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border bg-white">
                          <option value="">Select allowed status</option>
                          {transitions.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
                        </select>
                      </label>
                      <label className="text-xs"><span className="font-semibold text-[#20342d]">Tracking / note</span>
                        <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking note (optional)" className="mt-1 w-full px-3 py-2 rounded-xl border" />
                      </label>
                      <label className="text-xs"><span className="font-semibold text-[#20342d]">Status note</span>
                        <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional note" className="mt-1 w-full px-3 py-2 rounded-xl border" />
                      </label>
                    </div>
                    <button type="button" disabled={busy || !newStatus} onClick={applyStatus} className={`px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all duration-300 ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#173d32] text-white hover:bg-[#11241e]'}`}>Apply status update</button>
                    <p className="text-[11px] text-[#718078]">Status transitions are validated on the server. COD orders are not marked paid until payment is collected. Online payment capture requires verified provider confirmation (not available without credentials).</p>
                  </div>

                  <div className="border rounded-xl p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32] mb-2">Timeline</h3>
                    {(detail.events || []).length ? <ul className="space-y-1.5 text-xs">{detail.events.map((e, i) => <li key={i} className="flex justify-between gap-3"><span><StatusBadge status={e.status} /> {e.note ? <span className="text-[#718078] ml-1">— {e.note}</span> : null}</span><span className="text-[#718078] whitespace-nowrap">{formatDate(e.createdAt)}</span></li>)}</ul> : <p className="text-xs text-[#718078]">No events.</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(action)}
        title={action?.type === 'collect' ? 'Collect COD payment' : 'Cancel order'}
        message={action?.type === 'collect' ? 'Mark this Cash on Delivery payment as collected? This records actual collection and must not be done before payment is received.' : 'Cancel this order and restore reserved stock where applicable? This action cannot be undone.'}
        confirmLabel={action?.type === 'collect' ? 'Mark collected' : 'Cancel order'}
        isDanger={action?.type === 'cancel'}
        isLoading={busy}
        onConfirm={confirmAction}
        onCancel={() => setAction(null)}
      />
    </div>
  )
}
