import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Banknote, CreditCard, Minus, Package, Plus, ShoppingCart, Smartphone, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createAddress, getCart, getErrorMessage, getFieldErrors, listAddresses, placeOrder, removeCartItem, updateCartItem } from '../services/apiBackend/index.js'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function CartPage() {
  const { isPreviewMode, refreshCartCount } = useAuth()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [cart, setCart] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    getCart()
      .then((data) => { if (active) { setCart(data); refreshCartCount() } })
      .catch((e) => { if (active) setError(getErrorMessage(e, 'Could not load your cart.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode, refreshCartCount])

  async function changeQty(productId, qty) {
    setBusyId(productId)
    setError('')
    try {
      const next = await updateCartItem(productId, qty)
      setCart(next)
      await refreshCartCount()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update item.'))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(productId) {
    setBusyId(productId)
    setError('')
    try {
      const next = await removeCartItem(productId)
      setCart(next)
      await refreshCartCount()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not remove item.'))
    } finally {
      setBusyId(null)
    }
  }

  if (isPreviewMode) return <><header className="dashboard-page-title"><div><span className="eyebrow">Marketplace</span><h1>Your cart</h1><p>Sign in to view and manage your cart.</p></div><Link className="button button--outline" to="/dashboard/marketplace">Continue shopping</Link></header><IntegrationState icon={ShoppingCart} title="Preview mode" description="Cart is available after sign-in." /></>
  if (loading) return <><header className="dashboard-page-title"><div><span className="eyebrow">Marketplace</span><h1>Your cart</h1></div></header><IntegrationState state="loading" title="Loading cart" description="Fetching your cart." /></>
  if (error && !cart) return <><header className="dashboard-page-title"><div><span className="eyebrow">Marketplace</span><h1>Your cart</h1></div></header><section className="dashboard-panel" role="alert"><p>{error}</p><Link className="button button--outline" to="/dashboard/marketplace">Browse products</Link></section></>

  const items = cart?.items || []
  if (!items.length) return <><header className="dashboard-page-title"><div><span className="eyebrow">Marketplace</span><h1>Your cart</h1><p>Your cart is empty.</p></div><Link className="button button--outline" to="/dashboard/marketplace">Continue shopping</Link></header><section className="dashboard-panel cart-empty"><IntegrationState icon={ShoppingCart} title="Cart is empty" description="Add products from the marketplace to get started." /><div className="cart-page-actions"><Link className="button button--primary" to="/dashboard/marketplace">Continue shopping <ArrowRight size={14} /></Link></div></section></>

  return (
    <>
      <header className="dashboard-page-title"><div><span className="eyebrow">Marketplace</span><h1>Your cart</h1><p>Review items before checkout.</p></div><Link className="button button--outline" to="/dashboard/marketplace">Continue shopping</Link></header>
      {error && <p className="form-status" role="alert">{error}</p>}
      <div className="cart-page-grid">
        <section className="dashboard-panel">
          <h2>Items ({cart.itemCount || items.length})</h2>
          <ul className="cart-items-list">
            {items.map((item) => {
              const img = item.product?.image
              return (
                <li className="cart-item" key={item.product.id}>
                  <div className="cart-item__image" aria-hidden="true">{img ? <img src={img} alt="" /> : <Package size={22} />}</div>
                  <div className="cart-item__info">
                    <h3><Link to={'/products/' + encodeURIComponent(item.product.slug)}>{item.product.name}</Link></h3>
                    <p>{money.format(item.unitPrice || 0)} each</p>
                    {!item.available && <p className="dashboard-disclaimer">This item is currently unavailable or out of stock.</p>}
                  </div>
                  <div className="cart-item__actions">
                    <div className="cart-qty" aria-label={'Quantity for ' + item.product.name}>
                      <button type="button" disabled={busyId === item.product.id || item.quantity <= 1} onClick={() => changeQty(item.product.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button type="button" disabled={busyId === item.product.id} onClick={() => changeQty(item.product.id, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                    </div>
                    <button className="button button--outline" type="button" disabled={busyId === item.product.id} onClick={() => remove(item.product.id)} aria-label={'Remove ' + item.product.name}><Trash2 size={14} /></button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
        <aside className="cart-summary" aria-label="Order summary">
          <h2>Summary</h2>
          <div className="cart-summary__row"><span>Subtotal</span><strong>{money.format(cart.subtotal || 0)}</strong></div>
          <div className="cart-summary__row"><span>Shipping</span><strong>{(cart.shippingFee || 0) === 0 ? 'Free' : money.format(cart.shippingFee || 0)}</strong></div>
          <div className="cart-summary__row cart-summary__row--total"><span>Total</span><strong>{money.format(cart.total || 0)}</strong></div>
          {cart.freeShippingRemaining > 0 && <p className="report-note">Add {money.format(cart.freeShippingRemaining)} more for free shipping.</p>}
          <div className="cart-page-actions">
            <Link className="button button--primary" to="/dashboard/checkout">Proceed to checkout <ArrowRight size={14} /></Link>
            <Link className="button button--outline" to="/dashboard/marketplace">Continue shopping</Link>
          </div>
        </aside>
      </div>
    </>
  )
}

function CheckoutPage() {
  const { isPreviewMode, refreshCartCount } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!isPreviewMode)
  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [addressId, setAddressId] = useState('')
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isPreviewMode) return
    let active = true
    Promise.all([getCart(), listAddresses()]).then(([c, a]) => {
      if (!active) return
      setCart(c); setAddresses(a)
      const def = a.find((x) => x.isDefault) || a[0]
      if (def) setAddressId(String(def.id))
    }).catch((e) => { if (active) setStatus(getErrorMessage(e, 'Could not load checkout data.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isPreviewMode])

  async function addAddress(e) {
    e.preventDefault()
    setBusy(true); setStatus(''); setErrors({})
    try {
      const created = await createAddress(newAddr)
      const next = await listAddresses()
      setAddresses(next); setAddressId(String(created.id))
      setNewAddr({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' })
      setStatus('Address saved.')
    } catch (err) {
      setErrors(getFieldErrors(err)); setStatus(getErrorMessage(err, 'Could not save address.'))
    } finally { setBusy(false) }
  }

  async function submitOrder() {
    if (!addressId) { setStatus('Select or add a delivery address.'); return }
    if (!cart?.items?.length) { setStatus('Your cart is empty.'); return }
    if (paymentMethod === 'upi' || paymentMethod === 'card') {
      setStatus('Online payment (UPI/card) is not yet activated because payment provider credentials are not configured. No payment was taken and no order was marked paid. Choose Cash on Delivery to place an order.')
      return
    }
    setBusy(true); setStatus('')
    try {
      const result = await placeOrder({
        addressId: Number(addressId),
        notes: '',
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'online',
      })
      await refreshCartCount()
      if (result.order?.paymentMethod === 'cod') {
        setStatus('Cash on Delivery order placed. Payment will be collected at delivery; this order is not marked paid.')
      } else if (result.payment) {
        setStatus('Order created. Online payment capture requires configured payment credentials. The order is pending payment and not marked paid.')
      } else {
        setStatus('Order created. The order is pending payment and not marked paid.')
      }
      navigate('/dashboard/orders/' + encodeURIComponent(result.order.number))
    } catch (err) {
      setStatus(getErrorMessage(err, 'Could not place the order.'))
    } finally { setBusy(false) }
  }

  if (isPreviewMode) return <><header className="dashboard-page-title"><div><span className="eyebrow">Secure checkout</span><h1>Checkout</h1><p>Sign in to checkout.</p></div><Link className="button button--outline" to="/dashboard/cart"><ArrowLeft size={14} /> Back to cart</Link></header><IntegrationState icon={CreditCard} title="Preview mode" description="Checkout is available after sign-in." /></>
  if (loading) return <><header className="dashboard-page-title"><div><span className="eyebrow">Secure checkout</span><h1>Checkout</h1></div></header><IntegrationState state="loading" title="Loading checkout" description="Fetching cart and addresses." /></>

  return (
    <>
      <header className="dashboard-page-title"><div><span className="eyebrow">Secure checkout</span><h1>Checkout</h1><p>Confirm delivery address, choose payment, and place your order.</p></div><Link className="button button--outline" to="/dashboard/cart"><ArrowLeft size={14} /> Back to cart</Link></header>
      <div className="cart-page-grid">
        <div className="report-grid">
          <section className="dashboard-panel">
            <h2>Order summary</h2>
            {cart?.items?.length ? (
              <>
                <ul className="settings-list">{cart.items.map((item) => <li key={item.product.id}><strong>{item.product.name}</strong> x {item.quantity} - {money.format(item.lineTotal || 0)}</li>)}</ul>
                <div className="cart-summary" style={{ marginTop: 12 }}>
                  <div className="cart-summary__row"><span>Subtotal</span><strong>{money.format(cart.subtotal || 0)}</strong></div>
                  <div className="cart-summary__row"><span>Shipping</span><strong>{(cart.shippingFee || 0) === 0 ? 'Free' : money.format(cart.shippingFee || 0)}</strong></div>
                  <div className="cart-summary__row cart-summary__row--total"><span>Total</span><strong>{money.format(cart.total || 0)}</strong></div>
                </div>
              </>
            ) : <p>Your cart is empty.</p>}
          </section>

          <section className="dashboard-panel">
            <h2>Delivery address</h2>
            {addresses.length ? (
              <div className="settings-list">{addresses.map((a) => (
                <label key={a.id} className="settings-option"><span><strong>{a.name}</strong><small>{a.line1}{a.line2 ? ', ' + a.line2 : ''}, {a.city}, {a.state} {a.pincode} - {a.phone}</small></span><input type="radio" name="address" checked={String(a.id) === String(addressId)} onChange={() => setAddressId(String(a.id))} /></label>
              ))}</div>
            ) : <p>No saved addresses yet. Add one below.</p>}
          </section>

          <section className="dashboard-panel">
            <h2>Add address</h2>
            <form onSubmit={addAddress} className="basic-profile-form" noValidate>
              <label>Full name<input value={newAddr.name} onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })} />{errors.name && <span className="auth-field-error">{errors.name}</span>}</label>
              <label>Phone<input value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />{errors.phone && <span className="auth-field-error">{errors.phone}</span>}</label>
              <label>Address line 1<input value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />{errors.line1 && <span className="auth-field-error">{errors.line1}</span>}</label>
              <label>Address line 2<input value={newAddr.line2} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} /></label>
              <label>City<input value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />{errors.city && <span className="auth-field-error">{errors.city}</span>}</label>
              <label>State<input value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />{errors.state && <span className="auth-field-error">{errors.state}</span>}</label>
              <label>Pincode<input value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />{errors.pincode && <span className="auth-field-error">{errors.pincode}</span>}</label>
              <button className="button button--outline" type="submit" disabled={busy}>Save address</button>
            </form>
          </section>
        </div>

        <aside className="report-grid">
          <section className="dashboard-panel">
            <h2>Payment method</h2>
            <div className="payment-options" role="radiogroup" aria-label="Payment method">
              <label className={`payment-option ${paymentMethod === 'cod' ? 'is-selected' : ''}`}>
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span className="payment-option__copy"><strong><Banknote size={14} aria-hidden="true" /> Cash on Delivery <span className="payment-badge">Available</span></strong><small>Pay cash at delivery. Your order will be placed as unpaid/pending collection and will not be marked paid until payment is collected.</small></span>
              </label>
              <label className={`payment-option ${paymentMethod === 'upi' ? 'is-selected' : ''} is-disabled`}>
                <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                <span className="payment-option__copy"><strong><Smartphone size={14} aria-hidden="true" /> UPI <span className="payment-badge">Coming soon</span></strong><small>Online payment is not yet activated (Razorpay/provider credentials unavailable). No payment will be processed.</small></span>
              </label>
              <label className={`payment-option ${paymentMethod === 'card' ? 'is-selected' : ''} is-disabled`}>
                <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <span className="payment-option__copy"><strong><CreditCard size={14} aria-hidden="true" /> Card payment <span className="payment-badge">Coming soon</span></strong><small>Online payment is not yet activated (Razorpay/provider credentials unavailable). No payment will be processed.</small></span>
              </label>
            </div>
          </section>

          <section className="dashboard-panel">
            <h2>Place order</h2>
            <p><strong>Total:</strong> {money.format(cart?.total || 0)}</p>
            <button className="button button--primary" type="button" disabled={busy || !cart?.items?.length} onClick={submitOrder}>{busy ? 'Placing order…' : 'Place order'}</button>
            {status && <p className="form-status" role="status" style={{ marginTop: 10 }}>{status}</p>}
            <p className="dashboard-disclaimer">Cash on Delivery orders are placed unpaid and are not marked paid before collection. Online payment (UPI/Card) is not activated and is not simulated; unpaid online orders can be cancelled from order details.</p>
          </section>
        </aside>
      </div>
    </>
  )
}

export default function CommercePages({ page }) {
  return page === 'checkout' ? <CheckoutPage /> : <CartPage />
}
