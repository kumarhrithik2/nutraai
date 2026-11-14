import { ClipboardList, Leaf, UserRound, Sparkles, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: UserRound,
    number: '01',
    title: 'Create your profile',
    description: 'Account services will help you securely manage your details and preferences.',
  },
  {
    icon: ClipboardList,
    number: '02',
    title: 'Complete your assessment',
    description: 'A connected assessment service can collect your responses with clear consent.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Explore your recommendations',
    description: 'Verified reports and recommendations will appear when services are available.',
  },
  {
    icon: TrendingUp,
    number: '04',
    title: 'Track your progress',
    description: 'Connected tracking tools can help you review your wellness journey over time.',
  },
]

function HowItWorks() {
  return (
    <section className="section how-section" id="how-it-works">
      <div className="section-heading section-heading--center">
        <span className="eyebrow">A thoughtful process</span>
        <h2>Wellness that starts <em>with you.</em></h2>
        <p>A considered experience for everyday wellness. Account and wellness services are still being connected.</p>
      </div>
      <div className="journey-story">
        <div className="journey-visual" data-active="1" aria-hidden="true">
          <div className="journey-visual__surface">
            <span className="journey-visual__eyebrow">THE WELLNESS JOURNEY</span>
            <div className="journey-visual__constellation">
              <svg viewBox="0 0 360 360" focusable="false">
                <path className="journey-visual__path journey-visual__path--base" d="M92 88C215 63 282 133 267 216C253 291 139 304 91 239C48 181 82 133 176 174C231 199 269 263 290 293" />
                <path className="journey-visual__path journey-visual__path--draw" d="M92 88C215 63 282 133 267 216C253 291 139 304 91 239C48 181 82 133 176 174C231 199 269 263 290 293" />
              </svg>
              <span className="journey-visual__center"><Leaf size={31} strokeWidth={1.2} /></span>
              {steps.map(({ number, icon: Icon }) => (
                <span className="journey-visual__node" data-stage={number} key={number}>
                  <Icon size={16} strokeWidth={1.7} />
                </span>
              ))}
              <span className="journey-visual__annotation journey-visual__annotation--one">YOUR GOALS</span>
              <span className="journey-visual__annotation journey-visual__annotation--two">YOUR PACE</span>
            </div>
            <p>Four thoughtful steps.<br /><em>One journey that is yours.</em></p>
            <span className="journey-visual__caption">ILLUSTRATIVE CUSTOMER JOURNEY</span>
          </div>
        </div>
        <div className="journey-story__steps">
          {steps.map(({ icon: Icon, number, title, description }, index) => (
            <article className="journey-story__step" key={number} data-active={index === 0 ? 'true' : 'false'}>
              <div className="journey-story__step-index">{number}<span /></div>
              <div className="journey-story__step-content">
                <span className="journey-story__step-icon"><Icon size={19} strokeWidth={1.6} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
