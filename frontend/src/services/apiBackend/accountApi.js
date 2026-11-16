/**
 * Section: Account and settings  (pages/DashboardExtraPages.jsx: SettingsPage)
 */
import { apiClient, setAccessToken } from './core.js'
import { normalizeUser } from './authApi.js'

function normalizePreferences(data) {
  return {
    emailUpdates: data.email_updates,
    reminders: data.reminders,
    reminderTime: data.reminder_time || '',
    reminderChannel: data.reminder_channel || '',
  }
}

/**
 * Purpose: change the password. Signs out every other device; this one gets a fresh token.
 * Endpoint: POST /me/change-password/
 * Params: { currentPassword, newPassword }
 * Returns: Promise<void>
 * Errors: 400 field errors (wrong current password, weak or unchanged new password).
 */
export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await apiClient.post('/me/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  setAccessToken(data.access)
}

/**
 * Purpose: change the login email (requires the password).
 * Endpoint: POST /me/change-email/
 * Params: { newEmail, password }
 * Returns: Promise<User>
 * Errors: 400 (wrong password, email already used).
 */
export async function changeEmail({ newEmail, password }) {
  const { data } = await apiClient.post('/me/change-email/', { new_email: newEmail, password })
  return normalizeUser(data)
}

/**
 * Purpose: permanently delete the account and personal data, then sign out.
 * Endpoint: POST /me/delete/
 * Params: { password }
 * Returns: Promise<void>
 * Errors: 400 when the password is wrong.
 */
export async function deleteAccount({ password }) {
  await apiClient.post('/me/delete/', { password })
  setAccessToken(null)
}

/**
 * Purpose: communication preferences (Settings page, assessment "Preferences" step).
 * Endpoint: GET /settings/preferences/   [NOT IN BACKEND YET: fails with 404]
 * Params: none
 * Returns: Promise<{ emailUpdates, reminders, reminderTime, reminderChannel }>
 */
export async function getPreferences() {
  const { data } = await apiClient.get('/settings/preferences/')
  return normalizePreferences(data)
}

/**
 * Purpose: save communication preferences.
 * Endpoint: PUT /settings/preferences/   [NOT IN BACKEND YET: fails with 404]
 * Params: { emailUpdates, reminders, reminderTime?, reminderChannel? }
 * Returns: Promise<{ emailUpdates, reminders, reminderTime, reminderChannel }>
 */
export async function updatePreferences({ emailUpdates, reminders, reminderTime, reminderChannel }) {
  const { data } = await apiClient.put('/settings/preferences/', {
    email_updates: Boolean(emailUpdates),
    reminders: Boolean(reminders),
    reminder_time: reminderTime || null,
    reminder_channel: reminderChannel || null,
  })
  return normalizePreferences(data)
}
