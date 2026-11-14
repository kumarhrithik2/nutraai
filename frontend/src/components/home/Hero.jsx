import { Activity, ArrowDown, ArrowRight, Brain, Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section className="hero-section" id="about">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-kicker"><span /> PERSONALIZED PREVENTIVE HEALTHCARE</div>
          <h1><span>Your Health Journey,</span><br /><span>Powered by <em>Intelligence.</em></span></h1>
          <p className="hero-description">
            Explore a thoughtful approach to everyday wellness. Account, assessment, AI, and product services are being connected.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary button--large" to="/register">
              Create an account <ArrowRight size={17} />
            </Link>
            <a className="button button--text button--large" href="#products">
              Explore products <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-assurance">
            <span className="assurance-icon"><Check size={14} /></span>
            <span>Thoughtful design. Your choices.</span>
          </div>
        </div>
        <div className="hero-art" aria-label="Illustration of personalized wellness insights" role="img">
          <div className="art-orbit art-orbit--one" />
          <div className="art-orbit art-orbit--two" />
          <div className="art-plant art-plant--left"><i /><i /><i /><i /></div>
          <div className="art-plant art-plant--right"><i /><i /><i /></div>
          <div className="wellness-card">
            <div className="wellness-card__top">
              <span className="wellness-card__icon"><Brain size={18} /></span>
              <span className="card-status"><span /> PERSONAL WELLNESS</span>
              <span className="card-sparkle"><Sparkles size={16} /></span>
            </div>
            <p className="wellness-card__label">Product experience preview</p>
            <h2>A thoughtful place to begin.</h2>
            <p className="wellness-card__sub">Account services are not connected</p>
            <div className="wellness-score">
              <div className="score-ring"><Activity size={21} /></div>
              <div><strong>Preview only</strong><span>No personal data displayed</span></div>
            </div>
          </div>
          <div className="float-note float-note--top">
            <span className="float-note__icon"><Sparkles size={16} /></span>
            <span><strong>Designed around choice</strong><small>Personal, not one-size-fits-all</small></span>
          </div>
          <div className="float-note float-note--bottom">
            <span className="float-note__dots"><i /><i /><i /></span>
            <span><strong>Wellness, considered</strong><small>Clear tools, when services are ready</small></span>
          </div>
          <span className="art-caption">A more considered way to feel well</span>
        </div>
      </div>
      <div className="hero-bottom">
        <span>PREVENTION, PERSONALIZED</span>
        <span className="hero-bottom-line" />
        <a href="#how-it-works">Discover our approach <ArrowDown size={14} /></a>
      </div>
    </section>
  )
}

export default Hero
