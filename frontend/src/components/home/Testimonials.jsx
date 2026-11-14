import { HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react'

const principles = [
  { icon: HeartHandshake, title: 'Human-centered', detail: 'Designed to support informed personal choices.' },
  { icon: ShieldCheck, title: 'Thoughtful by design', detail: 'Privacy and clarity belong in every interaction.' },
  { icon: Sparkles, title: 'Built with intention', detail: 'Useful wellness tools, when services are ready.' },
]

function Testimonials() {
  return (
    <section className="section testimonials-section">
      <div className="section-heading section-heading--split testimonial-heading">
        <div>
          <span className="eyebrow">A more personal path</span>
          <h2>Wellness should feel<br /><em>like your own.</em></h2>
        </div>
        <p>We believe a supportive wellness experience begins with listening to what matters to you.</p>
      </div>
      <div className="testimonial-grid">
        {principles.map(({ icon: Icon, title, detail }) => (
          <article className="testimonial-card" key={title}>
            <div className="testimonial-card__top"><span className="quote-icon"><Icon size={18} /></span></div>
            <h3>{title}</h3>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Testimonials
