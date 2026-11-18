import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, Leaf, Mail, Package, Target } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Membership from '../components/home/Membership.jsx'
import PublicPageFrame from '../components/layout/PublicPageFrame.jsx'
import { addToCart, getErrorMessage, getProduct } from '../services/apiBackend/index.js'
import { useAuth } from '../context/AuthContext.jsx'
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
      <section className="editorial-note"><span className="eyebrow">Our point of view</span><h2>Prevention is personal.</h2><p>Technology can support informed choices, but it does not replace professional healthcare or clinical judgment.</p></section>
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
    { number: '01', title: 'Create your profile', description: 'Account services will help you securely manage your details and preferences.', icon: 'â—‰' },
    { number: '02', title: 'Complete an assessment', description: 'A connected assessment service can collect your responses with clear consent.', icon: 'â–¤' },
    { number: '03', title: 'Review your information', description: 'Verified reports and recommendations will appear when services are available.', icon: 'âœ³' },
    { number: '04', title: 'Review your wellness journey', description: 'Use your dashboard to review your assessment, wellness plan, recommendations, and orders when services are available.', icon: '✦' },
  ]
  return (
    <PublicPageFrame>
      <section className="process-page">
        <div className="catalog-heading"><span className="eyebrow">A considered journey</span><h1>How NutraAI <em>works.</em></h1><p>Designed to make wellness information easier to navigate. Account and wellness services are still being connected.</p></div>
        <div className="process-steps">{steps.map((step) => <article className="process-step" key={step.number}><div className="process-step__top"><span>{step.icon}</span><i /><small>{step.number}</small></div><h2>{step.title}</h2><p>{step.description}</p></article>)}</div>
        <div className="process-note"><Leaf size={18} /><span>Wellness tools are intended to supportâ€”not replaceâ€”professional care.</span></div>
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
  const { slug } = useParams()
  const { isPreviewMode, isAuthenticated, refreshCartCount } = useAuth()
  const [product, setProduct] = useState(null)
  const [loadedSlug, setLoadedSlug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [failedImageUrls, setFailedImageUrls] = useState([])
  const [adding, setAdding] = useState(false)
  const [cartStatus, setCartStatus] = useState('')

  useEffect(() => {
    let active = true
    getProduct(slug)
      .then((result) => {
        if (active) {
          setProduct(result)
          setError('')
          setFailedImageUrls([])
          setLoadedSlug(slug)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(getErrorMessage(requestError, 'Product details could not be loaded.'))
          setLoadedSlug(slug)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [slug, retryCount])

  const isLoading = loading || loadedSlug !== slug
  const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
  const images = product?.images?.length
    ? product.images
    : product?.image ? [{ url: product.image, alt: product.imageAlt || product.name }] : []
  const availableImages = images.filter((image) => image.url && !failedImageUrls.includes(image.url))

  async function handleAddToCart() {
    if (!product || !product.inStock) return
    if (isPreviewMode || !isAuthenticated) { setCartStatus('Sign in to add products to your cart.'); return }
    setAdding(true); setCartStatus('')
    try {
      await addToCart(product.id, 1)
      await refreshCartCount()
      setCartStatus('Added to your cart.')
    } catch (e) {
      setCartStatus(getErrorMessage(e, 'Could not add to cart.'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <PublicPageFrame>
      <section className="product-detail-page">
        <Link className="product-detail-back" to="/products"><ArrowLeft size={15} /> Product information</Link>
        {isLoading
          ? <div className="product-detail-state" role="status" aria-busy="true"><Package size={20} /><h1>Loading product details</h1><p>Fetching verified information from the catalogue.</p></div>
          : error
            ? <div className="product-detail-state" role="alert"><Package size={20} /><h1>Product details unavailable</h1><p>{error}</p><button className="button button--primary" type="button" onClick={() => { setLoading(true); setError(''); setLoadedSlug(null); setRetryCount((value) => value + 1) }}>Retry</button></div>
            : product && <>
              <div className="product-detail-main">
                <div className={`product-detail-image${availableImages.length > 1 ? ' has-gallery' : ''}`}>
                  {availableImages.length
                    ? availableImages.map((image, index) => <img key={`${image.url}-${index}`} src={image.url} alt={image.alt || product.name} onError={() => setFailedImageUrls((current) => [...current, image.url])} />)
                    : <span role="img" aria-label="Product image unavailable"><Package size={42} aria-hidden="true" /></span>}
                </div>
                <div className="product-detail-copy">
                  <span className="eyebrow">{product.category || 'Product information'}</span>
                  <h1>{product.name}</h1>
                  {product.longDescription && <p className="product-detail-description">{product.longDescription}</p>}
                  {product.longDescription && product.description !== product.longDescription && <p>{product.description}</p>}
                  <div className="product-detail-price"><strong>{product.price === null ? 'Price unavailable' : priceFormatter.format(product.price)}</strong>{product.mrp !== null && product.price !== null && product.mrp > product.price && <del>{priceFormatter.format(product.mrp)}</del>}{product.discountPercent > 0 && <span>{product.discountPercent}% off</span>}</div>
                  <p className={product.inStock ? 'product-detail-stock is-in-stock' : 'product-detail-stock is-out-of-stock'}>{product.inStock ? (product.lowStock ? 'Low stock' : 'In stock') : 'Out of stock'}</p>
                  <dl className="product-detail-specs">
                    {product.form && <div><dt>Form</dt><dd>{product.form}</dd></div>}
                    {product.servingSize && <div><dt>Serving size</dt><dd>{product.servingSize}</dd></div>}
                    {product.servingsPerPack && <div><dt>Servings per pack</dt><dd>{product.servingsPerPack}</dd></div>}
                  </dl>
                  <div className="product-detail-actions"><button className="button button--primary" type="button" disabled={!product.inStock || adding} onClick={handleAddToCart}>{adding ? 'Addingâ€¦' : 'Add to cart'}</button><Link className="button button--outline" to="/dashboard/marketplace">View marketplace <ArrowRight size={14} /></Link></div>
                  {cartStatus && <p className="form-status" role="status">{cartStatus}</p>}
                </div>
              </div>
              <div className="product-detail-sections">
                {Array.isArray(product.benefits) && product.benefits.length > 0 && <section><h2>Benefits</h2><ul>{product.benefits.map((benefit, index) => <li key={`${benefit}-${index}`}>{benefit}</li>)}</ul></section>}
                {typeof product.benefits === 'string' && product.benefits && <section><h2>Benefits</h2><p>{product.benefits}</p></section>}
                {product.usageDirections && <section><h2>Usage directions</h2><p>{product.usageDirections}</p></section>}
                {product.ingredients?.length > 0 && <section><h2>Ingredients</h2><ul>{product.ingredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`}>{ingredient.name}{ingredient.amount ? ` â€” ${ingredient.amount}` : ''}</li>)}</ul></section>}
                {product.allergens?.length > 0 && <section><h2>Allergens</h2><p>{product.allergens.map((allergen) => allergen.name).join(', ')}</p></section>}
                {product.warnings && <section><h2>Warnings</h2><p>{product.warnings}</p></section>}
                {product.requiresDoctorApproval && <p className="product-detail-warning">Consult a doctor before using this product.</p>}
              </div>
            </>}
      </section>
    </PublicPageFrame>
  )
}
