/**
 * NutraAI Labs API service layer. Import everything from here:
 *
 *   import { loginUser, listProducts, getErrorMessage } from '../services/api'
 *
 * Sections (one file each) and the pages that use them
 *   authApi.js          login, register, session restore, logout, password reset
 *   accountApi.js       change password/email, delete account, preferences  (SettingsPage)
 *   profileApi.js       profile, avatar, consents, addresses                (HealthProfilePage, checkout)
 *   assessmentApi.js    health assessment                                   (HealthAssessmentPage)
 *   catalogApi.js       products, categories, facets                        (ProductsPage, ProductDetailsPage, MarketplacePage)
 *   cartApi.js          cart                                                (CommercePages)
 *   orderApi.js         checkout, payment, orders                           (CommercePages, OrdersPage, OrderDetailsPage)
 *   wellnessApi.js      dashboard summary, report, plan, recommendations    (DashboardPages, WellnessPlanPage)
 *   progressApi.js      progress and check-ins                              (ProgressPage)
 *   assistantApi.js     AI assistant                                        (AssistantPage)
 *   subscriptionApi.js  membership, supplement subscriptions, billing       (SubscriptionDashboard, Membership)
 *   notificationApi.js  notifications                                       (NotificationsPage, DashboardLayout)
 *   publicApi.js        health check, contact form                          (ContactPage)
 *   core.js             token handling, interceptors, error helpers
 *
 * Functions marked "[NOT IN BACKEND YET]" call proposed endpoints and fail with 404 until the
 * backend module exists; test with isNotImplemented(error) to keep the existing
 * "unavailable" screens.
 */
export {
  getAccessToken,
  getApiError,
  getErrorMessage,
  getFieldErrors,
  hasSession,
  isNotImplemented,
  onSessionExpired,
  setAccessToken,
} from './core.js'
export * from './authApi.js'
export * from './accountApi.js'
export * from './profileApi.js'
export * from './assessmentApi.js'
export * from './catalogApi.js'
export * from './cartApi.js'
export * from './orderApi.js'
export * from './wellnessApi.js'
export * from './progressApi.js'
export * from './assistantApi.js'
export * from './subscriptionApi.js'
export * from './notificationApi.js'
export * from './publicApi.js'
