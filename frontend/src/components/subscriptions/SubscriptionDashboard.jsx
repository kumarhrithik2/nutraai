import { CreditCard, Package, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Membership from '../home/Membership.jsx'
import IntegrationState from '../common/IntegrationState.jsx'

const subscriptionPages = [
  { path: '/dashboard/subscriptions', label: 'Overview', end: true },
  { path: '/dashboard/subscriptions/membership', label: 'Membership' },
  { path: '/dashboard/subscriptions/supplements', label: 'Supplement deliveries' },
  { path: '/dashboard/subscriptions/billing', label: 'Billing history' },
]

function SubscriptionDashboard() {
  const { pathname } = useLocation()
  const [selectedPlan, setSelectedPlan] = useState('')
  const isMembership = pathname.endsWith('/membership')
  const isSupplements = pathname.endsWith('/supplements')
  const isBilling = pathname.endsWith('/billing')

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
      {isMembership ? <Membership selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} /> : null}
      {isSupplements && <IntegrationState icon={Package} title="Supplement subscriptions unavailable" description="No delivery schedule or supplement subscription data is loaded. Changes will be available when subscription services are connected." />}
      {isBilling && <IntegrationState icon={ReceiptText} title="Billing history unavailable" description="No invoices, charges, or payment methods are loaded or simulated." />}
      {!isMembership && !isSupplements && !isBilling && (
        <>
          <IntegrationState icon={CreditCard} title="Subscription details unavailable" description="Your current membership status, renewal date, and payment details will appear here after the account service is connected." />
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
