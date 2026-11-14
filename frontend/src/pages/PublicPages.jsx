import { useState } from 'react'
import { ArrowRight, ChevronRight, Eye, Leaf, Mail, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import Membership from '../components/home/Membership.jsx'
import PublicPageFrame from '../components/layout/PublicPageFrame.jsx'
import IntegrationState from '../components/common/IntegrationState.jsx'
import { products } from '../data/products.js'

export function AboutPage() {
  return (
    <PublicPageFrame>
      <section className="inner-hero about-hero">
        <div className="inner-hero__copy">
          <span className="eyebrow">A more thoughtful kind of wellness</span>
          <h1>About NutraAI Labs</h1>
          <p>NutraAI Labs is being built to bring approachable wellness tools, personalized experiences, and trusted product information together.</p>
        </div>
        <div className="about-art" aria-label="NutraAI Labs botanical illustration" role="img">
          <div className="about-art__sun" /><div className="about-art__leaf about-art__leaf--one" /><div className="about-art__leaf about-art__leaf--two" /><div className="about-art__leaf about-art__leaf--three" />
          <div className="about-art__sign"><Leaf size={21} /><strong>NutraAI<br />Labs</strong><small>WELLNESS, THOUGHTFULLY</small></div>
        </div>
      </section>
      <section className="mission-vision">
        <article className="mission-card"><span className="mission-icon"><Target size={19} /></span><div><span className="eyebrow">Our mission</span><h2>Make wellness personal.</h2><p>Make everyday wellness easier to understand, while keeping personal choice and professional care in focus.</p></div></article>
        <article className="mission-card"><span className="mission-icon"><Eye size={19} /></span><div><span className="eyebrow">Our vision</span><h2>A healthier way forward.</h2><p>Build thoughtful tools that help people make informed choices at a pace that feels right for them.</p></div></article>
      </section>
      <section className="values-strip" aria-label="Our values">
        {[['AI-aware', 'Technology'], ['Personal', 'Wellness'], ['Clear', 'Information'], ['Long-term', 'Perspective']].map(([title, detail], index) => (
          <div className="value-item" key={title}><span className="value-item__number">0{index + 1}</span><strong>{title}</strong><span>{detail}</span></div>
        ))}
      </section>
      <section className="editorial-note"><span className="eyebrow">Our point of view</span><h2>Prevention is personal. Progress can be, too.</h2><p>Technology can support informed choices, but it does not replace professional healthcare or clinical judgment.</p></section>
    </PublicPageFrame>
  )
}

export function ProductsPage() {
  const [category, setCategory] = useState('All products')
  const categories = ['All products', 'Vitamins', 'Minerals', 'Daily essentials']
  const filteredProducts = category === 'All products' ? products : products.filter((product) => product.category === category)
  return (
    <PublicPageFrame>
      <section className="catalog-page">
        <div className="catalog-heading"><span className="eyebrow">Product catalogue</span><h1>Explore product <em>information.</em></h1><p>Verified products and details will appear here when the catalogue service is available.</p></div>
        <div className="catalog-filters" role="group" aria-label="Filter products by category">
          {categories.map((item) => <button className={category === item ? 'is-selected' : ''} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        {filteredProducts.length ? <div className="catalog-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}><h2>{product.name}</h2><p>{product.description}</p></article>)}</div> : <div className="catalog-unavailable"><h2>Catalogue unavailable</h2><p>No product information is currently loaded. Product details, ingredients, benefits, and pricing will be shown only when verified catalogue data is available.</p></div>}
      </section>
    </PublicPageFrame>
  )
}

export function HowItWorksPage() {
  const steps = [
    { number: '01', title: 'Create your profile', description: 'Account services will help you securely manage your details and preferences.', icon: '◉' },
    { number: '02', title: 'Complete an assessment', description: 'A connected assessment service can collect your responses with clear consent.', icon: '▤' },
    { number: '03', title: 'Review your information', description: 'Verified reports and recommendations will appear when services are available.', icon: '✳' },
    { number: '04', title: 'Track your progress', description: 'Connected tracking tools can help you review your wellness journey over time.', icon: '▥' },
  ]
  return (
    <PublicPageFrame>
      <section className="process-page">
        <div className="catalog-heading"><span className="eyebrow">A considered journey</span><h1>How NutraAI <em>works.</em></h1><p>Designed to make wellness information easier to navigate. Account and wellness services are still being connected.</p></div>
        <div className="process-steps">{steps.map((step) => <article className="process-step" key={step.number}><div className="process-step__top"><span>{step.icon}</span><i /><small>{step.number}</small></div><h2>{step.title}</h2><p>{step.description}</p></article>)}</div>
        <div className="process-note"><Leaf size={18} /><span>Wellness tools are intended to support—not replace—professional care.</span></div>
        <Link className="button button--primary" to="/register">Create an account <ArrowRight size={16} /></Link>
      </section>
    </PublicPageFrame>
  )
}

export function MembershipPage() {
  return <PublicPageFrame><header className="membership-page-heading"><span className="eyebrow">Membership options</span><h1>Wellness support, on your terms.</h1><p>Compare the three membership options and their approved entitlements.</p></header><Membership /></PublicPageFrame>
}

export function ContactPage() {
  const [status, setStatus] = useState('')
  function handleSubmit(event) {
    event.preventDefault()
    setStatus('Contact services are unavailable. Your message has not been sent.')
  }
  return (
    <PublicPageFrame>
      <section className="contact-page">
        <div className="contact-copy">
          <span className="eyebrow">We are here to help</span><h1>Get in <em>touch.</em></h1>
          <p>Send a message when contact services are connected. This form does not transmit or store your information.</p>
          <div className="contact-details"><div><span><Mail size={17} /></span><div><strong>Contact form</strong><small>Messages are not currently delivered.</small></div></div></div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send us a message</h2>
          <label>Full name<input name="name" autoComplete="name" placeholder="Your name" required /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <label>Your message<textarea name="message" rows="5" placeholder="How can we help?" required /></label>
          <button className="button button--primary" type="submit">Send message <ArrowRight size={15} /></button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      </section>
    </PublicPageFrame>
  )
}

export function ProductDetailsPage() {
  return (
    <PublicPageFrame>
      <div className="not-found"><span className="eyebrow">Product information</span><h1>Product details unavailable</h1><p>Verified product information is not currently available. No placeholder product or price is shown.</p><Link to="/products">Browse the catalogue <ChevronRight size={15} /></Link></div>
      <IntegrationState title="Product catalogue not connected" description="Product details will be displayed after verified catalogue data is available." />
    </PublicPageFrame>
  )
}
