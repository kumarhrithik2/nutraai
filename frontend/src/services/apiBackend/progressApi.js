/**
 * Section: Progress tracking  (pages/DashboardPages.jsx: ProgressPage; assessment "Monthly check-in" step)
 * Both functions   [NOT IN BACKEND YET: fail with 404]
 */
import { apiClient, UNKNOWN_ANSWER, compact } from './core.js'

/**
 * Purpose: measurements and check-ins for a period (ProgressPage "Time period" select).
 * Endpoint: GET /progress/
 * Params: { days: 7 | 30 | 90 = 30 }  (the select's '7' / '30' / '90' values work as-is)
 * Returns: Promise<object> (series of check-ins; shape defined when the backend module exists)
 */
export async function getProgress({ days = 30 } = {}) {
  const { data } = await apiClient.get('/progress/', { params: { days: Number(days) } })
  return data
}

/**
 * Purpose: save a check-in. Pass the assessment page's check-in answers directly; empty and
 * "I don't know" values are left out.
 * Endpoint: POST /progress/
 * Params: { energyLevel?, waterIntake?, waterIntakeUnknown?, checkInWeight?, tookSupplements? ('Yes' | 'No') }
 * Returns: Promise<object> the saved entry
 */
export async function logProgress({ energyLevel, waterIntake, waterIntakeUnknown, checkInWeight, tookSupplements }) {
  const entry = compact({
    energy_level: energyLevel && energyLevel !== UNKNOWN_ANSWER ? Number(energyLevel) : undefined,
    water_intake_l: !waterIntakeUnknown && waterIntake ? Number(waterIntake) : undefined,
    weight_kg: checkInWeight ? Number(checkInWeight) : undefined,
    took_supplements: tookSupplements === 'Yes' ? true : tookSupplements === 'No' ? false : undefined,
  })
  const { data } = await apiClient.post('/progress/', entry)
  return data
}
