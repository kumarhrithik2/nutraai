import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ArrowRight, FileHeart, ShoppingBag, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'
import useAssistantChat from '../components/assistant/useAssistantChat.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardSummary, getLatestRecommendation, getWellnessPlan, getWellnessReport, getErrorMessage } from '../services/apiBackend/index.js'

const OverviewDnaVisualization = lazy(() => import('../components/overview/OverviewDnaVisualization.jsx'))
const AIChatPanel = lazy(() => import('../components/assistant/AIChatPanel.jsx'))
const RobotCharacter = lazy(() => import('../components/assistant/RobotCharacter.jsx'))

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <header className="dashboard-page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  )
}

function useOverviewHeroVisual() {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return { reduced: false, mobile: false }
    return {
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      mobile: window.matchMedia('(max-width: 767px), (pointer: coarse)').matches,
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)')
    const update = () => setState({ reduced: motion.matches, mobile: mobile.matches })
    update()
    motion.addEventListener('change', update)
    mobile.addEventListener('change', update)
    return () => {
      motion.removeEventListener('change', update)
      mobile.removeEventListener('change', update)
    }
  }, [])

  return state
}

function OverviewHeroVisual() {
  const { reduced, mobile } = useOverviewHeroVisual()
  const show3d = !reduced && !mobile
  return (
    <div className="overview-hero__visual" aria-hidden="true">
      {show3d ? (
        <Suspense fallback={<div className="overview-hero__visual-fallback" />}>
          <OverviewDnaVisualization className="overview-dna-canvas" />
        </Suspense>
      ) : (
        <div className="overview-hero__visual-fallback" />
      )}
    </div>
  )
}

export function DashboardOverview() {
  const { isPreviewMode, user } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getDashboardSummary().then((data) => { if (active) setSummary(data) }).catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load dashboard data.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  if (isPreviewMode) {
    return (
      <div className="overview-experience">
        <section className="overview-hero">
          <div className="overview-hero__copy"><span className="eyebrow">DEVELOPMENT PREVIEW</span><h1>Development Preview – Sample Data</h1><p>Visual-only preview. No customer identity or personal data is loaded; backend actions remain unavailable.</p></div>
          <OverviewHeroVisual />
          <div className="overview-hero__foot"><span>PERSONAL, NOT PRESCRIPTIVE</span><span>ACCOUNT DATA</span></div>
        </section>
        <IntegrationState title="Preview mode" description="Sign in to view real dashboard data from your account." />
      </div>
    )
  }
  if (loading) return <IntegrationState state="loading" title="Loading dashboard" description="Fetching your account summary." />
  if (error) return <section className="dashboard-panel" role="alert"><p>{error}</p></section>

  const latest = summary?.latestAssessment
  const profile = summary?.profile
  return (
    <div className="overview-experience">
      <section className="overview-hero">
        <div className="overview-hero__copy">
          <div className="overview-hero__meta"><span>YOUR WELLNESS SPACE</span></div>
          <p className="overview-hero__greeting">Welcome{user?.name ? (', ' + user.name) : ''}</p>
          <h1>Your wellness space<span>.</span></h1>
          <p className="overview-hero__description">Review your profile, assessments, recommendations, and orders in one place.</p>
          <Link className="overview-hero__button" to="/dashboard/profile">Review profile <ArrowRight size={16} /></Link>
        </div>
        <OverviewHeroVisual />
        <div className="overview-hero__foot"><span>PERSONAL, NOT PRESCRIPTIVE</span><span>ACCOUNT DATA</span></div>
      </section>

      <section className="overview-section" aria-labelledby="workspace-title">
        <div className="overview-section__heading"><div><span className="eyebrow">Your account</span><h2 id="workspace-title">At a glance</h2></div></div>
        <div className="integration-module-grid">
          <Link className="dashboard-panel integration-module" to="/dashboard/profile"><span><FileHeart size={18} /></span><strong>Profile</strong><p>{profile?.name ? ('Profile for ' + profile.name) : 'Complete your profile details.'}</p><ArrowRight size={15} /></Link>
          <Link className="dashboard-panel integration-module" to="/dashboard/assessment"><span><Activity size={18} /></span><strong>Health assessment</strong><p>{latest ? ('Latest assessment: BMI ' + latest.bmi + ', ' + (latest.ageBand || '')) : 'No assessment submitted yet.'}</p><ArrowRight size={15} /></Link>
          <Link className="dashboard-panel integration-module" to="/dashboard/recommendations"><span><Sparkles size={18} /></span><strong>Recommendations</strong><p>View suggestions based on your latest assessment.</p><ArrowRight size={15} /></Link>
          <Link className="dashboard-panel integration-module" to="/dashboard/marketplace"><span><ShoppingBag size={18} /></span><strong>Marketplace</strong><p>Cart items: {summary?.cartItemCount ?? 0}</p><ArrowRight size={15} /></Link>
        </div>
      </section>
      <section className="dashboard-panel">
        <h2>Recent orders</h2>
        {summary?.recentOrders?.length ? (
          <ul className="settings-list">{summary.recentOrders.map((o) => <li key={o.number}><Link to={'/dashboard/orders/' + encodeURIComponent(o.number)}>Order {o.number}</Link> - {o.statusLabel || o.status}</li>)}</ul>
        ) : <p>No recent orders.</p>}
      </section>
      <p className="dashboard-disclaimer">Wellness information is educational and not medical advice.</p>
    </div>
  )
}

function formatDate(value) { if (!value) return 'Unknown date'; try { return new Date(value).toLocaleString() } catch { return String(value) } }

export function WellnessReportPage() {
  const { isPreviewMode } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getWellnessReport().then((d) => { if (active) setReport(d) }).catch((e) => { if (active) setError(getErrorMessage(e, 'No report available yet.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])
  if (isPreviewMode) return <><PageTitle eyebrow="Your wellness journey" title="Wellness report" description="Reports are available after sign-in and assessment." /><IntegrationState title="Preview mode" description="Sign in to view your wellness report." /></>
  if (loading) return <><PageTitle eyebrow="Your wellness journey" title="Wellness report" description="Based on your latest assessment." /><IntegrationState state="loading" title="Loading report" description="Fetching your report." /></>
  if (error) return <><PageTitle eyebrow="Your wellness journey" title="Wellness report" description="Based on your latest assessment." /><IntegrationState title="No report available" description={error} /></>

  const calc = report?.calculated_results || []
  const indicators = report?.lifestyle_indicators || []
  const strengths = report?.strengths || []
  const areas = report?.areas_to_watch || []
  const general = report?.general_recommendations || []
  const products = report?.product_recommendations || []
  const nextSteps = report?.next_steps || []
  const history = report?.history || []
  const unavailable = report?.unavailable || []
  const goals = report?.goals || []

  return (
    <>
      <PageTitle eyebrow="Your wellness journey" title="Wellness report" description="A detailed, educational summary based on your latest saved assessment." />
      <div className="report-grid">
        <section className="report-section">
          <h2>Overall wellness summary</h2>
          <p><strong>{report?.overall_summary?.headline || 'Latest assessment'}</strong></p>
          <p>{report?.overall_summary?.details || report?.summary}</p>
          <div className="report-kpis" style={{ marginTop: 12 }}>
            <div className="report-kpi"><strong>{report?.bmi ?? '-'}</strong><span>BMI (calculated)</span></div>
            <div className="report-kpi"><strong>{report?.age_band || '-'}</strong><span>Age band</span></div>
            <div className="report-kpi"><strong>{formatDate(report?.created_at)}</strong><span>Assessment date</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Calculated results and explanations</h2>
          {calc.length ? <ul className="settings-list">{calc.map((c, i) => <li key={i}><strong>{c.label}:</strong> {c.value}<div className="report-note">{c.explanation}</div></li>)}</ul> : <p className="report-note">No calculated results are available.</p>}
        </section>

        <div className="report-grid report-grid--two">
          <section className="report-section">
            <h2>Goals and lifestyle indicators</h2>
            <h3>Goals</h3>
            {goals.length ? <ul className="report-list">{goals.map((g) => <li key={g}>{g}</li>)}</ul> : <p className="report-note">No goals recorded.</p>}
            <h3>Lifestyle indicators (submitted)</h3>
            {indicators.length ? <ul className="report-list">{indicators.map((ind, i) => <li key={i}><strong>{ind.label}:</strong> {ind.value}</li>)}</ul> : <p className="report-note">No lifestyle indicators available.</p>}
          </section>

          <section className="report-section">
            <h2>Strengths and areas needing attention</h2>
            <h3>Strengths</h3>
            {strengths.length ? <ul className="report-list">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="report-note">No strengths inferred from available inputs.</p>}
            <h3>Areas needing attention</h3>
            {areas.length ? <ul className="report-list">{areas.map((a, i) => <li key={i}>{a}</li>)}</ul> : <p className="report-note">No areas inferred from available inputs.</p>}
            <p className="report-note">These points are derived from your submitted inputs only and are not clinical assessments.</p>
          </section>
        </div>

        <section className="report-section">
          <h2>Personalized general wellness recommendations</h2>
          {general.length ? <ul className="report-list">{general.map((g, i) => <li key={i}>{g}</li>)}</ul> : <p className="report-note">No general recommendations available.</p>}
        </section>

        <section className="report-section">
          <h2>Relevant product recommendations</h2>
          {products.length ? (
            <ul className="settings-list">
              {products.map((p, i) => (
                <li key={i}>
                  <strong>{p.slug ? <Link to={'/products/' + encodeURIComponent(p.slug)}>{p.name || p.slug}</Link> : (p.name || 'Product')}</strong>
                  {p.reason ? <div>{p.reason}</div> : null}
                  {p.note ? <div className="report-note">{p.note}</div> : null}
                </li>
              ))}
            </ul>
          ) : <p className="report-note">No product recommendations are available. This may mean there are no matching published products or no recommendations could be generated from your assessment.</p>}
        </section>

        <section className="report-section">
          <h2>Suggested next steps</h2>
          {nextSteps.length ? <ol className="report-list">{nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol> : <p className="report-note">No next steps available.</p>}
        </section>

        <section className="report-section">
          <h2>Report history (assessments)</h2>
          {history.length ? <div className="assessment-history">{history.map((h) => <article className="assessment-history__item" key={h.id}><strong>Assessment #{h.id}</strong><div className="assessment-history__meta"><span>{formatDate(h.created_at)}</span><span>BMI: {h.bmi ?? '-'}</span><span>Age band: {h.age_band || '-'}</span></div></article>)}</div> : <p className="report-note">No assessment history available.</p>}
          <p className="report-note" style={{ marginTop: 8 }}>Previous assessments and their results are preserved; new assessments do not overwrite earlier ones.</p>
        </section>

        {unavailable.length > 0 && (
          <section className="report-section">
            <h2>Data availability notes</h2>
            <ul className="report-list">{unavailable.map((u, i) => <li key={i}>{u}</li>)}</ul>
          </section>
        )}
      </div>
      <p className="dashboard-disclaimer">This report is educational and not medical advice, diagnosis, or treatment. Consult a qualified healthcare professional for personal medical concerns. No scores or clinical thresholds are fabricated.</p>
    </>
  )
}

export function RecommendationsPage() {
  const { isPreviewMode } = useAuth()
  const [activeTab, setActiveTab] = useState('Recommended products')
  const [loading, setLoading] = useState(!isPreviewMode)
  const [recs, setRecs] = useState(null)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    Promise.allSettled([getLatestRecommendation(), getWellnessPlan()]).then(([rRes, pRes]) => {
      if (!active) return
      if (rRes.status === 'fulfilled') setRecs(rRes.value); else setError(getErrorMessage(rRes.reason, 'No recommendations available yet.'))
      if (pRes.status === 'fulfilled') setPlan(pRes.value)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])
  if (isPreviewMode) return <><PageTitle eyebrow="Your wellness" title="Recommendations" description="Personalized recommendations require sign-in and assessment." /><IntegrationState title="Preview mode" description="Sign in to view recommendations." /></>
  if (loading) return <><PageTitle eyebrow="Your wellness" title="Recommendations" description="Based on your latest assessment." /><IntegrationState state="loading" title="Loading recommendations" description="Fetching recommendations." /></>
  return (
    <>
      <PageTitle eyebrow="Your wellness" title="Recommendations" description="Based on your latest assessment and available products." />
      <div className="recommendations-tabs" role="tablist" aria-label="Recommendation views">
        {['Recommended products', 'Wellness plan'].map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-selected' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>
      {activeTab === 'Wellness plan' ? (
        plan ? <section className="dashboard-panel"><h2>Wellness plan</h2>{plan.steps?.length ? <ul className="settings-list">{plan.steps.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>No steps yet.</p>}{plan.note && <p className="dashboard-disclaimer">{plan.note}</p>}</section> : <IntegrationState title="No wellness plan available" description="Complete an assessment to generate a wellness plan." />
      ) : (
        recs?.items?.length ? <div className="marketplace-product-grid">{recs.items.map((item) => (
          <article className="marketplace-card" key={item.id}>
            <div className="marketplace-card__content">
              <h2><Link to={'/products/' + encodeURIComponent(item.product.slug)}>{item.product.name}</Link></h2>
              <p>{item.reason}</p>
              {item.note && <p className="dashboard-disclaimer">{item.note}</p>}
              <Link className="button button--outline" to={'/products/' + encodeURIComponent(item.product.slug)}>View product <ArrowRight size={14} /></Link>
            </div>
          </article>
        ))}</div> : <IntegrationState title="No recommendations available" description={error || 'Complete an assessment to receive product suggestions from the catalogue.'} />
      )}
    </>
  )
}

export function AssistantPage() {
  const { isPreviewMode } = useAuth()
  const navigate = useNavigate()
  const chat = useAssistantChat()
  const inputRef = useRef(null)
  const handleReady = useCallback(() => inputRef.current?.focus(), [])
  const goOverview = useCallback(() => navigate('/dashboard/overview'), [navigate])

  if (isPreviewMode) {
    return (
      <>
        <PageTitle eyebrow="Your wellness" title="AI wellness assistant" description="Personalized guidance is available after sign-in." />
        <IntegrationState title="Preview mode" description="Sign in to chat with the NutraAI wellness assistant." />
      </>
    )
  }

  return (
    <>
      <PageTitle
        eyebrow="Your wellness"
        title="AI wellness assistant"
        description="Ask about nutrition, sleep, activity or supplements. Replies are educational guidance, not medical advice."
      />
      <section className="dashboard-panel assistant-page">
        <Suspense fallback={<IntegrationState state="loading" title="Loading assistant" description="Preparing your wellness companion." />}>
          <AIChatPanel
            variant="page"
            messages={chat.messages}
            feedback={chat.feedback}
            inputRef={inputRef}
onClose={goOverview}
            onClear={chat.clear}
            onDraftQuestion={(question) => {
              chat.draft(question)
              inputRef.current?.focus()
            }}
            onMinimize={goOverview}
            onReady={handleReady}
            onSend={chat.send}
            RobotCharacter={RobotCharacter}
            value={chat.value}
            onChange={(event) => chat.setValue(event.target.value)}
            isLoading={chat.isLoading}
            error={chat.error}
            onRetry={chat.retry}
          />
        </Suspense>
      </section>
    </>
  )
}
