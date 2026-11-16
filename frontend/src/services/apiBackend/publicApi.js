/**
 * Section: Public site  (pages/PublicPages.jsx: ContactPage; app start-up checks)
 */
import { apiClient } from './core.js'

/**
 * Purpose: check the API is reachable and its database and cache are healthy.
 * Endpoint: GET /health/
 * Params: none
 * Returns: Promise<{ status: 'ok' | 'degraded', environment: string, checks: { database, cache } }>
 */
export async function getApiHealth() {
  const { data } = await apiClient.get('/health/', { skipAuth: true, skipRefresh: true })
  return data
}

/**
 * Purpose: send the contact form message.
 * Endpoint: POST /contact/   [NOT IN BACKEND YET: fails with 404]
 * Params: { name, email, message }  (the ContactPage form's field names)
 * Returns: Promise<void>
 */
export async function sendContactMessage({ name, email, message }) {
  await apiClient.post('/contact/', { name, email, message }, { skipAuth: true, skipRefresh: true })
}
