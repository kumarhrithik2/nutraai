import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, Camera, Check, ChevronLeft, ChevronRight, CircleAlert, Clock3, CreditCard, MapPin, Minus, Package, Plus, Search, Trash2, Truck, CheckCircle2, PackageCheck, ClipboardCheck, BadgeCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import {
  addToCart,
  archiveOrder,
  cancelOrder,
  changeEmail,
  changePassword,
  deleteAccount,
  getConsents,
  getErrorMessage,
  getFieldErrors,
  getMembership,
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
  removeCartItem,
  saveConsent,
  updateCartItem,
  updatePreferences,
  updateProfile,
  uploadAvatar,
} from '../services/apiBackend/index.js'
import { formatMembershipPrice, membershipPlans } from '../services/membershipPlans.js'

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
              <label className="button button--outline basic-profile-upload"><Camera size={14} /> {avatarBusy ? 'Workingâ€¦' : 'Choose image'}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectPicture} disabled={avatarBusy} /></label>
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
          <div className="basic-profile-form__actions"><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Savingâ€¦' : 'Save changes'} <Check size={14} /></button></div>
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
              </div>
    </>
  )
}

function MarketplaceProductCard({ product, quantity, busy, error, onAdd, onIncrease, onDecrease }) {
  const [imageFailed, setImageFailed] = useState(false)
  const maxStock = typeof product.stock === 'number' ? product.stock : (product.inStock ? null : 0)
  const canAdd = product.inStock && (maxStock === null || maxStock > 0)
  const canIncrease = !busy && canAdd && (maxStock === null || quantity < maxStock)

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
          {quantity > 0 ? (
            <div className="cart-qty marketplace-card__qty" aria-label={'Quantity for ' + product.name}>
              <button type="button" onClick={() => onDecrease(product)} disabled={busy} aria-label={'Decrease quantity for ' + product.name}><Minus size={14} /></button>
              <span aria-live="polite">{busy ? 'â€¦' : quantity}</span>
              <button type="button" onClick={() => onIncrease(product)} disabled={!canIncrease} aria-label={'Increase quantity for ' + product.name}><Plus size={14} /></button>
            </div>
          ) : (
            <button className="button button--primary" type="button" disabled={!canAdd || busy} onClick={() => onAdd(product)}>{busy ? 'Addingâ€¦' : 'Add to cart'}</button>
          )}
        </div>
        {error ? <p className="form-status marketplace-card__status" role="alert">{error}</p> : null}
        {quantity > 0 && maxStock !== null && quantity >= maxStock ? <p className="form-status marketplace-card__status" role="status">Maximum available quantity reached.</p> : null}
      </div>
    </article>
  )
}

export function MarketplacePage() {
  const { isPreviewMode, cart, refreshCart, applyCart } = useAuth()
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
  const [busyIds, setBusyIds] = useState({})
  const [itemErrors, setItemErrors] = useState({})

  const quantityByProductId = useMemo(() => {
    const map = {}
    for (const item of cart?.items || []) {
      if (item?.product?.id != null) map[item.product.id] = item.quantity || 0
    }
    return map
  }, [cart])

  useEffect(() => {
    if (!isPreviewMode) refreshCart()
  }, [isPreviewMode, refreshCart])

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

  function setBusy(productId, busy) {
    setBusyIds((current) => ({ ...current, [productId]: busy }))
  }

  function setItemError(productId, message) {
    setItemErrors((current) => ({ ...current, [productId]: message }))
  }

  function buildOptimisticCart(productId, desiredQty) {
    const previous = cart || { items: [], itemCount: 0, subtotal: 0, shippingFee: 0, total: 0, freeShippingRemaining: null }
    let items = (previous.items || []).map((item) => ({ ...item, product: { ...item.product } }))
    const index = items.findIndex((item) => item.product?.id === productId)
    if (desiredQty <= 0) {
      if (index !== -1) items = items.filter((item) => item.product?.id !== productId)
    } else if (index !== -1) {
      items[index] = { ...items[index], quantity: desiredQty }
    } else {
      const product = products.find((p) => p.id === productId)
      if (product) items = [...items, { product: { ...product }, quantity: desiredQty, unitPrice: product.price, lineTotal: null, available: product.inStock }]
    }
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    return { ...previous, items, itemCount }
  }

  async function changeQuantity(product, desiredQty) {
    if (isPreviewMode) { setItemError(product.id, 'Sign in to manage your cart.'); return }
    if (busyIds[product.id]) return
    const currentQty = quantityByProductId[product.id] || 0
    const maxStock = typeof product.stock === 'number' ? product.stock : null
    if (desiredQty > 0 && maxStock !== null && desiredQty > maxStock) {
      setItemError(product.id, `Only ${maxStock} available in stock.`)
      return
    }
    if (desiredQty > 0 && !product.inStock) {
      setItemError(product.id, 'This product is currently unavailable.')
      return
    }

    const previousCart = cart
    setItemError(product.id, '')
    setBusy(product.id, true)
    applyCart(buildOptimisticCart(product.id, desiredQty))
    try {
      let nextCart
      if (desiredQty <= 0) {
        nextCart = await removeCartItem(product.id)
      } else if (currentQty <= 0) {
        nextCart = await addToCart(product.id, desiredQty)
      } else if (desiredQty === currentQty + 1) {
        nextCart = await addToCart(product.id, 1)
      } else {
        nextCart = await updateCartItem(product.id, desiredQty)
      }
      applyCart(nextCart)
    } catch (e) {
      applyCart(previousCart || null)
      setItemError(product.id, getErrorMessage(e, 'Could not update your cart.'))
      refreshCart()
    } finally {
      setBusy(product.id, false)
    }
  }

  function handleAdd(product) {
    return changeQuantity(product, 1)
  }

  function handleIncrease(product) {
    const qty = quantityByProductId[product.id] || 0
    return changeQuantity(product, qty + 1)
  }

  function handleDecrease(product) {
    const qty = quantityByProductId[product.id] || 0
    return changeQuantity(product, qty - 1)
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
      {loading
        ? <IntegrationState state="loading" title="Loading products" description="Fetching the latest published catalogue." />
        : error
          ? <section className="dashboard-panel marketplace-state" role="alert"><h2>Products could not be loaded</h2><p>{error}</p><button className="button button--primary" type="button" onClick={() => { setLoading(true); setRetryCount((v) => v + 1) }}>Retry</button></section>
          : products.length
            ? <>
              <div className="marketplace-product-grid" aria-label="Products">
                {products.map((product) => (
                  <MarketplaceProductCard
                    key={product.id}
                    product={product}
                    quantity={quantityByProductId[product.id] || 0}
                    busy={Boolean(busyIds[product.id])}
                    error={itemErrors[product.id] || ''}
                    onAdd={handleAdd}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                  />
                ))}
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

function orderDeleteInfo(order) {
  switch (order?.status) {
    case 'cancelled':
      return { canDelete: true, reason: '' }
    case 'pending_payment':
    case 'created':
      return { canDelete: false, reason: 'Orders awaiting payment cannot be deleted. Cancel the order first if you no longer need it.' }
    case 'paid':
      return { canDelete: false, reason: 'Paid orders cannot be deleted because payment has been completed.' }
    case 'processing':
      return { canDelete: false, reason: 'Orders being processed cannot be deleted.' }
    case 'shipped':
      return { canDelete: false, reason: 'Shipped orders cannot be deleted because fulfillment is in progress.' }
    case 'delivered':
      return { canDelete: false, reason: 'Delivered orders cannot be deleted because the order is finalized.' }
    case 'refund_required':
      return { canDelete: false, reason: 'Orders requiring refund review cannot be deleted.' }
    default:
      return { canDelete: false, reason: 'This order cannot be deleted.' }
  }
}

export function OrdersPage() {
  const { isPreviewMode } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [deletingNumber, setDeletingNumber] = useState('')
  const [deleteErrors, setDeleteErrors] = useState({})

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    listOrders({ pageSize: 20 })
      .then((data) => { if (active) setOrders(data.results) })
      .catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load orders.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  async function onDelete(order) {
    const info = orderDeleteInfo(order)
    if (!info.canDelete || deletingNumber) return
    const confirmed = window.confirm(`Delete order ${order.number} from your orders list? This removes it from your view but does not affect admin records, payment history, or inventory records.`)
    if (!confirmed) return
    setDeletingNumber(order.number)
    setDeleteErrors((current) => ({ ...current, [order.number]: '' }))
    const previous = orders
    setOrders((current) => current.filter((o) => o.number !== order.number))
    try {
      await archiveOrder(order.number)
    } catch (e) {
      setOrders(previous)
      setDeleteErrors((current) => ({ ...current, [order.number]: getErrorMessage(e, 'Could not delete this order.') }))
    } finally {
      setDeletingNumber('')
    }
  }

  if (isPreviewMode) return <><PageTitle eyebrow="Your account" title="My orders" description="Order history will be available after you sign in." /><IntegrationState icon={Package} title="Preview mode" description="Sign in to view your order history." /></>
  if (loading) return <><PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." /><IntegrationState state="loading" title="Loading orders" description="Fetching your order history." /></>
  if (error) return <><PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." /><section className="dashboard-panel" role="alert"><p>{error}</p></section></>
  if (!orders.length) return <><PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." /><IntegrationState icon={Package} title="No orders yet" description="Orders you place will appear here." /></>

  return (
    <>
      <PageTitle eyebrow="Your account" title="My orders" description="Your recent orders." />
      <div className="dashboard-panel">
        <div className="marketplace-product-grid">
          {orders.map((o) => {
            const info = orderDeleteInfo(o)
            const deleting = deletingNumber === o.number
            return (
              <article className="marketplace-card" key={o.number}>
                <div className="marketplace-card__content">
                  <div className="marketplace-card__meta"><span>{o.statusLabel || o.status}</span><span>{o.itemCount} item(s)</span></div>
                  <h2>Order {o.number}</h2>
                  <p>Placed {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</p>
                  <div className="marketplace-card__price"><strong>{o.total != null ? money.format(o.total) : ''}</strong></div>
                  <div className="marketplace-card__actions" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link className="button button--outline" to={'/dashboard/orders/' + encodeURIComponent(o.number)}>View details <ArrowRight size={14} /></Link>
                    <button className="button button--outline" type="button" onClick={() => onDelete(o)} disabled={!info.canDelete || Boolean(deletingNumber)} aria-disabled={!info.canDelete || Boolean(deletingNumber)}>
                      {deleting ? 'Deletingâ€¦' : 'Delete order'}
                    </button>
                  </div>
                  {!info.canDelete ? <p className="form-status" role="status" style={{ marginTop: 8 }}>{info.reason}</p> : null}
                  {deleteErrors[o.number] ? <p className="form-status" role="alert" style={{ marginTop: 8 }}>{deleteErrors[o.number]}</p> : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </>
  )
}

const TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: ClipboardCheck },
  { key: 'confirmed', label: 'Confirmed', icon: BadgeCheck },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: PackageCheck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

const STATUS_RANK = {
  pending_payment: 0,
  created: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 5,
}

function formatOrderDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatMoneyValue(value) {
  return value == null ? '-' : money.format(value)
}

function firstEventTime(events, matcher) {
  const found = (events || []).find(matcher)
  return found?.at || ''
}

function buildTracking(order) {
  const events = order.events || []
  const status = order.status || ''
  const rank = STATUS_RANK[status] ?? -1
  const placedAt = order.createdAt || firstEventTime(events, (e) => e.status === 'pending_payment' || e.status === 'created' || /placed/i.test(e.note || ''))
  const confirmedAt = status === 'cancelled' ? '' : (order.paidAt || firstEventTime(events, (e) => e.status === 'paid'))
  const processingAt = firstEventTime(events, (e) => e.status === 'processing')
  const shippedAt = firstEventTime(events, (e) => e.status === 'shipped')
  const deliveredAt = firstEventTime(events, (e) => e.status === 'delivered')
  const inTransitAt = firstEventTime(events, (e) => e.status === 'in_transit' || /in transit/i.test(`${e.status || ''} ${e.note || ''}`))

  const times = {
    placed: placedAt,
    confirmed: confirmedAt,
    processing: processingAt,
    shipped: shippedAt,
    in_transit: inTransitAt,
    delivered: deliveredAt,
  }

  const completed = {
    placed: Boolean(placedAt) || rank >= 0,
    confirmed: Boolean(confirmedAt) || ['paid', 'processing', 'shipped', 'delivered'].includes(status),
    processing: Boolean(processingAt) || ['processing', 'shipped', 'delivered'].includes(status),
    shipped: Boolean(shippedAt) || ['shipped', 'delivered'].includes(status),
    in_transit: Boolean(inTransitAt) || status === 'delivered',
    delivered: Boolean(deliveredAt) || status === 'delivered',
  }

  if (status === 'cancelled' || status === 'refund_required') {
    return {
      mode: status,
      steps: TRACKING_STEPS.map((step) => ({
        ...step,
        state: completed[step.key] ? 'completed' : 'pending',
        time: times[step.key],
      })),
    }
  }

  let currentKey = 'placed'
  if (status === 'pending_payment' || status === 'created') currentKey = 'placed'
  else if (status === 'paid') currentKey = 'processing'
  else if (status === 'processing') currentKey = 'processing'
  else if (status === 'shipped') currentKey = inTransitAt ? 'in_transit' : 'shipped'
  else if (status === 'delivered') currentKey = 'delivered'
  else {
    const firstIncomplete = TRACKING_STEPS.find((step) => !completed[step.key])
    currentKey = firstIncomplete ? firstIncomplete.key : 'delivered'
  }

  const currentIndex = TRACKING_STEPS.findIndex((step) => step.key === currentKey)
  const steps = TRACKING_STEPS.map((step, index) => {
    let state = 'pending'
    if (completed[step.key] && index < currentIndex) state = 'completed'
    else if (index === currentIndex) state = completed[step.key] && currentKey === 'delivered' ? 'completed' : 'current'
    else if (completed[step.key] && currentKey === 'delivered') state = 'completed'
    else if (completed[step.key] && index > currentIndex) state = 'completed'

    if (currentKey === 'delivered') state = completed[step.key] ? 'completed' : 'pending'
    if (step.key === 'confirmed' && !completed.confirmed && (status === 'pending_payment' || status === 'created')) state = 'pending'
    if (step.key === 'processing' && currentKey === 'processing') state = 'current'
    if (step.key === 'shipped' && currentKey === 'shipped') state = 'current'
    if (step.key === 'in_transit' && currentKey === 'in_transit') state = 'current'

    return { ...step, state, time: times[step.key] }
  })

  if (currentKey === 'delivered') {
    steps.forEach((step) => { step.state = completed[step.key] ? 'completed' : 'pending' })
    const delivered = steps.find((step) => step.key === 'delivered')
    if (delivered) delivered.state = 'completed'
  } else {
    let seenCurrent = false
    steps.forEach((step) => {
      if (step.key === currentKey) { step.state = 'current'; seenCurrent = true; return }
      if (!seenCurrent) step.state = completed[step.key] ? 'completed' : 'pending'
      else step.state = completed[step.key] && (currentKey === 'delivered') ? 'completed' : 'pending'
    })
  }

  return { mode: 'progress', steps }
}

function getPaymentPresentation(order) {
  const method = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'
  if (order.status === 'cancelled') {
    return {
      method,
      label: order.paidAt ? 'Cancelled after payment' : 'Payment not collected',
      detail: order.paidAt ? 'Payment was recorded before this order was cancelled.' : 'No payment was collected for this cancelled order.',
      tone: 'neutral',
    }
  }
  if (order.status === 'refund_required') {
    return {
      method,
      label: 'Refund review required',
      detail: 'Payment status needs review for this order. Follow the order timeline and support guidance for updates.',
      tone: 'warning',
    }
  }
  if (order.paymentMethod === 'cod') {
    if (order.paidAt) {
      return { method, label: 'Payment collected', detail: `Collected ${formatOrderDate(order.paidAt)}.`, tone: 'success' }
    }
    return {
      method,
      label: 'Pay on delivery',
      detail: 'Cash on Delivery orders are paid when the order is collected. Payment is not marked collected before delivery/collection.',
      tone: 'pending',
    }
  }
  if (order.paidAt || order.status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
    return {
      method,
      label: 'Payment received',
      detail: order.paidAt ? `Payment confirmed on ${formatOrderDate(order.paidAt)}.` : 'Payment has been recorded for this order.',
      tone: 'success',
    }
  }
  return {
    method,
    label: 'Awaiting payment',
    detail: 'Online payment has not been confirmed for this order yet.',
    tone: 'pending',
  }
}

function getOrderStateNotice(order) {
  switch (order.status) {
    case 'cancelled':
      return { tone: 'danger', title: 'Order cancelled', text: 'This order is cancelled. Any progress shown below reflects events recorded before cancellation.' }
    case 'refund_required':
      return { tone: 'warning', title: 'Refund review required', text: 'This order needs refund/payment review. Tracking and fulfillment may be paused until the issue is resolved.' }
    case 'pending_payment':
      return order.paymentMethod === 'cod'
        ? { tone: 'info', title: 'Awaiting fulfillment', text: 'Your Cash on Delivery order has been placed. Payment will be collected on delivery, not before.' }
        : { tone: 'warning', title: 'Awaiting payment', text: 'This order is waiting for online payment confirmation. Complete or retry payment from checkout if available, or cancel the unpaid order if you no longer need it.' }
    case 'created':
      return { tone: 'info', title: 'Order created', text: 'Your order has been created and is waiting for the next update.' }
    case 'delivered':
      return { tone: 'success', title: 'Order delivered', text: 'This order has been marked delivered based on recorded order status.' }
    default:
      return null
  }
}

export function OrderDetailsPage() {
  const { isPreviewMode } = useAuth()
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getOrder(orderId)
      .then((data) => { if (active) setOrder(data) })
      .catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load this order.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode, orderId])

  async function onCancel() {
    if (!order || busy || deleting) return
    setBusy(true); setStatus('')
    try { const updated = await cancelOrder(order.number); setOrder(updated); setStatus('Order cancelled.') }
    catch (e) { setStatus(getErrorMessage(e, 'Could not cancel this order.')) }
    finally { setBusy(false) }
  }

  async function onDelete() {
    if (!order || deleting || busy) return
    const info = orderDeleteInfo(order)
    if (!info.canDelete) {
      setDeleteError(info.reason)
      return
    }
    const confirmed = window.confirm(`Delete order ${order.number} from your orders list? This removes it from your view but does not affect admin records, payment history, or inventory records.`)
    if (!confirmed) return
    setDeleting(true)
    setDeleteError('')
    try {
      await archiveOrder(order.number)
      navigate('/dashboard/orders', { replace: true })
    } catch (e) {
      setDeleteError(getErrorMessage(e, 'Could not delete this order.'))
      setDeleting(false)
    }
  }

  if (isPreviewMode) return <><PageTitle eyebrow="Your account" title="Order details" description="Order details require an account." /><IntegrationState icon={Package} title="Preview mode" description="Sign in to view order details." /></>
  if (loading) return <><PageTitle eyebrow="Your account" title="Order details" description="Loading your order." /><IntegrationState state="loading" title="Loading order" description="Fetching order details." /></>
  if (error) return <><PageTitle eyebrow="Your account" title="Order details" description="Order details." /><section className="dashboard-panel" role="alert"><p>{error}</p><Link className="text-link" to="/dashboard/orders">Back to orders</Link></section></>
  if (!order) return null

  const deleteInfo = orderDeleteInfo(order)
  const tracking = buildTracking(order)
  const payment = getPaymentPresentation(order)
  const notice = getOrderStateNotice(order)
  const items = order.items || []
  const canCancel = order.status === 'pending_payment' || order.status === 'created'
  const statusTone = ['cancelled', 'refund_required'].includes(order.status) ? order.status : (order.status === 'delivered' ? 'delivered' : 'active')

  return (
    <>
      <PageTitle
        eyebrow="Your account"
        title={'Order ' + order.number}
        description={order.createdAt ? ('Placed on ' + formatOrderDate(order.createdAt)) : 'Order details and tracking'}
        action={<Link className="button button--outline" to="/dashboard/orders"><ChevronLeft size={14} /> Back to orders</Link>}
      />

      <div className="order-detail-layout">
        <section className="dashboard-panel order-detail-hero">
          <div className="order-detail-hero__main">
            <span className={`order-status-pill order-status-pill--${statusTone}`}>{order.statusLabel || order.status}</span>
            <h2>Order summary</h2>
            <p className="order-detail-hero__meta">
              <span><strong>{items.length}</strong> item{items.length === 1 ? '' : 's'}</span>
              <span>Total <strong>{formatMoneyValue(order.total)}</strong></span>
              {order.paidAt ? <span>Paid {formatOrderDate(order.paidAt)}</span> : null}
            </p>
          </div>
          <div className="order-detail-hero__actions">
            {canCancel ? <button className="button button--outline" type="button" disabled={busy || deleting} onClick={onCancel}>{busy ? 'Cancellingâ€¦' : 'Cancel order'}</button> : null}
            <button className="button button--outline" type="button" disabled={!deleteInfo.canDelete || deleting || busy} onClick={onDelete} aria-disabled={!deleteInfo.canDelete || deleting || busy}>
              {deleting ? 'Deletingâ€¦' : 'Delete order'}
            </button>
          </div>
          {!deleteInfo.canDelete ? <p className="form-status order-detail-hero__note" role="status">{deleteInfo.reason}</p> : null}
          {deleteError ? <p className="form-status order-detail-hero__note" role="alert">{deleteError}</p> : null}
          {status ? <p className="form-status order-detail-hero__note" role="status">{status}</p> : null}
        </section>

        {notice ? (
          <section className={`dashboard-panel order-detail-notice order-detail-notice--${notice.tone}`} role="status">
            <div className="order-detail-notice__icon"><CircleAlert size={18} /></div>
            <div>
              <h2>{notice.title}</h2>
              <p>{notice.text}</p>
            </div>
          </section>
        ) : null}

        <section className="dashboard-panel order-tracking-panel" aria-label="Order tracking">
          <div className="panel-heading"><div><span className="eyebrow">Tracking</span><h2>Order progress</h2></div></div>
          <ol className="order-tracking-steps">
            {tracking.steps.map((step, index) => {
              const Icon = step.icon
              return (
                <li key={step.key} className={`order-tracking-step is-${step.state}`}>
                  <div className="order-tracking-step__rail" aria-hidden="true">
                    <span className="order-tracking-step__icon"><Icon size={16} /></span>
                    {index < tracking.steps.length - 1 ? <span className="order-tracking-step__line" /> : null}
                  </div>
                  <div className="order-tracking-step__content">
                    <strong>{step.label}</strong>
                    <span>{step.time ? formatOrderDate(step.time) : (step.state === 'current' ? 'Current status' : (step.state === 'completed' ? 'Recorded' : 'Pending'))}</span>
                  </div>
                </li>
              )
            })}
          </ol>
          {tracking.mode === 'cancelled' ? <p className="order-tracking-footnote">This order was cancelled. Later delivery steps are not expected unless reflected in recorded order events.</p> : null}
          {tracking.mode === 'refund_required' ? <p className="order-tracking-footnote">This order requires refund review. Progress shown is based only on recorded order status and events.</p> : null}
        </section>

        <div className="order-detail-grid">
          <section className="dashboard-panel order-items-panel">
            <div className="panel-heading"><div><span className="eyebrow">Items</span><h2>Products in this order</h2></div></div>
            {items.length ? (
              <ul className="order-items-list">
                {items.map((item, index) => {
                  const content = (
                    <>
                      <div className="order-item-card__image">
                        {item.image ? <img src={item.image} alt={item.imageAlt || item.name} loading="lazy" /> : <span aria-hidden="true"><Package size={24} /></span>}
                      </div>
                      <div className="order-item-card__body">
                        <div className="order-item-card__title-row">
                          <h3>{item.name}</h3>
                          <strong>{formatMoneyValue(item.lineTotal)}</strong>
                        </div>
                        <p className="order-item-card__meta">
                          <span>Qty {item.quantity}</span>
                          {item.unitPrice != null ? <span>Unit {formatMoneyValue(item.unitPrice)}</span> : null}
                          {item.sku ? <span>SKU {item.sku}</span> : null}
                        </p>
                      </div>
                    </>
                  )
                  return (
                    <li key={`${item.productId || item.sku || item.name}-${index}`} className="order-item-card">
                      {item.productSlug ? <Link to={'/products/' + encodeURIComponent(item.productSlug)} className="order-item-card__link">{content}</Link> : <div className="order-item-card__link">{content}</div>}
                    </li>
                  )
                })}
              </ul>
            ) : <p>No item details are available for this order.</p>}
          </section>

          <div className="order-detail-side">
            <section className="dashboard-panel order-info-card">
              <div className="panel-heading"><div><span className="eyebrow">Delivery</span><h2>Shipping information</h2></div></div>
              {order.shippingAddress ? (
                <div className="order-info-block">
                  <p className="order-info-block__title"><MapPin size={15} /> Delivery address</p>
                  <p><strong>{order.shippingAddress.name}</strong></p>
                  <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  {order.shippingAddress.phone ? <p>{order.shippingAddress.phone}</p> : null}
                </div>
              ) : <p>Shipping address details are not available.</p>}
              <div className="order-info-block">
                <p className="order-info-block__title"><Truck size={15} /> Delivery status</p>
                <p>{order.trackingNote || (order.status === 'delivered' ? 'Delivered based on recorded order status.' : order.status === 'shipped' ? 'Shipment has been recorded. No additional tracking details are available.' : 'No shipment tracking details are available yet.')}</p>
              </div>
            </section>

            <section className="dashboard-panel order-info-card">
              <div className="panel-heading"><div><span className="eyebrow">Payment</span><h2>Payment details</h2></div></div>
              <div className="order-info-block">
                <p className="order-info-block__title"><CreditCard size={15} /> {payment.method}</p>
                <p><span className={`order-payment-badge is-${payment.tone}`}>{payment.label}</span></p>
                <p>{payment.detail}</p>
              </div>
            </section>

            <section className="dashboard-panel order-info-card">
              <div className="panel-heading"><div><span className="eyebrow">Total</span><h2>Price breakdown</h2></div></div>
              <dl className="order-price-breakdown">
                <div><dt>Subtotal</dt><dd>{formatMoneyValue(order.subtotal)}</dd></div>
                <div><dt>Shipping</dt><dd>{formatMoneyValue(order.shippingFee)}</dd></div>
                <div className="is-total"><dt>Total</dt><dd>{formatMoneyValue(order.total)}</dd></div>
              </dl>
              <p className="order-price-note">No discount line is shown because discount details are not available from the order record.</p>
            </section>
          </div>
        </div>

        {order.events?.length ? (
          <section className="dashboard-panel order-history-panel">
            <div className="panel-heading"><div><span className="eyebrow">History</span><h2>Recorded updates</h2></div></div>
            <ul className="order-history-list">
              {order.events.map((event, index) => (
                <li key={`${event.status}-${event.at || index}`} className="order-history-item">
                  <span className="order-history-item__dot" aria-hidden="true" />
                  <div>
                    <div className="order-history-item__head">
                      <strong>{event.status || 'Update'}</strong>
                      {event.at ? <span><Clock3 size={13} /> {formatOrderDate(event.at)}</span> : null}
                    </div>
                    {event.note ? <p>{event.note}</p> : <p className="order-history-item__empty">No additional note recorded.</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="dashboard-disclaimer">Tracking progress is shown from recorded order status and events only. Online payment capture requires configured payment credentials; Cash on Delivery is collected on delivery. Deleted orders are removed from your list only; admin records, payment history, and inventory records are preserved.</p>
      </div>
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
  const { isPreviewMode, user, refreshProfile } = useAuth()
  const { themePreference, setThemePreference } = useTheme()
  const [loading, setLoading] = useState(() => !isPreviewMode)
  const [saving, setSaving] = useState('')
  const [status, setStatus] = useState({ section: '', type: '', text: '' })
  const [profileEmail, setProfileEmail] = useState('')
  const [personal, setPersonal] = useState({ name: '', phone: '', dateOfBirth: '', gender: '' })
  const [preferences, setPreferences] = useState({ language: 'en', emailUpdates: false, inAppNotifications: true })
  const [consents, setConsents] = useState([])
  const [consentBusy, setConsentBusy] = useState('')
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [emailChange, setEmailChange] = useState({ newEmail: '', password: '' })
  const [membership, setMembership] = useState(null)

  const currentPlan = membershipPlans.find((plan) => plan.id === (membership?.plan || 'free')) || membershipPlans[0]

  function note(section, type, text) { setStatus({ section, type, text }) }
  function sectionStatus(section) { return status.section === section ? status : null }

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    Promise.allSettled([getProfile(), getPreferences(), getConsents(), getMembership()])
      .then(([profileResult, preferencesResult, consentsResult, membershipResult]) => {
        if (!active) return
        if (profileResult.status === 'fulfilled') {
          const p = profileResult.value || {}
          const email = p.email || user?.email || ''
          setProfileEmail(email)
          setPersonal({ name: p.name || '', phone: p.phone || '', dateOfBirth: p.dateOfBirth || '', gender: p.gender || '' })
        } else {
          setProfileEmail(user?.email || '')
          note('personal', 'error', getErrorMessage(profileResult.reason, 'Could not load personal information.'))
        }
        if (preferencesResult.status === 'fulfilled') {
          const p = preferencesResult.value || {}
          setPreferences({ language: p.language || 'en', emailUpdates: !!p.emailUpdates, inAppNotifications: p.inAppNotifications !== false })
        } else {
          note('preferences', 'error', getErrorMessage(preferencesResult.reason, 'Could not load preferences.'))
        }
        if (consentsResult.status === 'fulfilled') {
          setConsents(Array.isArray(consentsResult.value) ? consentsResult.value : [])
        } else {
          note('privacy', 'error', getErrorMessage(consentsResult.reason, 'Could not load privacy settings.'))
        }
        if (membershipResult.status === 'fulfilled') {
          setMembership(membershipResult.value && typeof membershipResult.value === 'object' ? membershipResult.value : null)
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode, user?.email])

  async function savePersonal(event) {
    event.preventDefault()
    if (isPreviewMode) return note('personal', 'info', 'Not available in preview mode.')
    setSaving('personal'); note('personal', '', '')
    try {
      const payload = { name: personal.name.trim(), phone: personal.phone.trim() || '', dateOfBirth: personal.dateOfBirth || '', gender: personal.gender || '' }
      const updated = await updateProfile(payload)
      setProfileEmail(updated?.email || profileEmail || user?.email || '')
      setPersonal({ name: updated?.name || payload.name, phone: updated?.phone ?? payload.phone, dateOfBirth: updated?.dateOfBirth ?? payload.dateOfBirth, gender: updated?.gender ?? payload.gender })
      await refreshProfile()
      note('personal', 'success', 'Personal information saved.')
    } catch (error) {
      const fields = getFieldErrors(error)
      note('personal', 'error', fields.form || Object.values(fields)[0] || getErrorMessage(error, 'Could not save personal information.'))
    } finally {
      setSaving('')
    }
  }

  async function savePreferences(section = 'preferences', successText = 'Preferences saved.', next = preferences) {
    if (isPreviewMode) return note(section, 'info', 'Not available in preview mode.')
    setSaving(section); note(section, '', '')
    try {
      const saved = await updatePreferences(next)
      setPreferences({ language: saved.language || 'en', emailUpdates: !!saved.emailUpdates, inAppNotifications: saved.inAppNotifications !== false })
      note(section, 'success', successText)
    } catch (error) {
      note(section, 'error', getErrorMessage(error, 'Could not save preferences.'))
    } finally {
      setSaving('')
    }
  }

  async function toggleConsent(kind, accepted) {
    if (isPreviewMode) return note('privacy', 'info', 'Not available in preview mode.')
    if (kind === 'terms_privacy' && !accepted) return note('privacy', 'info', 'Terms acceptance is required for an active account.')
    setConsentBusy(kind); note('privacy', '', '')
    try {
      const next = await saveConsent(kind, accepted)
      setConsents(Array.isArray(next) ? next : [])
      note('privacy', 'success', 'Consent updated.')
    } catch (error) {
      const fields = getFieldErrors(error)
      note('privacy', 'error', fields.accepted || getErrorMessage(error, 'Could not update consent.'))
    } finally {
      setConsentBusy('')
    }
  }

  async function submitPassword(event) {
    event.preventDefault()
    if (isPreviewMode) return note('security', 'info', 'Not available in preview mode.')
    if (!password.current || !password.next || !password.confirm) return note('security', 'error', 'Enter current, new, and confirm password.')
    if (password.next !== password.confirm) return note('security', 'error', 'New password and confirmation do not match.')
    setSaving('password'); note('security', '', '')
    try {
      await changePassword({ currentPassword: password.current, newPassword: password.next })
      setPassword({ current: '', next: '', confirm: '' })
      note('security', 'success', 'Password updated. Other sessions signed out.')
    } catch (error) {
      const fields = getFieldErrors(error)
      note('security', 'error', fields.currentPassword || fields.newPassword || fields.form || getErrorMessage(error, 'Could not change password.'))
    } finally {
      setSaving('')
    }
  }

  async function submitEmailChange(event) {
    event.preventDefault()
    if (isPreviewMode) return note('security', 'info', 'Not available in preview mode.')
    if (!emailChange.newEmail || !emailChange.password) return note('security', 'error', 'Enter new email and current password.')
    setSaving('email'); note('security', '', '')
    try {
      const updated = await changeEmail({ newEmail: emailChange.newEmail.trim(), password: emailChange.password })
      const nextEmail = updated?.email || emailChange.newEmail.trim()
      setProfileEmail(nextEmail)
      setEmailChange({ newEmail: '', password: '' })
      await refreshProfile()
      note('security', 'success', 'Login email updated.')
    } catch (error) {
      const fields = getFieldErrors(error)
      note('security', 'error', fields.newEmail || fields.password || fields.form || getErrorMessage(error, 'Could not change email.'))
    } finally {
      setSaving('')
    }
  }

  async function submitDeleteAccount(event) {
    event.preventDefault()
    if (isPreviewMode) return note('security', 'info', 'Not available in preview mode.')
    const passwordValue = String(new FormData(event.currentTarget).get('deletePassword') || '')
    if (!passwordValue) return note('security', 'error', 'Enter your password to confirm deletion.')
    if (!window.confirm('Permanently delete your account and personal data? This cannot be undone.')) return
    setSaving('delete'); note('security', '', '')
    try {
      await deleteAccount({ password: passwordValue })
      note('security', 'success', 'Account deletion requested.')
    } catch (error) {
      const fields = getFieldErrors(error)
      note('security', 'error', fields.password || getErrorMessage(error, 'Could not delete account.'))
    } finally {
      setSaving('')
    }
  }

  const appearanceOptions = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'System' },
  ]
  const consentMeta = {
    terms_privacy: 'Terms and privacy (required)',
    health_data: 'Health data processing',
    disclaimer: 'Wellness disclaimer',
    marketing: 'Marketing communications (optional)',
  }

  if (loading) {
    return <><PageTitle eyebrow="Your account" title="Settings" description="Manage your account settings." /><IntegrationState state="loading" title="Loading settings" description="Fetching your account settings." /></>
  }

  const notice = (section) => {
    const s = sectionStatus(section)
    return s ? <p className={`settings-notice settings-notice--${s.type}`} role={s.type === 'error' ? 'alert' : 'status'}>{s.text}</p> : null
  }

  return (
    <>
      <PageTitle eyebrow="Your account" title="Settings" description="Manage your account settings." />
      <div className="settings-page">
        <section className="dashboard-panel settings-card settings-card--wide">
          <header className="settings-card__head"><h2>Personal Information</h2></header>
          {notice('personal')}
          <form className="settings-form" onSubmit={savePersonal}>
            <label className="settings-field"><span>Full name</span><input value={personal.name} onChange={(e) => setPersonal((c) => ({ ...c, name: e.target.value }))} autoComplete="name" required /></label>
            <label className="settings-field"><span>Email</span><input value={profileEmail || user?.email || ''} readOnly disabled /></label>
            <label className="settings-field"><span>Phone</span><input value={personal.phone} onChange={(e) => setPersonal((c) => ({ ...c, phone: e.target.value }))} inputMode="tel" placeholder="10-digit mobile number" /></label>
            <label className="settings-field"><span>Date of birth</span><input type="date" value={personal.dateOfBirth} onChange={(e) => setPersonal((c) => ({ ...c, dateOfBirth: e.target.value }))} /></label>
            <label className="settings-field"><span>Gender</span><select value={personal.gender} onChange={(e) => setPersonal((c) => ({ ...c, gender: e.target.value }))}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
            <div className="settings-form__actions"><button className="button button--primary" type="submit" disabled={saving === 'personal'}>{saving === 'personal' ? 'Saving…' : 'Save'}</button></div>
          </form>
        </section>

        <section className="dashboard-panel settings-card">
          <header className="settings-card__head"><h2>Preferences</h2></header>
          {notice('preferences')}
          <div className="settings-block">
            <label className="settings-field"><span>Language</span><select value={preferences.language} onChange={(e) => setPreferences((c) => ({ ...c, language: e.target.value }))}><option value="en">English</option></select></label>
            <label className="settings-toggle-row"><span>Product and platform update emails</span><input type="checkbox" checked={preferences.emailUpdates} onChange={(e) => setPreferences((c) => ({ ...c, emailUpdates: e.target.checked }))} /></label>
            <div className="settings-form__actions"><button className="button button--primary" type="button" onClick={() => savePreferences('preferences', 'Preferences saved.')} disabled={saving === 'preferences'}>{saving === 'preferences' ? 'Saving…' : 'Save'}</button></div>
          </div>
        </section>

        <section className="dashboard-panel settings-card">
          <header className="settings-card__head"><h2>Appearance</h2></header>
          <div className="settings-segmented" role="radiogroup" aria-label="Appearance">
            {appearanceOptions.map((option) => (
              <button key={option.id} type="button" className={`settings-segment${themePreference === option.id ? ' is-selected' : ''}`} onClick={() => setThemePreference(option.id)} aria-pressed={themePreference === option.id}>{option.label}</button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel settings-card">
          <header className="settings-card__head"><h2>Notifications</h2></header>
          {notice('notifications')}
          <div className="settings-block">
            <label className="settings-toggle-row"><span>In-app notifications</span><input type="checkbox" checked={preferences.inAppNotifications} onChange={(e) => setPreferences((c) => ({ ...c, inAppNotifications: e.target.checked }))} /></label>
            <div className="settings-form__actions settings-form__actions--split"><button className="button button--primary" type="button" onClick={() => savePreferences('notifications', 'Notification preference saved.')} disabled={saving === 'notifications'}>{saving === 'notifications' ? 'Saving…' : 'Save'}</button><Link className="text-link" to="/dashboard/notifications">View notifications</Link></div>
          </div>
        </section>

        <section className="dashboard-panel settings-card settings-card--wide">
          <header className="settings-card__head"><h2>Privacy &amp; Consent</h2></header>
          {notice('privacy')}
          {consents.length === 0 ? <p className="settings-muted">No consent records available.</p> : (
            <div className="settings-consent-list">
              {consents.map((consent) => (
                <label key={consent.kind} className="settings-toggle-row settings-toggle-row--consent">
                  <span>
                    <strong>{consentMeta[consent.kind] || consent.kind}</strong>
                    <small>{consent.recordedAt ? `Recorded ${new Date(consent.recordedAt).toLocaleDateString()}` : 'Not recorded'}{consent.accepted && !consent.upToDate ? ' · Update available' : ''}</small>
                  </span>
                  <input type="checkbox" checked={!!consent.accepted} disabled={consentBusy === consent.kind || isPreviewMode} onChange={(e) => toggleConsent(consent.kind, e.target.checked)} />
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel settings-card settings-card--wide">
          <header className="settings-card__head"><h2>Account Security</h2></header>
          {notice('security')}
          <div className="settings-security">
            <form className="settings-subcard" onSubmit={submitPassword}>
              <h3>Change password</h3>
              <div className="settings-form settings-form--compact">
                <label className="settings-field settings-field--full"><span>Current password</span><input type="password" value={password.current} onChange={(e) => setPassword((c) => ({ ...c, current: e.target.value }))} autoComplete="current-password" /></label>
                <label className="settings-field"><span>New password</span><input type="password" value={password.next} onChange={(e) => setPassword((c) => ({ ...c, next: e.target.value }))} autoComplete="new-password" /></label>
                <label className="settings-field"><span>Confirm new password</span><input type="password" value={password.confirm} onChange={(e) => setPassword((c) => ({ ...c, confirm: e.target.value }))} autoComplete="new-password" /></label>
                <div className="settings-form__actions"><button className="button button--primary" type="submit" disabled={saving === 'password'}>{saving === 'password' ? 'Updating…' : 'Update password'}</button></div>
              </div>
            </form>

            <form className="settings-subcard" onSubmit={submitEmailChange}>
              <h3>Change login email</h3>
              <div className="settings-form settings-form--compact">
                <label className="settings-field"><span>New email</span><input type="email" value={emailChange.newEmail} onChange={(e) => setEmailChange((c) => ({ ...c, newEmail: e.target.value }))} autoComplete="email" /></label>
                <label className="settings-field"><span>Current password</span><input type="password" value={emailChange.password} onChange={(e) => setEmailChange((c) => ({ ...c, password: e.target.value }))} autoComplete="current-password" /></label>
                <div className="settings-form__actions"><button className="button button--outline" type="submit" disabled={saving === 'email'}>{saving === 'email' ? 'Updating…' : 'Update email'}</button></div>
              </div>
            </form>

            <form className="settings-subcard settings-subcard--danger" onSubmit={submitDeleteAccount}>
              <h3>Delete account</h3>
              <div className="settings-form settings-form--compact">
                <label className="settings-field"><span>Current password</span><input name="deletePassword" type="password" autoComplete="current-password" /></label>
                <div className="settings-form__actions"><button className="button button--outline button--danger" type="submit" disabled={saving === 'delete'}>{saving === 'delete' ? 'Deleting…' : 'Delete account'}</button></div>
              </div>
            </form>
          </div>
        </section>

        <section className="dashboard-panel settings-card">
          <header className="settings-card__head"><h2>Membership Information</h2></header>
          <dl className="settings-summary">
            <div><dt>Plan</dt><dd>{currentPlan?.name || membership?.plan || 'Free'}</dd></div>
            <div><dt>Status</dt><dd>{membership?.status || 'active'}</dd></div>
            <div><dt>Renews</dt><dd>{membership?.renewedAt ? new Date(membership.renewedAt).toLocaleDateString() : '—'}</dd></div>
            <div><dt>Price</dt><dd>{currentPlan ? `${formatMembershipPrice(currentPlan.price)} ${currentPlan.billingLabel}` : '—'}</dd></div>
          </dl>
          <div className="settings-form__actions"><Link className="button button--outline" to="/dashboard/subscriptions">Manage memberships</Link></div>
        </section>
      </div>
    </>
  )
}
