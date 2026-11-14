import { ArrowLeft, ArrowRight, CreditCard, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'

function CartPage() {
  return (
    <>
      <header className="dashboard-page-title"><div><span className="eyebrow">Marketplace</span><h1>Your cart</h1><p>Your cart contents will appear after the product catalogue and commerce services are connected.</p></div><Link className="button button--outline" to="/dashboard/marketplace">Continue browsing</Link></header>
      <IntegrationState icon={ShoppingCart} title="Cart unavailable" description="No products, prices, or quantities are stored in this frontend." />
    </>
  )
}

function CheckoutPage() {
  return (
    <>
      <header className="dashboard-page-title"><div><span className="eyebrow">Secure checkout</span><h1>Checkout</h1><p>Checkout will be available when commerce and payment services are connected.</p></div><Link className="button button--outline" to="/dashboard/cart"><ArrowLeft size={14} /> Back to cart</Link></header>
      <IntegrationState icon={CreditCard} title="Checkout unavailable" description="No payment details are requested, no payment is processed, and no order can be created from this screen." />
      <Link className="text-link" to="/dashboard/marketplace">Return to marketplace <ArrowRight size={14} /></Link>
    </>
  )
}

export default function CommercePages({ page }) {
  return page === 'checkout' ? <CheckoutPage /> : <CartPage />
}
