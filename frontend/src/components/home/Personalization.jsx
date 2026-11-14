import { ArrowRight, Check, Compass, Leaf, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const preferences = [
  { icon: Compass, label: 'Everyday goals' },
  { icon: Leaf, label: 'Personal routines' },
  { icon: Sparkles, label: 'What matters to you' },
]

function Personalization() {
  return (
    <section className="personalization-section" aria-labelledby="personalization-title">
      <div className="personalization-section__inner">
        <div className="personalization-copy">
          <span className="eyebrow">Personal by design</span>
          <h2 id="personalization-title">Your choices.<br /><em>Your starting point.</em></h2>
          <p>Share general preferences and everyday goals at a pace that feels right. The experience is designed to help organize what you choose to share—not to diagnose or replace professional care.</p>
          <ul className="personalization-preferences">
            {preferences.map(({ icon: Icon, label }) => (
              <li key={label}><span><Icon size={16} /></span>{label}</li>
            ))}
          </ul>
          <Link className="personalization-link" to="/assessment">Explore the assessment <ArrowRight size={15} /></Link>
        </div>
        <div className="personalization-visual" aria-label="Illustrative profile and wellness summary preview" role="img">
          <div className="personalization-orbit personalization-orbit--one" />
          <div className="personalization-orbit personalization-orbit--two" />
          <div className="personalization-profile">
            <span className="personalization-profile__mark"><Leaf size={21} /></span>
            <span><small>EXPERIENCE PREVIEW</small><strong>A place for your preferences</strong></span>
            <Check size={16} />
          </div>
          <div className="personalization-report">
            <div className="personalization-report__top"><span>GENERAL PREFERENCES</span><span>PREVIEW</span></div>
            <h3>A place for what matters.</h3>
            <div className="personalization-report__bars" aria-hidden="true">
              <span><i /><b>Everyday routines</b></span>
              <span><i /><b>Personal goals</b></span>
              <span><i /><b>Product exploration</b></span>
            </div>
            <p>Preview only · No customer data or health score</p>
          </div>
          <span className="personalization-visual__caption">YOUR DETAILS, YOUR CHOICE</span>
        </div>
      </div>
    </section>
  )
}

export default Personalization
