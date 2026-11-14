import { Activity, BrainCircuit, HeartPulse, ScanHeart, Sparkles } from 'lucide-react'

const features = [
  {
    icon: ScanHeart,
    title: 'AI health assessment',
    description: 'A guided way to reflect on your habits, preferences, and wellness goals.',
  },
  {
    icon: Sparkles,
    title: 'Personalized recommendations',
    description: 'Recommendations can appear here after connected services process information you choose to share.',
  },
  {
    icon: BrainCircuit,
    title: 'AI wellness assistant',
    description: 'A connected AI service may support general wellness questions and next steps.',
  },
  {
    icon: Activity,
    title: 'Wellness progress tracking',
    description: 'Connected tracking tools can keep goals and check-ins together over time.',
  },
]

function AIWellness() {
  return (
    <section className="ai-section" id="features">
      <div className="ai-content" id="ai-wellness">
        <span className="eyebrow eyebrow--light">Intelligence with intention</span>
        <h2>More personal.<br /><em>More empowering.</em></h2>
        <p className="ai-intro">
          Technology should make your wellness feel clearer, not more complicated.
          NutraAI is being built to bring everyday choices into one considered experience.
        </p>
        <p className="ai-preview-note">Product experience preview · Not connected to a live AI model</p>
        <div className="ai-feature-list">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article className="ai-feature" key={title}>
              <span className="ai-feature__icon"><Icon size={19} strokeWidth={1.7} /></span>
              <span className="ai-feature__copy">
                <span className="ai-feature__title">{title}</span>
                <span className="ai-feature__description">{description}</span>
              </span>
              <span className="ai-feature__number">0{index + 1}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="ai-visual" aria-hidden="true">
        <div className="ai-flow-label ai-flow-label--start">YOUR DETAILS</div>
        <div className="ai-flow-label ai-flow-label--middle">PERSONALIZATION</div>
        <div className="ai-flow-label ai-flow-label--end">WELLNESS INSIGHTS</div>
        <span className="ai-flow-line ai-flow-line--one" />
        <span className="ai-flow-line ai-flow-line--two" />
        <div className="ai-visual__circle ai-visual__circle--outer" />
        <div className="ai-visual__circle ai-visual__circle--middle" />
        <div className="ai-visual__circle ai-visual__circle--inner" />
        <div className="ai-visual__center"><HeartPulse size={35} strokeWidth={1.35} /></div>
        <span className="ai-orbit-icon ai-orbit-icon--one"><BrainCircuit size={20} /></span>
        <span className="ai-orbit-icon ai-orbit-icon--two"><Sparkles size={19} /></span>
        <span className="ai-orbit-icon ai-orbit-icon--three"><Activity size={19} /></span>
        <div className="ai-insight">
          <span className="ai-insight__check">✓</span>
          <span><strong>Built around you</strong><small>Wellness, made personal</small></span>
        </div>
        <span className="ai-orbit-label ai-orbit-label--one">YOUR GOALS</span>
        <span className="ai-orbit-label ai-orbit-label--two">YOUR ROUTINE</span>
      </div>
    </section>
  )
}

export default AIWellness
