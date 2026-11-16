/**
 * Section: Authentication  (pages/AuthPage.jsx: login, register, forgot password)
 * Session state: access token in memory (core.js), refresh token in an HTTP-only cookie.
 */
import { apiClient, refreshAccessToken, setAccessToken } from './core.js'

/** Backend user -> { id, email, name, role, joinedAt } */
export function normalizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role,
    joinedAt: user.date_joined,
  }
}

/**
 * Purpose: create an account and sign in (stores the access token).
 * Endpoint: POST /auth/register/
 * Params: { name, email, password, confirmPassword, terms } (the AuthPage form's field names)
 * Returns: Promise<User> { id, email, name, role, joinedAt }
 * Errors: 400 with field errors (weak password, email already used, terms not accepted),
 *         503 when registration is closed, 429 when throttled.
 */
export async function registerUser({ name, email, password, confirmPassword, terms }) {
  const { data } = await apiClient.post(
    '/auth/register/',
    { full_name: name, email, password, confirm_password: confirmPassword, accept_terms: Boolean(terms) },
    { skipAuth: true, skipRefresh: true },
  )
  setAccessToken(data.access)
  return normalizeUser(data.user)
}

/**
 * Purpose: sign in with email and password (stores the access token).
 * Endpoint: POST /auth/login/
 * Params: { email, password }
 * Returns: Promise<User>
 * Errors: 401 code "invalid_credentials"; 429 when throttled.
 */
export async function loginUser({ email, password }) {
  const { data } = await apiClient.post('/auth/login/', { email, password }, { skipAuth: true, skipRefresh: true })
  setAccessToken(data.access)
  return normalizeUser(data.user)
}

/**
 * Purpose: the signed-in user.
 * Endpoint: GET /me/
 * Params: none
 * Returns: Promise<User>
 */
export async function getCurrentUser() {
  const { data } = await apiClient.get('/me/')
  return normalizeUser(data)
}

/**
 * Purpose: restore a session after a page reload (call once when the app starts).
 * Endpoint: POST /auth/refresh/ then GET /me/
 * Params: none
 * Returns: Promise<User | null> (null when nobody is signed in; never throws)
 */
export async function restoreSession() {
  try {
    await refreshAccessToken()
    return await getCurrentUser()
  } catch {
    setAccessToken(null)
    return null
  }
}

/**
 * Purpose: sign out and revoke the refresh token.
 * Endpoint: POST /auth/logout/
 * Params: none
 * Returns: Promise<void> (the local token is cleared even if the request fails)
 */
export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout/', null, { skipAuth: true, skipRefresh: true })
  } finally {
    setAccessToken(null)
  }
}

/**
 * Purpose: start a password reset email. Always resolves the same way so account existence
 * is not revealed.
 * Endpoint: POST /auth/password-reset/   [NOT IN BACKEND YET: fails with 404]
 * Params: { email }
 * Returns: Promise<void>
 */
export async function requestPasswordReset({ email }) {
  await apiClient.post('/auth/password-reset/', { email }, { skipAuth: true, skipRefresh: true })
}
