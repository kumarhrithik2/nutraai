/**
 * Section: Cart  (pages/CommercePages.jsx, page="cart"; header cart link)
 * Every call returns the full updated cart, so the page can replace its state with the result.
 */
import { apiClient, money } from './core.js'
import { normalizeProduct } from './catalogApi.js'

/** Backend cart -> { items, itemCount, subtotal, shippingFee, total, freeShippingRemaining } */
function normalizeCart(cart) {
  return {
    items: cart.items.map((item) => ({
      product: normalizeProduct(item.product),
      quantity: item.quantity,
      unitPrice: money(item.unit_price),
      lineTotal: money(item.line_total),
      available: item.available,
    })),
    itemCount: cart.item_count,
    subtotal: money(cart.subtotal),
    shippingFee: money(cart.shipping_fee),
    total: money(cart.total),
    freeShippingRemaining: money(cart.free_shipping_remaining),
  }
}

/**
 * Purpose: the user's cart with totals and shipping.
 * Endpoint: GET /cart/
 * Params: none
 * Returns: Promise<Cart> { items: [{ product, quantity, unitPrice, lineTotal, available }],
 *          itemCount, subtotal, shippingFee, total, freeShippingRemaining }  (money in INR)
 */
export async function getCart() {
  const { data } = await apiClient.get('/cart/')
  return normalizeCart(data)
}

/**
 * Purpose: add a product (adds to the quantity already in the cart).
 * Endpoint: POST /cart/items/
 * Params: productId: number, quantity = 1
 * Returns: Promise<Cart>
 * Errors: 404 unavailable, 409 code "insufficient_stock", 400 code "quantity_limit" (max 10 each).
 */
export async function addToCart(productId, quantity = 1) {
  const { data } = await apiClient.post('/cart/items/', { product_id: productId, quantity })
  return normalizeCart(data)
}

/**
 * Purpose: set the exact quantity of a cart item.
 * Endpoint: PATCH /cart/items/{productId}/
 * Params: productId: number, quantity: number (1 or more)
 * Returns: Promise<Cart>   Errors: as addToCart; 404 when the item is not in the cart.
 */
export async function updateCartItem(productId, quantity) {
  const { data } = await apiClient.patch(`/cart/items/${productId}/`, { quantity })
  return normalizeCart(data)
}

/**
 * Purpose: remove one product from the cart.
 * Endpoint: DELETE /cart/items/{productId}/
 * Params: productId: number
 * Returns: Promise<Cart>
 */
export async function removeCartItem(productId) {
  const { data } = await apiClient.delete(`/cart/items/${productId}/`)
  return normalizeCart(data)
}

/**
 * Purpose: empty the cart.
 * Endpoint: DELETE /cart/
 * Params: none
 * Returns: Promise<void>
 */
export async function clearCart() {
  await apiClient.delete('/cart/')
}
