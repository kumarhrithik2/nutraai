import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarClock, Check, Crown, History, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react'
import IntegrationState from '../common/IntegrationState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getBillingHistory, getErrorMessage, getMembership, selectMembershipPlan } from '../../services/apiBackend/index.js'
import { formatMembershipPrice, membershipPlans } from '../../services/membershipPlans.js'

const SUPPORTED_PLAN_IDS = new Set(['free', 'monthly', 'yearly'])

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(value) {
  if (value == null || value === '') return null
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(num)) return String(value)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num)
}

function titleCase(value) {
  if (!value) return '—'
  return String(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function SubscriptionDashboard() {
  const { isPreviewMode } = useAuth()
  const [membership, setMembership] = useState(null)
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(!isPreviewMode)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busyPlan, setBusyPlan] = useState('')

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    Promise.allSettled([getMembership(), getBillingHistory({ page: 1, pageSize: 20 })])
      .then(([membershipResult, billingResult]) => {
        if (!active) return
        if (membershipResult.status === 'fulfilled') {
          setMembership(membershipResult.value && typeof membershipResult.value === 'object' ? membershipResult.value : null)
        } else {
          setMembership(null)
          setError(getErrorMessage(membershipResult.reason, 'Could not load your membership details.'))
        }
        if (billingResult.status === 'fulfilled') {
          setBilling(billingResult.value && typeof billingResult.value === 'object' ? billingResult.value : null)
        } else {
          setBilling(null)
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  const availablePlans = useMemo(() => membershipPlans.filter((plan) => SUPPORTED_PLAN_IDS.has(plan.id)), [])
  const currentPlanId = membership?.plan && SUPPORTED_PLAN_IDS.has(membership.plan) ? membership.plan : ''
  const currentPlan = availablePlans.find((plan) => plan.id === currentPlanId) || null
  const historyResults = Array.isArray(billing?.results) ? billing.results : []

  async function onSelectPlan(planId) {
    if (isPreviewMode || !planId || busyPlan) return
    setStatus('')
    if (planId === currentPlanId) {
      setStatus('This is your current membership plan.')
      return
    }
    if (planId === 'monthly' || planId === 'yearly') {
      setStatus('Paid membership activation requires configured payment credentials. Your membership was not changed.')
      return
    }
    setBusyPlan(planId)
    try {
      const updated = await selectMembershipPlan(planId)
      setMembership(updated && typeof updated === 'object' ? updated : membership)
      setStatus('Membership plan updated.')
    } catch (e) {
      setStatus(getErrorMessage(e, 'Could not update your membership plan.'))
    } finally {
      setBusyPlan('')
    }
  }

  if (isPreviewMode) {
    return (
      <>
        <header className="dashboard-page-title">
          <div><span className="eyebrow">Your account</span><h1>Memberships</h1><p>View your membership plan, benefits, and history.</p></div>
        </header>
        <IntegrationState title="Preview mode" description="Sign in to view and manage your membership." />
      </>
    )
  }

  if (loading) {
    return (
      <>
        <header className="dashboard-page-title">
          <div><span className="eyebrow">Your account</span><h1>Memberships</h1><p>View your membership plan, benefits, and history.</p></div>
        </header>
        <IntegrationState state="loading" title="Loading membership" description="Fetching your membership details." />
      </>
    )
  }

  const showEmpty = !membership
  const currentStatus = membership?.status || 'active'
  const renewedLabel = formatDate(membership?.renewedAt)

  return (
    <div className="membership-page">
      <header className="dashboard-page-title">
        <div>
          <span className="eyebrow">Your account</span>
          <h1>Memberships</h1>
          <p>Premium wellness membership plans, benefits, and your current plan details.</p>
        </div>
      </header>

      {error ? <section className="dashboard-panel membership-inline-alert" role="alert"><p>{error}</p></section> : null}

      {showEmpty ? (
        <section className="membership-empty-state" aria-label="No membership">
          <span className="membership-empty-state__icon"><Crown size={28} /></span>
          <h2>No membership yet</h2>
          <p>Your membership details are not available right now. When a supported membership is active for your account, it will appear here with its plan, status, and benefits.</p>
          <div className="membership-empty-state__actions">
            {availablePlans.some((p) => p.id === 'free') ? (
              <button className="button button--primary" type="button" onClick={() => onSelectPlan('free')} disabled={Boolean(busyPlan)}>
                {busyPlan === 'free' ? 'Updating…' : 'Choose Free membership'}
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="membership-current-card" aria-label="Current membership">
          <div className="membership-current-card__glow" aria-hidden="true" />
          <div className="membership-current-card__header">
            <div>
              <span className="membership-current-card__eyebrow"><Crown size={14} /> Current membership</span>
              <h2>{currentPlan?.name || titleCase(currentPlanId || membership.plan)} plan</h2>
              <p>{currentPlan ? `${formatMembershipPrice(currentPlan.price)} ${currentPlan.billingLabel}` : 'Plan details from your account'}</p>
            </div>
            <div className="membership-current-card__badges">
              <span className={`membership-status-badge is-${String(currentStatus).toLowerCase()}`}>{titleCase(currentStatus)}</span>
              {currentPlanId ? <span className="membership-status-badge is-plan"><BadgeCheck size={14} /> Active plan</span> : null}
            </div>
          </div>
          <dl className="membership-current-card__meta">
            <div><dt>Plan name</dt><dd>{currentPlan?.name || titleCase(membership.plan)}</dd></div>
            <div><dt>Price</dt><dd>{currentPlan ? `${formatMembershipPrice(currentPlan.price)} ${currentPlan.billingLabel}` : '—'}</dd></div>
            <div><dt>Status</dt><dd>{titleCase(currentStatus)}</dd></div>
            <div><dt>Validity</dt><dd>{renewedLabel ? `Renews/valid until ${renewedLabel}` : (currentPlanId === 'free' ? 'No renewal date' : 'Not available')}</dd></div>
          </dl>
          <div className="membership-current-card__benefits">
            <h3>Membership benefits</h3>
            <ul>
              {(currentPlan?.featureLabels || []).map((benefit) => (
                <li key={benefit}><Check size={15} /> {benefit}</li>
              ))}
              {!currentPlan?.featureLabels?.length ? <li><Check size={15} /> Benefits are not available for this membership record.</li> : null}
            </ul>
          </div>
        </section>
      )}

      <section className="membership-plans-section" aria-label="Available membership plans">
        <div className="membership-section-heading">
          <span className="eyebrow">Plans</span>
          <h2>Available membership plans</h2>
          <p>Only plans supported by your NutraAI account are shown here.</p>
        </div>
        <div className="membership-plan-grid">
          {availablePlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            const isPaid = plan.id === 'monthly' || plan.id === 'yearly'
            const isBusy = busyPlan === plan.id
            return (
              <article key={plan.id} className={`membership-plan-card${plan.id === 'yearly' ? ' is-featured' : ''}${isCurrent ? ' is-current' : ''}`}>
                {plan.id === 'yearly' ? <span className="membership-plan-card__badge">Best value</span> : null}
                {isCurrent ? <span className="membership-plan-card__badge membership-plan-card__badge--current"><Sparkles size={13} /> Current</span> : null}
                <div className="membership-plan-card__top">
                  <h3>{plan.name}</h3>
                  <p className="membership-plan-card__price"><strong>{formatMembershipPrice(plan.price)}</strong><span>{plan.billingLabel}</span></p>
                </div>
                <ul className="membership-plan-card__benefits">
                  {plan.featureLabels.map((benefit) => <li key={benefit}><Check size={14} /> <span>{benefit}</span></li>)}
                </ul>
                <div className="membership-plan-card__actions">
                  {isCurrent ? (
                    <button className="button button--outline" type="button" disabled>Current plan</button>
                  ) : isPaid ? (
                    <div className="membership-plan-card__note-wrap">
                      <button className="button button--outline" type="button" disabled>Upgrade unavailable</button>
                      <small>Paid activation requires configured payment credentials.</small>
                    </div>
                  ) : (
                    <button className="button button--primary" type="button" onClick={() => onSelectPlan(plan.id)} disabled={Boolean(busyPlan)}>
                      {isBusy ? 'Updating…' : (currentPlanId && currentPlanId !== 'free' ? 'Switch to Free' : 'Select Free plan')}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {status ? <p className="form-status membership-status-message" role="status">{status}</p> : null}

      <section className="membership-history-section" aria-label="Membership history and payment status">
        <div className="membership-section-heading">
          <span className="eyebrow"><History size={13} /> Records</span>
          <h2>Membership history &amp; payment status</h2>
          <p>Real account records are shown below when available.</p>
        </div>
        {historyResults.length ? (
          <div className="membership-history-list">
            {historyResults.map((record, index) => {
              const amount = formatMoney(record.amount ?? record.total ?? record.price)
              const paymentStatus = record.payment_status || record.paymentStatus || record.status
              const when = formatDate(record.created_at || record.createdAt || record.date || record.renewed_at || record.renewedAt)
              return (
                <article key={record.id || `${index}-${record.description || 'record'}`} className="membership-history-card">
                  <div className="membership-history-card__icon"><ReceiptText size={18} /></div>
                  <div className="membership-history-card__body">
                    <div className="membership-history-card__head">
                      <h3>{record.description || record.title || record.plan ? `${titleCase(record.plan || 'Membership')} record` : 'Membership record'}</h3>
                      {paymentStatus ? <span className={`membership-payment-badge is-${String(paymentStatus).toLowerCase().replace(/[^a-z0-9_-]/g, '')}`}>{titleCase(paymentStatus)}</span> : null}
                    </div>
                    <dl className="membership-history-card__meta">
                      {record.plan ? <div><dt>Plan</dt><dd>{titleCase(record.plan)}</dd></div> : null}
                      {amount ? <div><dt>Amount</dt><dd>{amount}</dd></div> : null}
                      {when ? <div><dt>Date</dt><dd><CalendarClock size={13} /> {when}</dd></div> : null}
                    </dl>
                    {record.note || record.message ? <p className="membership-history-card__note">{record.note || record.message}</p> : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="membership-history-empty">
            <span><ShieldCheck size={18} /></span>
            <p>No membership payment or history records are available for this account.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default SubscriptionDashboard
