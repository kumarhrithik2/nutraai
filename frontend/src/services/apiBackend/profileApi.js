/**
 * Section: Profile, avatar, consents and addresses
 * Pages: HealthProfilePage (profile, avatar), CommercePages checkout (addresses).
 */
import { apiClient } from './core.js'

function normalizeProfile(profile) {
  return {
    name: profile.full_name,
    email: profile.email,
    phone: profile.phone || '',
    dateOfBirth: profile.date_of_birth || '',
    gender: profile.gender || '',
    avatarUrl: profile.avatar_url || '',
  }
}

function normalizeConsent(c) {
  return {
    kind: c.kind,
    accepted: c.accepted,
    version: c.version,
    currentVersion: c.current_version,
    upToDate: c.up_to_date,
    recordedAt: c.recorded_at,
  }
}

function normalizeAddress(a) {
  return {
    id: a.id,
    label: a.label || '',
    name: a.full_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || '',
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    isDefault: a.is_default,
  }
}

function addressBody(a) {
  const body = {}
  if (a.label !== undefined) body.label = a.label
  if (a.name !== undefined) body.full_name = a.name
  if (a.phone !== undefined) body.phone = a.phone
  if (a.line1 !== undefined) body.line1 = a.line1
  if (a.line2 !== undefined) body.line2 = a.line2
  if (a.city !== undefined) body.city = a.city
  if (a.state !== undefined) body.state = a.state
  if (a.pincode !== undefined) body.pincode = a.pincode
  if (a.isDefault !== undefined) body.is_default = Boolean(a.isDefault)
  return body
}

/* --------------------------------- profile --------------------------------- */

/**
 * Purpose: load the signed-in user's profile.
 * Endpoint: GET /profile/
 * Params: none
 * Returns: Promise<{ name, email, phone, dateOfBirth, gender, avatarUrl }>
 */
export async function getProfile() {
  const { data } = await apiClient.get('/profile/')
  return normalizeProfile(data)
}

/**
 * Purpose: save profile changes. Send only what changed.
 * Endpoint: PATCH /profile/
 * Params: { name?, phone?, dateOfBirth? ('YYYY-MM-DD' or ''), gender? }
 * Returns: Promise<Profile>
 * Note: the page's "General wellness focus" and "Routine preference" selects have no backend field.
 * Errors: 400 field errors (phone not a 10-digit Indian mobile, under 18, ...).
 */
export async function updateProfile({ name, phone, dateOfBirth, gender }) {
  const body = {}
  if (name !== undefined) body.full_name = name
  if (phone !== undefined) body.phone = phone
  if (dateOfBirth !== undefined) body.date_of_birth = dateOfBirth || null
  if (gender !== undefined) body.gender = gender
  const { data } = await apiClient.patch('/profile/', body)
  return normalizeProfile(data)
}

/**
 * Purpose: upload the profile picture.
 * Endpoint: POST /profile/avatar/  (multipart/form-data, field "avatar")
 * Params: file: File (JPEG, PNG or WebP, up to 5 MB)
 * Returns: Promise<Profile> (with the new avatarUrl)
 */
export async function uploadAvatar(file) {
  const form = new FormData()
  form.append('avatar', file)
  const { data } = await apiClient.post('/profile/avatar/', form)
  return normalizeProfile(data)
}

/**
 * Purpose: remove the profile picture.
 * Endpoint: DELETE /profile/avatar/
 * Params: none
 * Returns: Promise<void>
 */
export async function removeAvatar() {
  await apiClient.delete('/profile/avatar/')
}

/**
 * Purpose: static select options (genders, Indian states, consent versions). No login needed.
 * Endpoint: GET /profile/options/
 * Params: none
 * Returns: Promise<{ genders: [{ value, label }], states: string[], consentVersions: object }>
 */
export async function getProfileOptions() {
  const { data } = await apiClient.get('/profile/options/', { skipAuth: true, skipRefresh: true })
  return { genders: data.genders, states: data.states, consentVersions: data.consent_versions }
}

/* -------------------------------- consents --------------------------------- */

/**
 * Purpose: the user's current consent status for each kind.
 * Endpoint: GET /profile/consents/
 * Params: none
 * Returns: Promise<[{ kind, accepted, version, currentVersion, upToDate, recordedAt }]>
 */
export async function getConsents() {
  const { data } = await apiClient.get('/profile/consents/')
  return data.map(normalizeConsent)
}

/**
 * Purpose: grant or withdraw one consent (recorded with version, time and IP).
 * Endpoint: POST /profile/consents/
 * Params: kind: 'terms_privacy' | 'health_data' | 'disclaimer' | 'marketing', accepted: boolean
 * Returns: Promise<Consent[]> the updated status of all kinds
 */
export async function saveConsent(kind, accepted) {
  const { data } = await apiClient.post('/profile/consents/', { kind, accepted: Boolean(accepted) })
  return data.map(normalizeConsent)
}

/* -------------------------------- addresses -------------------------------- */

/**
 * Purpose: all saved delivery addresses (default first).
 * Endpoint: GET /addresses/
 * Params: none
 * Returns: Promise<Address[]> Address = { id, label, name, phone, line1, line2, city, state, pincode, isDefault }
 */
export async function listAddresses() {
  const { data } = await apiClient.get('/addresses/', { params: { page_size: 100 } })
  return data.results.map(normalizeAddress)
}

/**
 * Purpose: one saved address.
 * Endpoint: GET /addresses/{id}/
 * Params: id: number
 * Returns: Promise<Address>
 */
export async function getAddress(id) {
  const { data } = await apiClient.get(`/addresses/${id}/`)
  return normalizeAddress(data)
}

/**
 * Purpose: add an address (the first one becomes the default).
 * Endpoint: POST /addresses/
 * Params: { name, phone, line1, line2?, city, state, pincode, label?, isDefault? }
 * Returns: Promise<Address>
 * Errors: 400 (invalid phone / PIN code / state, or the 10-address limit).
 */
export async function createAddress(address) {
  const { data } = await apiClient.post('/addresses/', addressBody(address))
  return normalizeAddress(data)
}

/**
 * Purpose: edit an address. Send only what changed.
 * Endpoint: PATCH /addresses/{id}/
 * Params: id: number, changes: partial of the createAddress fields
 * Returns: Promise<Address>
 */
export async function updateAddress(id, changes) {
  const { data } = await apiClient.patch(`/addresses/${id}/`, addressBody(changes))
  return normalizeAddress(data)
}

/**
 * Purpose: delete an address (another one becomes the default).
 * Endpoint: DELETE /addresses/{id}/
 * Params: id: number
 * Returns: Promise<void>
 */
export async function deleteAddress(id) {
  await apiClient.delete(`/addresses/${id}/`)
}
