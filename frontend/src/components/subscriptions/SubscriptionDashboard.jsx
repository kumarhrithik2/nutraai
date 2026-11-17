import { useEffect, useState } from 'react'
import { CreditCard, Package, ReceiptText } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Membership from '../home/Membership.jsx'
import IntegrationState from '../common/IntegrationState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getBillingHistory, getErrorMessage, getMembership, listSupplementSubscriptions, selectMembershipPlan } from '../../services/apiBackend/index.js'

const subscriptionPages = [
  { path: '/dashboard/subscriptions', label: 'Overview', end: true },
  { path: '/dashboard/subscriptions/membership', label: 'Membership' },
  { path: '/dashboard/subscriptions/supplements', label: 'Supplement deliveries' },
  { path: '/dashboard/subscriptions/billing', label: 'Billing history' },
]

function SubscriptionDashboard() {
  const { pathname } = useLocation()
  const { isPreviewMode } = useAuth()
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(!isPreviewMode)
  const [status, setStatus] = useState('')
  const [supplements, setSupplements] = useState([])
  const [billing, setBilling] = useState(null)
  const isMembership = pathname.endsWith('/membership')
  const isSupplements = pathname.endsWith('/supplements')
  const isBilling = pathname.endsWith('/billing')

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    Promise.allSettled([getMembership(), listSupplementSubscriptions(), getBillingHistory({ page: 1, pageSize: 20 })])
      .then(([m, s, b]) => {
        if (!active) return
        if (m.status === 'fulfilled') setMembership(m.value)
        if (s.status === 'fulfilled') setSupplements(s.value || [])
        if (b.status === 'fulfilled') setBilling(b.value)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  async function onSelectPlan(planId) {
    if (isPreviewMode) { setStatus('Plan changes are not available in preview mode.'); return }
    if (planId === 'monthly' || planId === 'yearly') {
      setStatus('Paid plan activation requires payment credentials that are not configured. Your membership plan was not changed.')
      return
    }
    setStatus('')
    try {
      const updated = await selectMembershipPlan(planId)
      setMembership(updated)
      setStatus('Membership plan updated.')
    } catch (e) {
      setStatus(getErrorMessage(e, 'Could not update membership plan.'))
    }
  }

  const selectedPlan = membership?.plan || ''

  return (
    <>
      <header className="dashboard-page-title">
        <div><span className="eyebrow">Your account</span><h1>Subscriptions</h1><p>Manage your membership and supplement deliveries.</p></div>
      </header>
      <nav className="subscription-tabs" aria-label="Subscription settings">
        {subscriptionPages.map(({ path, label, end }) => (
          <NavLink key={path} to={path} end={end} className={({ isActive }) => isActive ? 'is-active' : ''}>{label}</NavLink>
        ))}
      </nav>

      {isMembership && (isPreviewMode ? <IntegrationState title="Preview mode" description="Sign in to manage your membership." /> : loading ? <IntegrationState state="loading" title="Loading membership" description="Fetching membership details." /> : <>
        {membership && <section className="dashboard-panel"><h2>Current membership</h2><p><strong>Plan:</strong> {membership.plan} - <strong>Status:</strong> {membership.status}{membership.renewedAt ? (' - Renews/ends: ' + new Date(membership.renewedAt).toLocaleDateString()) : ''}</p></section>}
        <Membership selectedPlan={selectedPlan} onSelectPlan={onSelectPlan} />
        {status && <p className="form-status" role="status">{status}</p>}
      </>)}

      {isSupplements && (isPreviewMode ? <IntegrationState icon={Package} title="Preview mode" description="Sign in to view supplement subscriptions." /> : loading ? <IntegrationState state="loading" title="Loading" description="Fetching supplement subscriptions." /> : supplements.length ? <section className="dashboard-panel"><ul className="settings-list">{supplements.map((s) => <li key={s.id}><strong>{s.name || s.product_name || 'Subscription'}</strong> - {s.status || 'active'}</li>)}</ul></section> : <IntegrationState icon={Package} title="No supplement subscriptions" description="Supplement delivery subscriptions are not configured for your account." />)}

      {isBilling && (isPreviewMode ? <IntegrationState icon={ReceiptText} title="Preview mode" description="Sign in to view billing history." /> : loading ? <IntegrationState state="loading" title="Loading" description="Fetching billing history." /> : billing?.results?.length ? <section className="dashboard-panel"><ul className="settings-list">{billing.results.map((b, i) => <li key={b.id || i}>{b.description || 'Charge'} - {b.amount ?? ''} ({b.status || ''})</li>)}</ul></section> : <IntegrationState icon={ReceiptText} title="No billing history" description="No invoices or charges are recorded for this account." />)}

      {!isMembership && !isSupplements && !isBilling && (
        <>
          {isPreviewMode ? <IntegrationState icon={CreditCard} title="Preview mode" description="Sign in to view subscription details." /> : loading ? <IntegrationState state="loading" title="Loading" description="Fetching subscription details." /> : <section className="dashboard-panel"><h2>Membership</h2><p><strong>Plan:</strong> {membership?.plan || 'free'} - <strong>Status:</strong> {membership?.status || 'active'}</p></section>}
          <div className="subscription-shortcuts">
            <Link to="/dashboard/subscriptions/membership"><span><strong>Membership</strong><small>Plans, benefits, and membership management</small></span><CreditCard size={17} /></Link>
            <Link to="/dashboard/subscriptions/supplements"><span><strong>Supplement deliveries</strong><small>Manage delivery subscriptions</small></span><Package size={17} /></Link>
            <Link to="/dashboard/subscriptions/billing"><span><strong>Billing history</strong><small>Review billing records</small></span><ReceiptText size={17} /></Link>
          </div>
        </>
      )}
    </>
  )
}

export default SubscriptionDashboard
