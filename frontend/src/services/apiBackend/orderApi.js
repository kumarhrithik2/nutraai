/**
 * Section: Checkout, payment and orders
 * Pages: CommercePages (checkout), OrdersPage, OrderDetailsPage (/dashboard/orders/:orderId,
 * where orderId is the order number, e.g. NA261114-A1B2C3).
 */
import { apiClient, money, normalizePage } from './core.js'

function normalizeOrder(o) {
  return {
    number: o.number,
    status: o.status,
    statusLabel: o.status_label,
    total: money(o.total),
    currency: o.currency,
    itemCount: o.item_count,
    createdAt: o.created_at,
    // detail only
    subtotal: money(o.subtotal),
    shippingFee: money(o.shipping_fee),
    paidAt: o.paid_at,
    expiresAt: o.expires_at,
    trackingNote: o.tracking_note,
    notes: o.notes,
    shippingAddress: o.shipping_address && {
      name: o.shipping_address.full_name,
      phone: o.shipping_address.phone,
      line1: o.shipping_address.line1,
      line2: o.shipping_address.line2,
      city: o.shipping_address.city,
      state: o.shipping_address.state,
      pincode: o.shipping_address.pincode,
    },
    items: o.items?.map((i) => ({
      name: i.name,
      sku: i.sku,
      unitPrice: money(i.unit_price),
      quantity: i.quantity,
      lineTotal: money(i.line_total),
    })),
    events: o.events?.map((e) => ({ status: e.status, note: e.note, at: e.created_at })),
  }
}

/** What the Razorpay widget needs. `amount` is in paise. */
function normalizePayment(p) {
  return (
    p && {
      gateway: p.gateway,
      keyId: p.key_id,
      gatewayOrderId: p.gateway_order_id,
      amount: p.amount,
      currency: p.currency,
    }
  )
}

/**
 * Purpose: place an order from the cart: reserves stock, snapshots the address and prices,
 * and opens a payment. Reuse the same idempotencyKey when retrying one attempt (double click,
 * network retry) so only one order is created.
 * Endpoint: POST /checkout/   (header Idempotency-Key)
 * Params: { addressId: number, notes?: string, idempotencyKey?: string (generated if omitted) }
 * Returns: Promise<{ order: Order, payment: { gateway, keyId, gatewayOrderId, amount, currency } | null }>
 * Errors: 400 "empty_cart", 404 address, 409 "cart_changed" (details list the changed items),
 *         503 "checkout_disabled".
 */
export async function placeOrder({ addressId, notes = '', idempotencyKey } = {}) {
  const key =
    idempotencyKey || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const { data } = await apiClient.post(
    '/checkout/',
    { address_id: addressId, notes },
    { headers: { 'Idempotency-Key': key } },
  )
  return { order: normalizeOrder(data.order), payment: normalizePayment(data.payment) }
}

/**
 * Purpose: confirm a payment after the Razorpay widget succeeds (the backend verifies the
 * signature; the webhook also confirms independently).
 * Endpoint: POST /payments/verify/
 * Params: { razorpayOrderId, razorpayPaymentId, razorpaySignature } (the three values Razorpay returns)
 * Returns: Promise<Order> with status "paid"
 * Errors: 400 "invalid_signature" or "amount_mismatch".
 */
export async function verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const { data } = await apiClient.post('/payments/verify/', {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  })
  return normalizeOrder(data)
}

/**
 * Purpose: payment details again for an unpaid order (widget closed, payment failed).
 * Endpoint: POST /orders/{orderNumber}/pay/
 * Params: orderNumber: string
 * Returns: Promise<{ gateway, keyId, gatewayOrderId, amount, currency }>
 * Errors: 409 "order_not_payable" when the order is no longer awaiting payment.
 */
export async function getPaymentForOrder(orderNumber) {
  const { data } = await apiClient.post(`/orders/${encodeURIComponent(orderNumber)}/pay/`)
  return normalizePayment(data)
}

/**
 * Purpose: order history (newest first).
 * Endpoint: GET /orders/
 * Params: { page = 1, pageSize = 20 }
 * Returns: Promise<{ count, page, pageSize, totalPages, hasNext, hasPrevious,
 *          results: [{ number, status, statusLabel, total, currency, itemCount, createdAt }] }>
 */
export async function listOrders({ page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get('/orders/', { params: { page, page_size: pageSize } })
  return normalizePage(data, normalizeOrder)
}

/**
 * Purpose: one order with items, address snapshot and status timeline.
 * Endpoint: GET /orders/{orderNumber}/
 * Params: orderNumber: string
 * Returns: Promise<Order> (list fields plus subtotal, shippingFee, paidAt, expiresAt,
 *          trackingNote, notes, shippingAddress, items, events)
 * Errors: 404 when it is not the user's order.
 */
export async function getOrder(orderNumber) {
  const { data } = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/`)
  return normalizeOrder(data)
}

/**
 * Purpose: cancel an unpaid order and release its reserved stock.
 * Endpoint: POST /orders/{orderNumber}/cancel/
 * Params: orderNumber: string
 * Returns: Promise<Order> with status "cancelled"
 * Errors: 409 "cannot_cancel" for paid orders.
 */
export async function cancelOrder(orderNumber) {
  const { data } = await apiClient.post(`/orders/${encodeURIComponent(orderNumber)}/cancel/`)
  return normalizeOrder(data)
}
