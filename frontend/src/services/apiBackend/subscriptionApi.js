/**
 * Section: Subscriptions and billing  (components/subscriptions/SubscriptionDashboard.jsx and
 * components/home/Membership.jsx). Plan names, prices and feature lists stay in
 * ../membershipPlans.js; these calls only handle the user's own subscription state.
 * Every function here   [NOT IN BACKEND YET: fails with 404]
 */
import { apiClient } from './core.js'

/**
 * Purpose: the user's current membership (plan id 'free' | 'monthly' | 'yearly', status, renewal date).
 * Endpoint: GET /subscriptions/membership/
 * Params: none
 * Returns: Promise<object>
 */
export async function getMembership() {
  const { data } = await apiClient.get('/subscriptions/membership/')
  return data
}

/**
 * Purpose: choose or change the membership plan (Membership component onSelectPlan).
 * Endpoint: POST /subscriptions/membership/
 * Params: planId: 'free' | 'monthly' | 'yearly'
 * Returns: Promise<object> the updated membership (may include payment details for paid plans)
 */
export async function selectMembershipPlan(planId) {
  const { data } = await apiClient.post('/subscriptions/membership/', { plan: planId })
  return data
}

/**
 * Purpose: supplement delivery subscriptions ("Supplement deliveries" tab).
 * Endpoint: GET /subscriptions/supplements/
 * Params: none
 * Returns: Promise<object[]>
 */
export async function listSupplementSubscriptions() {
  const { data } = await apiClient.get('/subscriptions/supplements/')
  return data
}

/**
 * Purpose: pause, resume or cancel a subscription.
 * Endpoint: PATCH /subscriptions/{id}/
 * Params: id: number, action: 'pause' | 'resume' | 'cancel'
 * Returns: Promise<object> the updated subscription
 */
export async function updateSubscription(id, action) {
  const { data } = await apiClient.patch(`/subscriptions/${id}/`, { action })
  return data
}

/**
 * Purpose: invoices and charges ("Billing history" tab).
 * Endpoint: GET /billing/history/
 * Params: { page = 1, pageSize = 20 }
 * Returns: Promise<object> paginated list
 */
export async function getBillingHistory({ page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get('/billing/history/', { params: { page, page_size: pageSize } })
  return data
}
