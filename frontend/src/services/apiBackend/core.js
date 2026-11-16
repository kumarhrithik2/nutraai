/**
 * Shared plumbing for every API module. Pages never import this file directly except for the
 * error helpers (getErrorMessage, getFieldErrors, isNotImplemented), which index.js re-exports.
 *
 * Responsibilities
 *  - Reuses the existing axios instance (../apiClient.js); no second client is created.
 *  - Sends the refresh cookie (withCredentials) and keeps the access token in memory only.
 *  - Adds "Authorization: Bearer" to requests and refreshes once on a 401, then retries.
 *  - Normalises every failure to { status, code, message, details }.
 *
 * Needs frontend/.env:  VITE_API_BASE_URL=http://localhost:8000/api/v1
 */
import apiClient from '../apiClient.js'

apiClient.defaults.withCredentials = true
apiClient.defaults.timeout = Math.max(apiClient.defaults.timeout || 0, 15000)

export { apiClient }

export const UNKNOWN_ANSWER = "I don't know"
const SESSION_EXPIRED_EVENT = 'nutraai:session-expired'

let accessToken = null
let refreshPromise = null

/* ------------------------------ token + session ------------------------------ */

/**
 * Purpose: read the in-memory access token.
 * Endpoint: none (local state).
 * Returns: string | null
 */
export function getAccessToken() {
  return accessToken
}

/**
 * Purpose: store (or clear, with a falsy value) the in-memory access token.
 * Endpoint: none (local state).
 * Params: token: string | null
 */
export function setAccessToken(token) {
  accessToken = token || null
}

/**
 * Purpose: tell whether a signed-in session exists in this tab.
 * Endpoint: none (local state).
 * Returns: boolean
 */
export function hasSession() {
  return Boolean(accessToken)
}

/**
 * Purpose: run a callback when the session can no longer be refreshed (forced logout).
 * Endpoint: none (browser event).
 * Params: callback: () => void
 * Returns: unsubscribe function
 */
export function onSessionExpired(callback) {
  window.addEventListener(SESSION_EXPIRED_EVENT, callback)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback)
}

/**
 * Purpose: swap the refresh cookie for a new access token (one request at a time).
 * Endpoint: POST /auth/refresh/
 * Params: none (the HTTP-only cookie is sent by the browser)
 * Returns: Promise<string> the new access token; rejects when the session is gone.
 */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh/', null, { skipAuth: true, skipRefresh: true })
      .then((response) => {
        setAccessToken(response.data.access)
        return response.data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/* --------------------------------- errors ---------------------------------- */

function readError(error) {
  const status = error?.response?.status ?? 0
  const body = error?.response?.data?.error
  if (body) {
    return { status, code: body.code || 'error', message: body.message || '', details: body.details || null }
  }
  if (status === 429) {
    return { status, code: 'throttled', message: 'Too many requests. Please wait a moment and try again.', details: null }
  }
  if (!error?.response) {
    return { status: 0, code: 'network_error', message: 'Cannot reach the server. Check your connection and try again.', details: null }
  }
  return { status, code: 'error', message: 'Something went wrong. Please try again.', details: null }
}

apiClient.interceptors.request.use((config) => {
  if (!config.skipAuth && accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config
    if (error?.response?.status === 401 && config && !config.skipRefresh && !config._retried) {
      config._retried = true
      try {
        const token = await refreshAccessToken()
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
        return apiClient(config)
      } catch {
        setAccessToken(null)
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
    }
    error.apiError = readError(error)
    return Promise.reject(error)
  },
)

/**
 * Purpose: the normalised error for any thrown value.
 * Endpoint: none.
 * Params: error: unknown (anything caught from an API call)
 * Returns: { status: number, code: string, message: string, details: object | null }
 */
export function getApiError(error) {
  return error?.apiError || readError(error)
}

/**
 * Purpose: a message safe to show in a banner or form status line.
 * Endpoint: none.
 * Params: error: unknown, fallback?: string
 * Returns: string
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return getApiError(error).message || fallback
}

/**
 * Purpose: detect "this backend feature is not built yet" so the page can keep its existing
 * "unavailable" screen instead of showing an error.
 * Endpoint: none.
 * Params: error: unknown
 * Returns: boolean (true for HTTP 404 / 405)
 */
export function isNotImplemented(error) {
  const status = getApiError(error).status
  return status === 404 || status === 405
}

/** Backend field name -> the name the frontend forms already use. */
const FIELD_NAMES = {
  full_name: 'name',
  confirm_password: 'confirmPassword',
  accept_terms: 'terms',
  current_password: 'currentPassword',
  new_password: 'newPassword',
  new_email: 'newEmail',
  date_of_birth: 'dateOfBirth',
  height_cm: 'height',
  weight_kg: 'weight',
  sleep_hours: 'sleepHours',
  exercise_days: 'exerciseDays',
  stress_level: 'stressLevel',
  work_type: 'workType',
  sun_exposure: 'sunExposure',
  diet_type: 'dietType',
  goals: 'healthGoals',
  takes_medicines: 'regularMedicines',
  medicines: 'medicineNames',
  past_deficiencies: 'deficiencies',
  health_data_consent: 'healthDataConsent',
  disclaimer_accepted: 'disclaimerConsent',
  address_id: 'addressId',
  email_updates: 'emailUpdates',
  reminder_time: 'reminderTime',
  reminder_channel: 'reminderChannel',
}

/**
 * Purpose: per-field validation messages from a 400 response, keyed like the form's own fields.
 * Endpoint: none.
 * Params: error: unknown
 * Returns: { [fieldName]: string } (non-field errors are under "form"); {} when none.
 */
export function getFieldErrors(error) {
  const details = getApiError(error).details
  const result = {}
  if (!details || typeof details !== 'object') return result
  for (const [key, value] of Object.entries(details)) {
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first !== 'string') continue
    result[key === 'non_field_errors' ? 'form' : FIELD_NAMES[key] || key] = first
  }
  return result
}

/* -------------------------------- utilities -------------------------------- */

/** Drops undefined / null / '' so optional query params and body keys are not sent. */
export function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

/** "199.00" -> 199 (the API returns money as strings). */
export function money(value) {
  return value === null || value === undefined ? null : Number(value)
}

/** Shared shape for every paginated list. */
export function normalizePage(data, mapItem) {
  return {
    count: data.count,
    page: data.page,
    pageSize: data.page_size,
    totalPages: data.total_pages,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
    results: data.results.map(mapItem),
  }
}
