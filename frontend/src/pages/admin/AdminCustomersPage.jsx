import { useEffect, useState } from 'react'
import { Eye, RefreshCw, Search, Shield, UserCheck, UserX, X } from 'lucide-react'
import { adminGetCustomer, adminListCustomers, adminUpdateCustomerStatus, getErrorMessage } from '../../services/apiBackend/index.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import { formatDate, formatMoney } from './adminFormatters.js'
import { AdminPageHeader, Badge, EmptyState, ErrorState, LoadingState, Pagination, StatusBadge } from './AdminUi.jsx'

export default function AdminCustomersPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t) }, [toast])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const d = await adminListCustomers({ q: search, isActive: activeFilter || undefined, page, pageSize: 15 })
        if (active) { setItems(d.results); setTotalPages(d.totalPages); setError('') }
      } catch (e) {
        if (active) setError(getErrorMessage(e, 'Failed to load customers.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [search, activeFilter, page, reload])

  async function openDetail(id) {
    setSelectedId(id); setDetail(null); setDetailLoading(true)
    try { setDetail(await adminGetCustomer(id)) }
    catch (e) { setToast(getErrorMessage(e, 'Could not load customer details.')); setSelectedId(null) }
    finally { setDetailLoading(false) }
  }

  async function toggleStatus() {
    if (!confirm || !detail) return
    setBusy(true)
    try {
      const updated = await adminUpdateCustomerStatus(detail.id, confirm.nextActive)
      setDetail(updated)
      setToast(confirm.nextActive ? 'Customer account activated.' : 'Customer account deactivated.')
      setReload((v) => v + 1)
      setConfirm(null)
    } catch (e) { setToast(getErrorMessage(e, 'Could not update account status.')) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border bg-[#173d32] text-white border-[#275c4d] text-xs font-semibold" role="status">{toast}</div>}
      <AdminPageHeader eyebrow="Customers" title="Customer Accounts" description="View customer profiles, assessment and order history, membership details, and manage account status."
        actions={<button type="button" onClick={() => setReload((v) => v + 1)} className="p-2.5 rounded-xl border border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] cursor-pointer"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>} />
      {error && <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />}

      <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718078]" /><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearch(q.trim()) } }} placeholder="Search name, email, phone…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#d6ded5] text-xs" /></div>
          <select value={activeFilter} onChange={(e) => { setPage(1); setActiveFilter(e.target.value) }} className="px-3 py-2 rounded-xl border border-[#d6ded5] text-xs bg-white"><option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option></select>
        </div>
        <div className="mt-3"><button type="button" onClick={() => { setPage(1); setSearch(q.trim()) }} className="px-3 py-2 rounded-xl bg-[#173d32] text-white text-xs font-semibold cursor-pointer">Search</button></div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5eae3] shadow-xs overflow-hidden">
        {loading ? <LoadingState label="Loading customers…" /> : items.length === 0 ? <EmptyState title="No customers found" description="Registered customer accounts will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#718078] border-b border-[#e5eae3] bg-[#fbfaf6] uppercase text-[10px] tracking-wider"><th className="py-3 px-4">Customer</th><th className="py-3 px-3">Membership</th><th className="py-3 px-3">Orders</th><th className="py-3 px-3">Total spent</th><th className="py-3 px-3">Status</th><th className="py-3 px-3">Joined</th><th className="py-3 px-4 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#f0f3ef]">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fcfbf7]">
                    <td className="py-3 px-4"><div className="font-semibold text-[#173d32]">{c.name || c.email}</div><div className="text-[#718078]">{c.email}{c.phone ? ' - ' + c.phone : ''}</div></td>
                    <td className="py-3 px-3">{c.membership ? <><Badge tone={c.membership.plan === 'free' ? 'neutral' : 'success'}>{c.membership.plan}</Badge> <span className="text-[#718078]">({c.membership.status})</span></> : <span className="text-[#718078]">-</span>}</td>
                    <td className="py-3 px-3">{c.orderCount}</td>
                    <td className="py-3 px-3 font-semibold text-[#173d32]">{formatMoney(c.totalSpent)}</td>
                    <td className="py-3 px-3">{c.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}</td>
                    <td className="py-3 px-3 text-[#718078]">{formatDate(c.dateJoined)}</td>
                    <td className="py-3 px-4 text-right"><button type="button" onClick={() => openDetail(c.id)} className="p-1.5 rounded-lg border border-[#e2e7df] text-[#718078] hover:text-[#173d32] hover:bg-[#e8f0e5] cursor-pointer" title="View customer"><Eye size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-[#e5eae3] shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#e5eae3] flex items-center justify-between bg-[#fbfaf6]">
              <div><h2 className="text-lg font-bold text-[#173d32]">Customer details</h2><p className="text-xs text-[#718078]">Profile, orders, assessments, and membership.</p></div>
              <button type="button" onClick={() => { setSelectedId(null); setDetail(null) }} className="p-1 text-[#718078] hover:text-[#173d32] cursor-pointer"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailLoading || !detail ? <LoadingState label="Loading customer…" /> : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs space-y-1">
                      <div className="text-sm font-bold text-[#173d32]">{detail.name || detail.email}</div>
                      <div className="text-[#718078]">{detail.email}{detail.phone ? ' - ' + detail.phone : ''}</div>
                      <div>Account: {detail.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>} - Joined {formatDate(detail.dateJoined)} - Last login {formatDate(detail.lastLogin)}</div>
                    </div>
                    <div>
                      <button type="button" onClick={() => setConfirm({ nextActive: !detail.isActive })} className={ 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer ' + (detail.isActive ? 'bg-[#dc2626] hover:bg-[#b91c1c]' : 'bg-[#15803d] hover:bg-[#166534]') }>
                        {detail.isActive ? <><UserX size={14} /> Deactivate account</> : <><UserCheck size={14} /> Activate account</>}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="border border-[#e5eae3] rounded-xl p-4">
                      <h3 className="font-bold uppercase tracking-wider text-[#173d32] mb-2">Profile & membership</h3>
                      {detail.profile ? <div className="space-y-1"><p><strong>Name:</strong> {detail.profile.full_name || '-'}</p><p><strong>Phone:</strong> {detail.profile.phone || '-'}</p><p><strong>DOB:</strong> {detail.profile.date_of_birth || '-'}</p><p><strong>Gender:</strong> {detail.profile.gender || '-'}</p></div> : <p className="text-[#718078]">No profile details.</p>}
                      <div className="mt-3 pt-2 border-t border-[#e5eae3]">
                        <p><strong>Membership:</strong> {detail.membership ? (detail.membership.plan + ' (' + detail.membership.status + ')') : '-'}</p>
                        {detail.membership?.renewedAt ? <p><strong>Renews/ends:</strong> {formatDate(detail.membership.renewedAt)}</p> : null}
                        <p><strong>Orders:</strong> {detail.orderCount} - <strong>Total spent:</strong> {formatMoney(detail.totalSpent)}</p>
                      </div>
                    </div>
                    <div className="border border-[#e5eae3] rounded-xl p-4">
                      <h3 className="font-bold uppercase tracking-wider text-[#173d32] mb-2">Assessment history</h3>
                      {detail.assessments?.length ? <ul className="space-y-1.5 max-h-56 overflow-auto">{detail.assessments.map((a) => <li key={a.id} className="flex justify-between gap-2"><span>#{a.id}  -  BMI {a.bmi ?? '-'}  -  Age band {a.age_band || '-'}</span><span className="text-[#718078]">{formatDate(a.created_at)}</span></li>)}</ul> : <p className="text-[#718078]">No assessments submitted.</p>}
                    </div>
                  </div>

                  <div className="border border-[#e5eae3] rounded-xl p-4">
                    <h3 className="font-bold uppercase tracking-wider text-[#173d32] mb-2">Order history</h3>
                    {detail.orders?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="text-left text-[#718078] border-b border-[#e5eae3]"><th className="py-2 pr-2">Order</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Payment</th><th className="py-2 pr-2">Total</th><th className="py-2">Date</th></tr></thead>
                          <tbody className="divide-y divide-[#f0f3ef]">{detail.orders.map((o) => <tr key={o.number}><td className="py-2 pr-2 font-semibold text-[#173d32]">{o.number}</td><td className="py-2 pr-2"><StatusBadge status={o.status} /></td><td className="py-2 pr-2">{o.paymentMethod === 'cod' ? 'COD' : 'Online'} {o.paidAt ? '(paid)' : ''}</td><td className="py-2 pr-2">{formatMoney(o.total, o.currency)}</td><td className="py-2 text-[#718078]">{formatDate(o.createdAt)}</td></tr>)}</tbody>
                        </table>
                      </div>
                    ) : <p className="text-[#718078]">No orders.</p>}
                  </div>

                  <p className="text-[11px] text-[#718078]"><Shield size={12} className="inline mr-1" />Account status changes are enforced by backend authentication. Deactivated customers cannot sign in. Admin access is controlled separately.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={Boolean(confirm)} title={confirm?.nextActive ? 'Activate account' : 'Deactivate account'} message={confirm?.nextActive ? 'Allow this customer to sign in and use their account?' : 'Deactivate this customer account? They will be unable to sign in until reactivated.'} confirmLabel={confirm?.nextActive ? 'Activate' : 'Deactivate'} isDanger={!confirm?.nextActive} isLoading={busy} onConfirm={toggleStatus} onCancel={() => setConfirm(null)} />
    </div>
  )
}