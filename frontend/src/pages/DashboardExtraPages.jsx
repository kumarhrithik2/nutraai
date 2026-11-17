import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, Camera, Check, ChevronLeft, ChevronRight, Package, Search, Settings, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'
import { getErrorMessage, listCategories, listProducts } from '../services/apiBackend/index.js'

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <header className="dashboard-page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  )
}

export function HealthProfilePage() {
  const [values, setValues] = useState({ name: '', email: '', phone: '', focus: '', routine: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [picture, setPicture] = useState('')
  const pictureUrlRef = useRef('')

  useEffect(() => () => {
    if (pictureUrlRef.current) URL.revokeObjectURL(pictureUrlRef.current)
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setStatus('')
  }

  function selectPicture(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Choose an image that is 5 MB or smaller.')
      return
    }
    if (pictureUrlRef.current) URL.revokeObjectURL(pictureUrlRef.current)
    pictureUrlRef.current = URL.createObjectURL(file)
    setPicture(pictureUrlRef.current)
    setStatus('Image preview selected. It has not been uploaded.')
  }

  function submitProfile(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Enter your full name.'
    if (!values.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!event.currentTarget.elements.email.validity.valid) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStatus('Profile services are unavailable. Your changes have not been saved.')
  }

  return (
    <>
      <PageTitle eyebrow="Your information, your choice" title="My health profile" description="Review account details and general wellness preferences." />
      <section className="dashboard-panel basic-profile-panel" id="basic-information">
        <div className="panel-heading"><div><span className="eyebrow">Account details</span><h2>Basic information</h2></div></div>
        <p className="basic-profile-intro">No customer profile is loaded. Changes on this screen remain in memory and are not uploaded or saved.</p>
        <div className="basic-profile-picture">
          {picture ? <img className="profile-avatar profile-avatar--large" src={picture} alt="Selected profile preview" /> : <span className="profile-avatar profile-avatar--large" aria-hidden="true">?</span>}
          <div className="basic-profile-picture__actions">
            <strong>Profile picture</strong><small>JPG, PNG, or WebP · up to 5 MB</small>
            <div>
              <label className="button button--outline basic-profile-upload"><Camera size={14} /> Choose image<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectPicture} /></label>
              {picture && <button className="basic-profile-remove" type="button" onClick={() => {
                URL.revokeObjectURL(pictureUrlRef.current)
                pictureUrlRef.current = ''
                setPicture('')
                setStatus('Image preview removed. No profile picture was uploaded.')
              }}><Trash2 size={13} /> Remove preview</button>}
            </div>
          </div>
        </div>
        <form className="basic-profile-form" onSubmit={submitProfile} noValidate>
          <label>Full name<input name="name" autoComplete="name" value={values.name} onChange={updateField} aria-invalid={Boolean(errors.name)} />{errors.name && <span className="auth-field-error" role="alert">{errors.name}</span>}</label>
          <label>Email address<input name="email" type="email" autoComplete="email" value={values.email} onChange={updateField} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="auth-field-error" role="alert">{errors.email}</span>}</label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={updateField} /></label>
          <label>General wellness focus<select name="focus" value={values.focus} onChange={updateField}><option value="">Select an option</option><option>Building a consistent routine</option><option>Learning about everyday wellness</option><option>Prefer not to say</option></select></label>
          <label>Routine preference<select name="routine" value={values.routine} onChange={updateField}><option value="">Select an option</option><option>Fairly consistent</option><option>Changes day to day</option><option>Still finding what works</option><option>Prefer not to say</option></select></label>
          <div className="basic-profile-form__actions"><button className="button button--primary" type="submit">Save changes <Check size={14} /></button></div>
          {status && <p className="form-status basic-profile-form__status" role="status">{status}</p>}
        </form>
      </section>
      <p className="dashboard-disclaimer">Do not enter medical records or sensitive health information until secure account services are available.</p>
    </>
  )
}

export function WellnessPlanPage() {
  return (
    <>
      <PageTitle eyebrow="Your wellness journey" title="My wellness plan" description="Review a plan created from your verified account and wellness information." />
      <IntegrationState title="No wellness plan available" description="Plans are not generated or stored in this frontend. Connect the approved wellness service to load a customer plan." />
      <div className="wellness-plan-actions">
        <Link className="button button--outline" to="/dashboard/assessment">Health assessment <ArrowRight size={14} /></Link>
        <Link className="button button--outline" to="/dashboard/progress">Progress tracking <ArrowRight size={14} /></Link>
      </div>
    </>
  )
}

const marketplacePriceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

function MarketplaceProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const detailsUrl = `/products/${encodeURIComponent(product.slug)}`

  return (
    <article className="marketplace-card">
      <Link className="marketplace-card__image" to={detailsUrl} aria-label={`View ${product.name} details`}>
        {product.image && !imageFailed
          ? <img src={product.image} alt={product.imageAlt || product.name} loading="lazy" onError={() => setImageFailed(true)} />
          : <span role="img" aria-label="Product image unavailable"><Package size={30} aria-hidden="true" /></span>}
      </Link>
      <div className="marketplace-card__content">
        <div className="marketplace-card__meta">
          <span>{product.category || 'Wellness'}</span>
          <span className={product.inStock ? 'is-in-stock' : 'is-out-of-stock'}>{product.inStock ? (product.lowStock ? 'Low stock' : 'In stock') : 'Out of stock'}</span>
        </div>
        <h2><Link to={detailsUrl}>{product.name}</Link></h2>
        {product.description && <p>{product.description}</p>}
        <div className="marketplace-card__price">
          <strong>{product.price === null ? 'Price unavailable' : marketplacePriceFormatter.format(product.price)}</strong>
          {product.mrp !== null && product.price !== null && product.mrp > product.price && <del>{marketplacePriceFormatter.format(product.mrp)}</del>}
          {product.discountPercent > 0 && <span>{product.discountPercent}% off</span>}
        </div>
        <Link className="button button--outline marketplace-card__details" to={detailsUrl}>View details <ArrowRight size={14} /></Link>
      </div>
    </article>
  )
}

export function MarketplacePage() {
  const [products, setProducts] = useState([])
  const [pageData, setPageData] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryError, setCategoryError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [ordering, setOrdering] = useState('featured')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [categoryRetryCount, setCategoryRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    listCategories()
      .then((items) => {
        if (active) {
          setCategories(items)
          setCategoryError('')
        }
      })
      .catch((requestError) => {
        if (active) setCategoryError(getErrorMessage(requestError, 'Product categories could not be loaded.'))
      })
    return () => { active = false }
  }, [categoryRetryCount])

  useEffect(() => {
    let active = true
    listProducts({ search: query, category, ordering, page, pageSize: 12 })
      .then((result) => {
        if (active) {
          setProducts(result.results)
          setPageData(result)
        }
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError, 'The catalogue could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [query, category, ordering, page, retryCount])

  function beginProductRequest() {
    setLoading(true)
    setError('')
  }

  function submitSearch(event) {
    event.preventDefault()
    const nextQuery = search.trim()
    if (nextQuery === query && page === 1) {
      beginProductRequest()
      setRetryCount((value) => value + 1)
      return
    }
    beginProductRequest()
    setPage(1)
    setQuery(nextQuery)
  }

  const hasActiveFilters = Boolean(query) || category !== 'All'

  return (
    <>
      <PageTitle eyebrow="Product catalogue" title="Products & marketplace" description="Browse published products from the NutraAI catalogue." action={<Link className="button button--outline" to="/dashboard/cart">View cart <ArrowRight size={14} /></Link>} />
      <section className="marketplace-controls" aria-label="Search and filter products">
        <form className="marketplace-search" onSubmit={submitSearch} role="search">
          <input aria-label="Search products" id="marketplace-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or ingredients" />
          <button className="button button--primary" type="submit"><Search size={15} /> Search</button>
        </form>
        <label className="marketplace-filter">Category
          <select value={category} onChange={(event) => { beginProductRequest(); setCategory(event.target.value); setPage(1) }}>
            <option value="All">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="marketplace-filter">Sort by
          <select value={ordering} onChange={(event) => { beginProductRequest(); setOrdering(event.target.value); setPage(1) }}>
            <option value="featured">Featured</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </section>
      {categoryError && <div className="marketplace-inline-error" role="alert"><span>{categoryError}</span><button type="button" onClick={() => setCategoryRetryCount((value) => value + 1)}>Retry categories</button></div>}
      {loading
        ? <IntegrationState state="loading" title="Loading products" description="Fetching the latest published catalogue." />
        : error
          ? <section className="dashboard-panel marketplace-state" role="alert"><h2>Products could not be loaded</h2><p>{error}</p><button className="button button--primary" type="button" onClick={() => { beginProductRequest(); setRetryCount((value) => value + 1) }}>Retry</button></section>
          : products.length
            ? <>
              <div className="marketplace-product-grid" aria-label="Products">
                {products.map((product) => <MarketplaceProductCard key={product.id} product={product} />)}
              </div>
              {pageData && <nav className="marketplace-pagination" aria-label="Product pages">
                <button className="button button--outline" type="button" disabled={!pageData.hasPrevious} onClick={() => { beginProductRequest(); setPage((value) => Math.max(1, value - 1)) }}><ChevronLeft size={15} /> Previous</button>
                <span>Page {pageData.page} of {pageData.totalPages} · {pageData.count} products</span>
                <button className="button button--outline" type="button" disabled={!pageData.hasNext} onClick={() => { beginProductRequest(); setPage((value) => value + 1) }}>Next <ChevronRight size={15} /></button>
              </nav>}
            </>
            : <section className="dashboard-panel marketplace-state" role="status"><h2>{hasActiveFilters ? 'No matching products' : 'No products available yet'}</h2><p>{hasActiveFilters ? 'Try a different search or category.' : 'Published products will appear here when available.'}</p>{hasActiveFilters && <button className="button button--outline" type="button" onClick={() => { beginProductRequest(); setSearch(''); setQuery(''); setCategory('All'); setPage(1) }}>Clear filters</button>}</section>}
    </>
  )
}

export function OrdersPage() {
  return (
    <>
      <PageTitle eyebrow="Your account" title="My orders" description="Order history will be available after account and commerce services are connected." />
      <IntegrationState icon={Package} title="Order history unavailable" description="No orders are loaded or created by this frontend." />
    </>
  )
}

export function OrderDetailsPage() {
  return (
    <>
      <PageTitle eyebrow="Your account" title="Order details" description="Order details will be available after account and commerce services are connected." />
      <IntegrationState icon={Package} title="Order details unavailable" description="No order record is loaded or created by this frontend." />
    </>
  )
}

export function NotificationsPage() {
  return (
    <>
      <PageTitle eyebrow="Your account" title="Notifications" description="Account and service notifications will appear here when the notification service is connected." />
      <IntegrationState icon={Bell} title="Notifications unavailable" description="No notifications have been generated or marked as read." />
    </>
  )
}

export function SettingsPage() {
  const [preferences, setPreferences] = useState({ emailUpdates: false, reminders: false })
  const [status, setStatus] = useState('')

  function updatePreference(event) {
    const { name, checked } = event.target
    setPreferences((current) => ({ ...current, [name]: checked }))
    setStatus('')
  }

  return (
    <>
      <PageTitle eyebrow="Your account" title="Settings" description="Manage account and communication preferences." />
      <section className="dashboard-panel settings-panel">
        <div className="settings-section-heading"><span><Settings size={17} /></span><div><h2>Communication preferences</h2><p>Changes are not saved until account services are connected.</p></div></div>
        <label className="settings-option"><span><strong>Product and platform updates</strong><small>Optional updates about the NutraAI platform.</small></span><input name="emailUpdates" type="checkbox" checked={preferences.emailUpdates} onChange={updatePreference} /></label>
        <label className="settings-option"><span><strong>Wellness routine reminders</strong><small>Optional reminders for self-selected routines.</small></span><input name="reminders" type="checkbox" checked={preferences.reminders} onChange={updatePreference} /></label>
        <div className="settings-actions"><button className="button button--primary" type="button" onClick={() => setStatus('Settings service is unavailable. Your preferences have not been saved.')}>Save preferences <Check size={14} /></button>{status && <span role="status" className="form-status">{status}</span>}</div>
      </section>
    </>
  )
}
