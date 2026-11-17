import { ArrowRight, Check } from 'lucide-react'
import { formatMembershipPrice, membershipPlans } from '../../services/membershipPlans.js'

const comparisonFeatures = [
  ['Account and profile', 'account'],
  ['Basic health assessment', 'assessment'],
  ['Basic wellness dashboard', 'basicDashboard'],
  ['Educational wellness information', 'educationalContent'],
  ['Limited / premium AI assistant', 'aiAssistant'],
  ['Wellness tracking', 'wellnessTracking'],
  ['Marketplace and individual purchases', 'marketplace'],
  ['Personalized wellness plan', 'personalizedPlan'],
  ['Enhanced dashboard and recommendations', 'enhancedDashboard'],
  ['Wellness reminders and progress tracking', 'progressTracking'],
  ['Monthly AI wellness review', 'monthlyReview'],
  ['Nutrition guidance and extended reviews', 'nutritionGuidance'],
  ['Supplement subscriptions and eligible discounts', 'supplementManagement'],
  ['Analytics, consultation benefits and priority support', 'analytics'],
]

function Membership({ onSelectPlan, selectedPlan = '', compact = false, showComparison = !compact }) {
  const featuresFor = (plan) => compact && plan.id !== 'free'
    ? [...plan.featureLabels.slice(0, 5), 'All paid benefits shown below']
    : plan.featureLabels

  return (
    <section className={`section membership-section${compact ? ' membership-section--compact' : ''}`} id="membership">
      {!compact && <div className="section-heading section-heading--center">
        <span className="eyebrow">Membership</span>
        <h2>Wellness support, <em>at your pace.</em></h2>
        <p>Three clear options with the approved benefits and pricing.</p>
      </div>}
      <p className="membership-pricing-note">Paid plan activation requires configured payment credentials. Free plan changes can be saved to your account when signed in.</p>
      <div className="membership-grid">
        {membershipPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          return (
            <article className={`membership-card${plan.id === 'yearly' ? ' membership-card--featured' : ''}`} key={plan.id}>
              {plan.id === 'yearly' && <span className="plan-badge">YEARLY</span>}
              <div className="plan-heading">
                <span className="plan-name">{plan.name}</span>
                <span className="plan-price"><strong>{formatMembershipPrice(plan.price)}</strong><span>{plan.billingLabel}</span></span>
              </div>
              <p className="plan-description">{plan.id === 'free'
                ? 'A permanent foundation for your wellness journey.'
                : 'The complete paid feature set, with billing frequency as the only difference.'}</p>
              <div className="plan-rule" />
              <span className="plan-includes">Included benefits</span>
              <ul>{featuresFor(plan).map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
              <button
                className={`button ${plan.id === 'yearly' ? 'button--primary' : 'button--outline'} plan-button`}
                type="button"
                onClick={() => onSelectPlan?.(plan.id)}
                aria-pressed={onSelectPlan ? isSelected : undefined}
                disabled={!onSelectPlan}
              >
                {isSelected ? 'Selected' : onSelectPlan ? 'Compare plan' : 'Unavailable'}
                {!isSelected && <ArrowRight size={14} />}
              </button>
            </article>
          )
        })}
      </div>
      {onSelectPlan && selectedPlan && <p className="form-status" role="status">Selected plan: {selectedPlan}. Paid activation requires configured payment credentials.</p>}
      {showComparison && <div className="membership-comparison-wrap">
        <h3>Compare membership benefits</h3>
        <div className="membership-comparison">
          <div className="membership-comparison__row membership-comparison__head">
            <strong>Benefit</strong>{membershipPlans.map((plan) => <strong key={plan.id}>{plan.name}</strong>)}
          </div>
          {comparisonFeatures.map(([label, feature]) => <div className="membership-comparison__row" key={feature}>
            <span>{label}</span>
            {membershipPlans.map((plan) => {
              const included = Boolean(plan.features[feature])
              return <span role="img" aria-label={`${plan.name}: ${included ? 'included' : 'not included'}`} key={plan.id}>{included ? <Check size={15} /> : '—'}</span>
            })}
          </div>)}
        </div>
      </div>}
      {!compact && <section className="membership-faq">
        <h3>Membership questions</h3>
        <details><summary>Is Free Membership permanent?</summary><p>Free membership is listed at ₹0. Access and account features depend on connected services.</p></details>
        <details><summary>When does paid membership renew?</summary><p>Monthly and yearly billing terms will be provided before any membership change is confirmed.</p></details>
        <details><summary>Can I cancel without cancelling supplements?</summary><p>Membership and supplement delivery settings will be managed separately when account services are connected.</p></details>
      </section>}
    </section>
  )
}

export default Membership
