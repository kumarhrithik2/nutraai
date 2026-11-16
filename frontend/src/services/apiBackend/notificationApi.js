/**
 * Section: Notifications  (pages/DashboardExtraPages.jsx: NotificationsPage; bell in DashboardLayout)
 * Every function here   [NOT IN BACKEND YET: fails with 404]
 */
import { apiClient, normalizePage } from './core.js'

function normalizeNotification(n) {
  return { id: n.id, title: n.title, body: n.body, read: n.read, createdAt: n.created_at }
}

/**
 * Purpose: the notification list (newest first).
 * Endpoint: GET /notifications/
 * Params: { page = 1, pageSize = 20 }
 * Returns: Promise<{ count, page, pageSize, totalPages, hasNext, hasPrevious,
 *          results: [{ id, title, body, read, createdAt }] }>
 */
export async function listNotifications({ page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get('/notifications/', { params: { page, page_size: pageSize } })
  return normalizePage(data, normalizeNotification)
}

/**
 * Purpose: number for the bell badge.
 * Endpoint: GET /notifications/unread-count/
 * Params: none
 * Returns: Promise<number>
 */
export async function getUnreadNotificationCount() {
  const { data } = await apiClient.get('/notifications/unread-count/')
  return data.count
}

/**
 * Purpose: mark one notification as read.
 * Endpoint: POST /notifications/{id}/read/
 * Params: id: number
 * Returns: Promise<void>
 */
export async function markNotificationRead(id) {
  await apiClient.post(`/notifications/${id}/read/`)
}

/**
 * Purpose: mark all notifications as read.
 * Endpoint: POST /notifications/read-all/
 * Params: none
 * Returns: Promise<void>
 */
export async function markAllNotificationsRead() {
  await apiClient.post('/notifications/read-all/')
}
