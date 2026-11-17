import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Camera, Check, ChevronLeft, ChevronRight, Package, Search, Settings, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  addToCart,
  cancelOrder,
  getErrorMessage,
  getFieldErrors,
  getOrder,
  getPreferences,
  getProfile,
  getProfileOptions,
  getWellnessPlan,
  listCategories,
  listNotifications,
  listOrders,
  listProducts,
  markAllNotificationsRead,
  markNotificationRead,
  removeAvatar,
  saveConsent,
  updatePreferences,
  updateProfile,
  uploadAvatar,
} from '../services/apiBackend/index.js'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <header className="dashboard-page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  )
}

export function HealthProfilePage() {
  const { isPreviewMode, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [values, setValues] = useState({ name: '', email: '', phone: '', dateOfBirth: '', gender: '' })
  const [options, setOptions] = useState({ genders: [] })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [picture, setPicture] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    Promise.allSettled([getProfile(), getProfileOptions()])
      .then(([profileRes, optionsRes]) => {
        if (!active) return
        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value
          setValues({ name: p.name || '', email: p.email || '', phone: p.phone || '', dateOfBirth: p.dateOfBirth || '', gender: p.gender || '' })
          setPicture(p.avatarUrl || '')
        } else {
          setError(getErrorMessage(profileRes.reason, 'Could not load your profile.'))
        }
        if (optionsRes.status === 'fulfilled') setOptions(optionsRes.value)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setStatus('')
  }

  async function selectPicture(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (isPreviewMode) { setStatus('Profile pictures cannot be uploaded in preview mode.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setStatus('Choose a JPG, PNG, or WebP image.'); return }
    if (file.size > 5 * 1024 * 1024) { setStatus('Choose an image that is 5 MB or smaller.'); return }
    setAvatarBusy(true)
    setStatus('')
    try {
      const updated = await uploadAvatar(file)
      setPicture(updated.avatarUrl || '')
      await refreshProfile()
      setStatus('Profile picture updated.')
    } catch (e) {
      setStatus(getErrorMessage(e, 'Could not upload the picture.'))
    } finally {
      setAvatarBusy(false)
    }
  }

  async function removePicture() {
    if (isPreviewMode) { setStatus('Profile pictures cannot be changed in preview mode.'); return }
    setAvatarBusy(true)
    setStatus('')
    try {
      await removeAvatar()
      setPicture('')
      await refreshProfile()
      setStatus('Profile picture removed.')
    } catch (e) {
      setStatus(getErrorMessage(e, 'Could not remove the picture.'))
    } finally {
      setAvatarBusy(false)
    }
  }

  async function submitProfile(event) {
    event.preventDefault()
    setStatus('')
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Enter your full name.'
    if (!values.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!event.currentTarget.elements.email.validity.valid) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (isPreviewMode) { setStatus('Profile changes are not saved in preview mode.'); return }
    setSaving(true)
    try {
      const payload = { name: values.name.trim(), phone: values.phone, dateOfBirth: values.dateOfBirth, gender: values.gender }
      const updated = await updateProfile(payload)
      setValues({ name: updated.name || '', email: updated.email || values.email, phone: updated.phone || '', dateOfBirth: updated.dateOfBirth || '', gender: updated.gender || '' })
      setPicture(updated.avatarUrl || '')
      await refreshProfile()
      saveConsent('terms_privacy', true).catch(() => {})
      setStatus('Profile saved.')
    } catch (e) {
      const fieldErrors = getFieldErrors(e)
      setErrors(fieldErrors)
      setStatus(fieldErrors.form || getErrorMessage(e, 'Could not save your profile.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><PageTitle eyebrow="Your information, your choice" title="My health profile" description="Review and update your account details." /><IntegrationState state="loading" title="Loading profile" description="Fetching your account information." /></>
  if (error) return <><PageTitle eyebrow="Your information, your choice" title="My health profile" description="Review and update your account details." /><section className="dashboard-panel" role="alert"><p>{error}</p></section></>

  const genderOptions = options.genders?.length ? options.genders : [
    { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'other', label: 'Other' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]

  return (
    <>
      <PageTitle eyebrow="Your information, your choice" title="My health profile" description="Review and update your account details and preferences." />
      <section className="dashboard-panel basic-profile-panel" id="basic-information">
        <div className="panel-heading"><div><span className="eyebrow">Account details</span><h2>Basic information</h2></div></div>
        <p className="basic-profile-intro">{isPreviewMode ? 'Preview mode: changes are not saved and no account data is loaded.' : 'Your profile information is stored in your account.'}</p>
        <div className="basic-profile-picture">
          {picture ? <img className="profile-avatar profile-avatar--large" src={picture} alt="Profile" /> : <span className="profile-avatar profile-avatar--large" aria-hidden="true">{(values.name || '?').slice(0, 1).toUpperCase()}</span>}
          <div className="basic-profile-picture__actions">
            <strong>Profile picture</strong><small>JPG, PNG, or WebP - up to 5 MB</small>
            <div>
              <label className="button button--outline basic-profile-upload"><Camera size={14} /> {avatarBusy ? 'Working…' : 'Choose image'}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectPicture} disabled={avatarBusy} /></label>
              {picture && <button className="basic-profile-remove" type="button" onClick={removePicture} disabled={avatarBusy}><Trash2 size={13} /> Remove</button>}
            </div>
          </div>
        </div>
        <form className="basic-profile-form" onSubmit={submitProfile} noValidate>
          <label>Full name<input name="name" autoComplete="name" value={values.name} onChange={updateField} aria-invalid={Boolean(errors.name)} />{errors.name && <span className="auth-field-error" role="alert">{errors.name}</span>}</label>
          <label>Email address<input name="email" type="email" autoComplete="email" value={values.email} readOnly disabled /><small>Contact account settings to change your login email.</small></label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={updateField} aria-invalid={Boolean(errors.phone)} />{errors.phone && <span className="auth-field-error" role="alert">{errors.phone}</span>}</label>
          <label>Date of birth<input name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={updateField} aria-invalid={Boolean(errors.dateOfBirth)} />{errors.dateOfBirth && <span className="auth-field-error" role="alert">{errors.dateOfBirth}</span>}</label>
          <label>Gender<select name="gender" value={values.gender} onChange={updateField}><option value="">Select an option</option>{genderOptions.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select></label>
          <div className="basic-profile-form__actions"><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <Check size={14} /></button></div>
          {status && <p className="form-status basic-profile-form__status" role="status">{status}</p>}
        </form>
      </section>
      <p className="dashboard-disclaimer">Avoid entering sensitive medical records. Share only information you are comfortable storing in your account.</p>
    </>
  )
}

export function WellnessPlanPage() {
  const { isPreviewMode } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getWellnessPlan()
      .then((data) => { if (active) setPlan(data) })
      .catch((e) => { if (active) setError(getErrorMessage(e, 'No wellness plan available yet.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  return (
    <>
      <PageTitle eyebrow="Your wellness journey" title="My wellness plan" description="A plan based on your latest assessment goals." />
      {isPreviewMode ? <IntegrationState title="Preview mode" description="Sign in to view your personal wellness plan." /> : loading ? <IntegrationState state="loading" title="Loading plan" description="Fetching your wellness plan." /> : error ? <IntegrationState title="No wellness plan available" description={error} /> : (
        <section className="dashboard-panel">
          <h2>Plan steps</h2>
          {plan?.steps?.length ? <ul className="settings-list">{plan.steps.map((step, i) => <li key={i}>{step}</li>)}</ul> : <p>No steps available yet.</p>}
          {plan?.note && <p className="dashboard-disclaimer">{plan.note}</p>}
        </section>
      )}
      <div className="wellness-plan-actions">
        <Link className="button button--outline" to="/dashboard/assessment">Health assessment <ArrowRight size={14} /></Link>
        <Link className="button button--outline" to="/dashboard/progress">Progress tracking <ArrowRight size={14} /></Link>
      </div>
    </>
  )
}

function MarketplaceProductCard({ product, onAdd, adding }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className="marketplace-card">
      <Link className="marketplace-card__image" to={'/products/' + encodeURIComponent(product.slug)} aria-label={'View ' + product.name + ' details'}>
        {product.image && !imageFailed ? <img src={product.image} alt={product.imageAlt || product.name} loading="lazy" onError={() => setImageFailed(true)} /> : <span role="img" aria-label="Product image unavailable"><Package size={30} aria-hidden="true" /></span>}
      </Link>
      <div className="marketplace-card__content">
        <div className="marketplace-card__meta">
          <span>{product.category || 'Wellness'}</span>
          <span className={product.inStock ? 'is-in-stock' : 'is-out-of-stock'}>{product.inStock ? (product.lowStock ? 'Low stock' : 'In stock') : 'Out of stock'}</span>
        </div>
        <h2><Link to={'/products/' + encodeURIComponent(product.slug)}>{product.name}</Link></h2>
        {product.description && <p>{product.description}</p>}
        <div className="marketplace-card__price">
          <strong>{product.price === null ? 'Price unavailable' : money.format(product.price)}</strong>
          {product.mrp !== null && product.price !== null && product.mrp > product.price && <del>{money.format(product.mrp)}</del>}
          {product.discountPercent > 0 && <span>{product.discountPercent}% off</span>}
        </div>
        <div className="marketplace-card__actions">
          <Link className="button button--outline marketplace-card__details" to={'/products/' + encodeURIComponent(product.slug)}>Details <ArrowRight size={14} /></Link>
          <button className="button button--primary" type="button" disabled={!product.inStock || adding} onClick={() => onAdd(product)}>{adding ? 'Adding…' : 'Add to cart'}</button>
        </div>
      </div>
    </article>
  )
}

export function MarketplacePage() {
  const { isPreviewMode, refreshCartCount } = useAuth()
  const [products, setProducts] = useState([])
  const [pageData, setPageData] = useState(null)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [ordering, setOrdering] = useState('featured')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [addingId, setAddingId] = useState(null)
  const [cartStatus, setCartStatus] = useState('')

  useEffect(() => {
    let active = true
    listCategories().then((items) => { if (active) setCategories(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const result = await listProducts({ search: query, category, ordering, page, pageSize: 12 })
        if (active) { setProducts(result.results); setPageData(result); setError('') }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'The catalogue could not be loaded.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [query, category, ordering, page, retryCount])

  async function handleAdd(product) {
    if (isPreviewMode) { setCartStatus('Sign in to add products to your cart.'); return }
    setAddingId(product.id); setCartStatus('')
    try {
      const cart = await addToCart(product.id, 1)
      if (typeof cart?.itemCount === 'number') { /* count updated via context */ }
      await refreshCartCount()
      setCartStatus(product.name + ' added to your cart.')
    } catch (e) {
      setCartStatus(getErrorMessage(e, 'Could not add this product to your cart.'))
    } finally {
      setAddingId(null)
    }
  }

  function submitSearch(event) {
    event.preventDefault()
    setPage(1); setLoading(true); setQuery(search.trim())
  }

  return (
    <>
      <PageTitle eyebrow="Product catalogue" title="Products & marketplace" description="Browse published products from the NutraAI catalogue." action={<Link className="button button--outline" to="/dashboard/cart">View cart <ArrowRight size={14} /></Link>} />
      <section className="marketplace-controls" aria-label="Search and filter products">
        <form className="marketplace-search" onSubmit={submitSearch} role="search">
          <input aria-label="Search products" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or ingredients" />
          <button className="button button--primary" type="submit"><Search size={15} /> Search</button>
        </form>
        <label className="marketplace-filter">Category
          <select value={category} onChange={(event) => { setLoading(true); setCategory(event.target.value); setPage(1) }}>
            <option value="All">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="marketplace-filter">Sort by
          <select value={ordering} onChange={(event) => { setLoading(true); setOrdering(event.target.value); setPage(1) }}>
            <option value="featured">Featured</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </section>
      {cartStatus && <p className="form-status" role="status">{cartStatus}</p>}
      {loading
        ? <IntegrationState state="loading" title="Loading products" description="Fetching the latest published catalogue." />
        : error
          ? <section className="dashboard-panel marketplace-state" role="alert"><h2>Products could not be loaded</h2><p>{error}</p><button className="button button--primary" type="button" onClick={() => { setLoading(true); setRetryCount((v) => v + 1) }}>Retry</button></section>
          : products.length
            ? <>
              <div className="marketplace-product-grid" aria-label="Products">
                {products.map((product) => <MarketplaceProductCard key={product.id} product={product} onAdd={handleAdd} adding={addingId === product.id} />)}
              </div>
              {pageData && <nav className="marketplace-pagination" aria-label="Product pages">
                <button className="button button--outline" type="button" disabled={!pageData.hasPrevious} onClick={() => { setLoading(true); setPage((v) => Math.max(1, v - 1)) }}><ChevronLeft size={15} /> Previous</button>
                <span>Page {pageData.page} of {pageData.totalPages} - {pageData.count} products</span>
                <button className="button button--outline" type="button" disabled={!pageData.hasNext} onClick={() => { setLoading(true); setPage((v) => v + 1) }}>Next <ChevronRight size={15} /></button>
              </nav>}
            </>
            : <section className="dashboard-panel marketplace-state" role="status"><h2>{query || category !== 'All' ? 'No matching products' : 'No products available yet'}</h2><p>{query || category !== 'All' ? 'Try a different search or category.' : 'Published products will appear here when available.'}</p></section>}
    </>
  )
}

export function OrdersPage() {
  const { isPreviewMode } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    listOrders({ pageSize: 20 }).then((data) => { if (active) setOrders(data.results) }).catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load orders.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])
  if (isPreviewMode) return <><PageTitle eyebrow="Your account" title="My orders" description="Order history will be available after you sign in." /><IntegrationState icon={Package} title="Preview mode" description="Sign in to view your order history." /></>
  if (loading) return <><PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." /><IntegrationState state="loading" title="Loading orders" description="Fetching your order history." /></>
  if (error) return <><PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." /><section className="dashboard-panel" role="alert"><p>{error}</p></section></>
  if (!orders.length) return <><PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." /><IntegrationState icon={Package} title="No orders yet" description="Orders you place will appear here." /></>
  return (
    <>
      <PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." />
      <div className="dashboard-panel">
        <div className="marketplace-product-grid">
          {orders.map((o) => (
            <article className="marketplace-card" key={o.number}>
              <div className="marketplace-card__content">
                <div className="marketplace-card__meta"><span>{o.statusLabel || o.status}</span><span>{o.itemCount} item(s)</span></div>
                <h2>Order {o.number}</h2>
                <p>Placed {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</p>
                <div className="marketplace-card__price"><strong>{o.total != null ? money.format(o.total) : ''}</strong></div>
                <Link className="button button--outline" to={'/dashboard/orders/' + encodeURIComponent(o.number)}>View details <ArrowRight size={14} /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}

export function OrderDetailsPage() {
  const { isPreviewMode } = useAuth()
  const { orderId } = useParams()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getOrder(orderId).then((data) => { if (active) setOrder(data) }).catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load this order.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode, orderId])

  async function onCancel() {
    if (!order || busy) return
    setBusy(true); setStatus('')
    try { const updated = await cancelOrder(order.number); setOrder(updated); setStatus('Order cancelled.') }
    catch (e) { setStatus(getErrorMessage(e, 'Could not cancel this order.')) }
    finally { setBusy(false) }
  }

  if (isPreviewMode) return <><PageTitle eyebrow="Your account" title="Order details" description="Order details require an account." /><IntegrationState icon={Package} title="Preview mode" description="Sign in to view order details." /></>
  if (loading) return <><PageTitle eyebrow="Your account" title="Order details" description="Loading your order." /><IntegrationState state="loading" title="Loading order" description="Fetching order details." /></>
  if (error) return <><PageTitle eyebrow="Your account" title="Order details" description="Order details." /><section className="dashboard-panel" role="alert"><p>{error}</p><Link className="text-link" to="/dashboard/orders">Back to orders</Link></section></>
  if (!order) return null
  return (
    <>
      <PageTitle eyebrow="Your account" title={'Order ' + order.number} description={'Status: ' + (order.statusLabel || order.status)} action={<Link className="button button--outline" to="/dashboard/orders"><ChevronLeft size={14} /> Back to orders</Link>} />
      <section className="dashboard-panel">
        <h2>Items</h2>
        <ul className="settings-list">{(order.items || []).map((it, i) => <li key={i}><strong>{it.name}</strong> × {it.quantity} - {it.lineTotal != null ? money.format(it.lineTotal) : ''}</li>)}</ul>
        <p><strong>Subtotal:</strong> {order.subtotal != null ? money.format(order.subtotal) : '-'} - <strong>Shipping:</strong> {order.shippingFee != null ? money.format(order.shippingFee) : '-'} - <strong>Total:</strong> {order.total != null ? money.format(order.total) : '-'}</p>
        {order.shippingAddress && <p><strong>Shipping to:</strong> {order.shippingAddress.name}, {order.shippingAddress.line1}{order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>}
        {order.trackingNote && <p><strong>Tracking:</strong> {order.trackingNote}</p>}
        {order.events?.length ? <><h3>Timeline</h3><ul className="settings-list">{order.events.map((e, i) => <li key={i}>{e.status} {e.at ? ('(' + new Date(e.at).toLocaleString() + ')') : ''} {e.note ? ('- ' + e.note) : ''}</li>)}</ul></> : null}
        {(order.status === 'pending_payment' || order.status === 'created') && <div className="settings-actions"><button className="button button--outline" type="button" disabled={busy} onClick={onCancel}>{busy ? 'Cancelling…' : 'Cancel order'}</button></div>}
        {status && <p className="form-status" role="status">{status}</p>}
        <p className="dashboard-disclaimer">Online payment capture requires configured payment credentials. If payment was not completed, you can cancel an unpaid order here.</p>
      </section>
    </>
  )
}

export function NotificationsPage() {
  const { isPreviewMode } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    listNotifications({ page: 1, pageSize: 50 })
      .then((data) => { if (active) setItems(data.results) })
      .catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load notifications.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  async function markRead(id) {
    if (busy) return
    setBusy(true)
    try { await markNotificationRead(id); const data = await listNotifications({ page: 1, pageSize: 50 }); setItems(data.results) } catch (e) { setError(getErrorMessage(e)) } finally { setBusy(false) }
  }
  async function markAll() {
    if (busy) return
    setBusy(true)
    try { await markAllNotificationsRead(); const data = await listNotifications({ page: 1, pageSize: 50 }); setItems(data.results) } catch (e) { setError(getErrorMessage(e)) } finally { setBusy(false) }
  }

  if (isPreviewMode) return <><PageTitle eyebrow="Your account" title="Notifications" description="Notifications require an account." /><IntegrationState icon={Bell} title="Preview mode" description="Sign in to view your notifications." /></>
  if (loading) return <><PageTitle eyebrow="Your account" title="Notifications" description="Your notifications." /><IntegrationState state="loading" title="Loading notifications" description="Fetching notifications." /></>
  if (error) return <><PageTitle eyebrow="Your account" title="Notifications" description="Your notifications." /><section className="dashboard-panel" role="alert"><p>{error}</p></section></>
  return (
    <>
      <PageTitle eyebrow="Your account" title="Notifications" description="Account and service notifications." action={items.length ? <button className="button button--outline" type="button" onClick={markAll} disabled={busy}>Mark all read</button> : null} />
      {!items.length ? <IntegrationState icon={Bell} title="No notifications" description="You're all caught up." /> : (
        <section className="dashboard-panel">
          <ul className="settings-list">
            {items.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong> {n.read ? '' : <em>(unread)</em>}
                {n.body && <div>{n.body}</div>}
                <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                {!n.read && <button className="text-link" type="button" onClick={() => markRead(n.id)} disabled={busy}>Mark read</button>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

export function SettingsPage() {
  const { isPreviewMode } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [preferences, setPreferences] = useState({ emailUpdates: false, reminders: false, reminderTime: '', reminderChannel: '' })
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getPreferences().then((data) => { if (active) setPreferences({ emailUpdates: !!data.emailUpdates, reminders: !!data.reminders, reminderTime: data.reminderTime || '', reminderChannel: data.reminderChannel || '' }) }).catch(() => {}).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  function updatePreference(event) {
    const { name, type, checked, value } = event.target
    setPreferences((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setStatus('')
  }

  async function save() {
    if (isPreviewMode) { setStatus('Preferences are not saved in preview mode.'); return }
    setSaving(true); setStatus('')
    try {
      await updatePreferences(preferences)
      setStatus('Preferences saved.')
    } catch (e) {
      setStatus(getErrorMessage(e, 'Could not save preferences.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><PageTitle eyebrow="Your account" title="Settings" description="Manage account and communication preferences." /><IntegrationState state="loading" title="Loading settings" description="Fetching your preferences." /></>

  return (
    <>
      <PageTitle eyebrow="Your account" title="Settings" description="Manage account and communication preferences." />
      <section className="dashboard-panel settings-panel">
        <div className="settings-section-heading"><span><Settings size={17} /></span><div><h2>Communication preferences</h2><p>{isPreviewMode ? 'Preview mode: changes are not saved.' : 'Changes are saved to your account.'}</p></div></div>
        <label className="settings-option"><span><strong>Product and platform updates</strong><small>Optional updates about the NutraAI platform.</small></span><input name="emailUpdates" type="checkbox" checked={preferences.emailUpdates} onChange={updatePreference} /></label>
        <label className="settings-option"><span><strong>Wellness routine reminders</strong><small>Optional reminders for self-selected routines.</small></span><input name="reminders" type="checkbox" checked={preferences.reminders} onChange={updatePreference} /></label>
        <label>Reminder time<input name="reminderTime" type="time" value={preferences.reminderTime} onChange={updatePreference} /></label>
        <label>Reminder channel<select name="reminderChannel" value={preferences.reminderChannel} onChange={updatePreference}><option value="">No preference</option><option value="email">Email</option><option value="sms">SMS</option><option value="push">Push notification</option></select></label>
        <div className="settings-actions"><button className="button button--primary" type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save preferences'} <Check size={14} /></button>{status && <span role="status" className="form-status">{status}</span>}</div>
      </section>
    </>
  )
}
