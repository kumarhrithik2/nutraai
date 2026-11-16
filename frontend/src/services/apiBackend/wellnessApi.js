/**
 * Section: Wellness  (pages/DashboardPages.jsx: DashboardOverview, WellnessReportPage,
 * RecommendationsPage; pages/DashboardExtraPages.jsx: WellnessPlanPage)
 */
import { apiClient } from './core.js'
import { getCurrentUser } from './authApi.js'
import { getProfile } from './profileApi.js'
import { getLatestAssessment } from './assessmentApi.js'
import { getCart } from './cartApi.js'
import { listOrders } from './orderApi.js'
import { normalizeProduct } from './catalogApi.js'

function normalizeRecommendation(r) {
  return {
    id: r.id,
    createdAt: r.created_at,
    items: (r.items || []).map((item) => ({
      id: item.id,
      product: normalizeProduct(item.product),
      reason: item.reason,
      note: item.note || '',
      flagged: Boolean(item.flagged),
    })),
  }
}

/**
 * Purpose: data for the dashboard overview in one call: user, profile, latest assessment,
 * cart size and the most recent orders. Built from live endpoints; a failing part is null.
 * Endpoint: GET /me/, /profile/, /assessments/latest/, /cart/, /orders/ (in parallel)
 * Params: none
 * Returns: Promise<{ user, profile, latestAssessment, cartItemCount, recentOrders }>
 */
export async function getDashboardSummary() {
  const [user, profile, latestAssessment, cart, orders] = await Promise.allSettled([
    getCurrentUser(),
    getProfile(),
    getLatestAssessment(),
    getCart(),
    listOrders({ pageSize: 3 }),
  ])
  const value = (result) => (result.status === 'fulfilled' ? result.value : null)
  return {
    user: value(user),
    profile: value(profile),
    latestAssessment: value(latestAssessment),
    cartItemCount: value(cart)?.itemCount ?? 0,
    recentOrders: value(orders)?.results ?? [],
  }
}

/**
 * Purpose: the personalised wellness report built from the latest assessment.
 * Endpoint: GET /reports/latest/   [NOT IN BACKEND YET: fails with 404]
 * Params: none
 * Returns: Promise<object> (report sections; shape defined when the backend module exists)
 */
export async function getWellnessReport() {
  const { data } = await apiClient.get('/reports/latest/')
  return data
}

/**
 * Purpose: the user's wellness plan (RecommendationsPage "Wellness plan" tab and WellnessPlanPage).
 * Endpoint: GET /wellness-plan/   [NOT IN BACKEND YET: fails with 404]
 * Params: none
 * Returns: Promise<object> (plan; shape defined when the backend module exists)
 */
export async function getWellnessPlan() {
  const { data } = await apiClient.get('/wellness-plan/')
  return data
}

/**
 * Purpose: the newest product suggestions with plain-language reasons
 * (RecommendationsPage "Recommended products" tab).
 * Endpoint: GET /recommendations/latest/   [NOT IN BACKEND YET: fails with 404]
 * Params: none
 * Returns: Promise<{ id, createdAt, items: [{ id, product, reason, note, flagged }] }>
 */
export async function getLatestRecommendation() {
  const { data } = await apiClient.get('/recommendations/latest/')
  return normalizeRecommendation(data)
}

/**
 * Purpose: one saved set of suggestions.
 * Endpoint: GET /recommendations/{id}/   [NOT IN BACKEND YET: fails with 404]
 * Params: id: number
 * Returns: Promise<Recommendation>
 */
export async function getRecommendation(id) {
  const { data } = await apiClient.get(`/recommendations/${id}/`)
  return normalizeRecommendation(data)
}

/**
 * Purpose: record feedback on a suggestion (helpful / not helpful / added to cart).
 * Endpoint: POST /recommendations/{recommendationId}/feedback/   [NOT IN BACKEND YET]
 * Params: recommendationId: number, itemId: number,
 *         action: 'helpful' | 'not_helpful' | 'viewed' | 'added_to_cart'
 * Returns: Promise<void>
 */
export async function sendRecommendationFeedback(recommendationId, itemId, action) {
  await apiClient.post(`/recommendations/${recommendationId}/feedback/`, { item_id: itemId, action })
}
