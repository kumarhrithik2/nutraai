import { useState } from 'react'
import { Activity, ArrowRight, Bot, FileHeart, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <header className="dashboard-page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  )
}

const workspaceModules = [
  { to: '/dashboard/profile', icon: FileHeart, title: 'Profile', description: 'Manage your account details and preferences.' },
  { to: '/dashboard/assessment', icon: Activity, title: 'Health assessment', description: 'Assessment services are not connected.' },
  { to: '/dashboard/report', icon: FileHeart, title: 'Wellness report', description: 'Reports will appear after a verified assessment.' },
  { to: '/dashboard/recommendations', icon: Sparkles, title: 'Recommendations', description: 'Recommendations require connected account services.' },
  { to: '/dashboard/assistant', icon: Bot, title: 'AI assistant', description: 'Assistant responses are not available yet.' },
  { to: '/dashboard/progress', icon: Activity, title: 'Progress', description: 'Tracking data will appear when available.' },
]

export function DashboardOverview() {
  return (
    <div className="overview-experience">
      <section className="overview-hero">
        <div className="overview-hero__copy">
          <div className="overview-hero__meta"><span><i /> YOUR WELLNESS SPACE</span></div>
          <p className="overview-hero__greeting">A considered moment for yourself</p>
          <h1>Your wellness space<span>.</span></h1>
          <p className="overview-hero__description">Your personal information and wellness services will be available when account services are connected.</p>
          <Link className="overview-hero__button" to="/dashboard/profile">Review profile settings <ArrowRight size={16} /></Link>
        </div>
        <div className="overview-hero__art" aria-hidden="true">
          <div className="hero-art__orbit hero-art__orbit--outer" />
          <div className="hero-art__orbit hero-art__orbit--inner" />
          <div className="hero-art__stem" />
          <span className="hero-art__leaf hero-art__leaf--one"><Activity size={72} strokeWidth={0.75} /></span>
          <div className="hero-art__seed"><span>N</span><small>NUTRAAI · PERSONAL WELLNESS</small></div>
          <span className="hero-art__caption">YOUR DATA, WHEN YOU ARE READY</span>
        </div>
        <div className="overview-hero__foot"><span>PERSONAL, NOT PRESCRIPTIVE</span><span>ACCOUNT SERVICES OFFLINE</span></div>
      </section>

      <section className="overview-section" aria-labelledby="workspace-title">
        <div className="overview-section__heading">
          <div><span className="eyebrow">Your account</span><h2 id="workspace-title">A clear view of your wellness.</h2></div>
        </div>
        <div className="integration-module-grid">
          {workspaceModules.map(({ to, icon: Icon, title, description }) => (
            <Link className="dashboard-panel integration-module" to={to} key={to}>
              <span><Icon size={18} /></span><strong>{title}</strong><p>{description}</p><ArrowRight size={15} />
            </Link>
          ))}
        </div>
      </section>
      <IntegrationState title="Account services are not connected" description="No customer profile, health data, reports, recommendations, orders, or notifications are loaded or created in this workspace." />
    </div>
  )
}

export function WellnessReportPage() {
  return (
    <>
      <PageTitle eyebrow="Your wellness journey" title="Wellness report" description="Reports will be shown here only after an assessment has been submitted and processed." />
      <IntegrationState title="No report available" description="Report services are not connected. No assessment results or recommendations have been generated." />
      <p className="dashboard-disclaimer">Wellness reports are not medical diagnoses or a substitute for professional care.</p>
    </>
  )
}

export function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('Recommended products')
  return (
    <>
      <PageTitle eyebrow="Your wellness" title="Recommendations" description="Personalized recommendations require an account, assessment, and connected recommendation service." />
      <div className="recommendations-tabs" role="tablist" aria-label="Recommendation views">
        {['Recommended products', 'Wellness plan'].map((tab) => (
          <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-selected' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
      <IntegrationState title={activeTab === 'Wellness plan' ? 'No wellness plan available' : 'No recommendations available'} description="No personalized suggestions are generated or displayed until the relevant services are connected." />
    </>
  )
}

export function ProgressPage() {
  const [range, setRange] = useState('30')
  return (
    <>
      <PageTitle eyebrow="Your wellness journey" title="Wellness progress tracking" description="Review wellness measures and check-ins supplied by your account services." />
      <section className="dashboard-panel progress-filter-panel">
        <label htmlFor="progress-range">Time period</label>
        <select id="progress-range" value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </section>
      <IntegrationState title="No progress data available" description="Progress tracking is not connected. No measurements or check-ins are being recorded." />
    </>
  )
}

export function AssistantPage() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('')

  function submitQuestion(event) {
    event.preventDefault()
    if (!question.trim()) {
      setStatus('Enter a question before continuing.')
      return
    }
    setStatus('The assistant service is unavailable. Your question has not been sent.')
  }

  return (
    <>
      <PageTitle eyebrow="Wellness support" title="AI wellness assistant" description="Ask general wellness questions when the assistant service is available." />
      <section className="dashboard-panel assistant-panel">
        <div className="assistant-panel__intro"><span><Bot size={20} /></span><div><h2>Start a conversation</h2><p>No AI model is connected. No response will be generated until the service is available.</p></div></div>
        <form className="assistant-question-form" onSubmit={submitQuestion}>
          <label htmlFor="assistant-question">Your question</label>
          <textarea id="assistant-question" name="question" rows="4" value={question} onChange={(event) => { setQuestion(event.target.value); setStatus('') }} placeholder="Type your question" maxLength={2000} />
          <button className="button button--primary" type="submit">Send message <ArrowRight size={15} /></button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      </section>
      <p className="dashboard-disclaimer">The assistant is not a medical service. For personal health advice, consult a qualified healthcare professional.</p>
    </>
  )
}
