import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import AIWellness from '../components/home/AIWellness.jsx'
import FAQ from '../components/home/FAQ.jsx'
import Hero from '../components/home/Hero.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import Membership from '../components/home/Membership.jsx'
import Products from '../components/home/Products.jsx'
import Personalization from '../components/home/Personalization.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import AmbientParticles from '../components/effects/AmbientParticles.jsx'
import usePublicMotion from '../hooks/usePublicMotion.js'

function HomePage() {
  const contentRef = usePublicMotion()

  return (
    <>
      <Header />
      <main className="public-page public-page--home" ref={contentRef}>
        <div className="public-page__ambient" aria-hidden="true"><span /><span /><span /></div>
        <AmbientParticles />
        <Hero />
        <HowItWorks />
        <Personalization />
        <Products />
        <AIWellness />
        <Membership />
        <Testimonials />
        <FAQ />
        <section className="closing-cta" id="contact">
          <div className="closing-cta__inner">
            <div>
              <span className="eyebrow eyebrow--light">A more personal approach</span>
              <h2>Small steps. A clearer picture of your wellness.</h2>
              <p>Start with a thoughtful assessment and discover what feels right for you.</p>
            </div>
            <a className="button button--gold" href="/assessment">
              Begin your assessment <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default HomePage
