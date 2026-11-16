/**
 * Section: Health assessment  (pages/HealthAssessmentPage.jsx)
 * The page keeps answers as display labels ('Non-veg', 'Bone and joint', ...). This module
 * converts them to the backend's values, so the page only passes its own `answers` object.
 */
import { apiClient, UNKNOWN_ANSWER, compact, getApiError, normalizePage } from './core.js'

const GENDERS = { Female: 'female', Male: 'male', Other: 'other', 'Prefer not to say': 'prefer_not_to_say' }
const WORK_TYPES = { Desk: 'desk', Field: 'field', Student: 'student', Homemaker: 'homemaker', Retired: 'retired' }
const SUN = { Low: 'low', Medium: 'medium', High: 'high' }
const DIETS = { Vegetarian: 'vegetarian', Vegan: 'vegan', Eggetarian: 'eggetarian', 'Non-veg': 'non_veg' }
const GOALS = {
  Energy: 'energy',
  Immunity: 'immunity',
  Sleep: 'sleep',
  Stress: 'stress',
  'Bone and joint': 'bone_joint',
  Heart: 'heart',
  'Hair, skin and nails': 'hair_skin_nails',
  Muscle: 'muscle',
  Digestion: 'digestion',
}
const CONDITIONS = {
  Diabetes: 'diabetes',
  Thyroid: 'thyroid',
  'Blood pressure': 'blood_pressure',
  Heart: 'heart',
  Kidney: 'kidney',
  Liver: 'liver',
  PCOS: 'pcos',
  Other: 'other',
  None: 'none',
}
const ALLERGIES = {
  Nuts: 'nuts',
  Soy: 'soy',
  Dairy: 'dairy',
  Gluten: 'gluten',
  Fish: 'fish',
  Shellfish: 'shellfish',
  Other: 'other',
  None: 'none',
}
const DEFICIENCIES = { 'Vitamin D': 'vitamin_d', B12: 'b12', Iron: 'iron', None: 'none_unknown', Unknown: 'none_unknown' }

const unique = (list) => [...new Set(list)]

/** "I don't know" has no backend value for conditions/allergies; 'other' keeps safety checks cautious. */
function mapChoices(values, table) {
  return unique((values || []).map((v) => (v === UNKNOWN_ANSWER ? 'other' : table[v])).filter(Boolean))
}

function normalizeAssessment(a) {
  return {
    id: a.id,
    bmi: a.bmi === undefined ? undefined : Number(a.bmi),
    ageBand: a.age_band,
    answers: a.answers,
    createdAt: a.created_at,
  }
}

/**
 * Purpose: convert the page's `answers` object into the backend request body.
 * Endpoint: none (pure function; used by submitAssessment).
 * Params: answers: the HealthAssessmentPage answers state
 * Returns: object. Differences from the form: height is rounded to whole cm; "I don't know"
 *          for conditions/allergies is sent as 'other'; the "other condition/allergy" text and
 *          the check-in/preference steps are not part of this request.
 */
export function buildAssessmentPayload(answers) {
  const medicines = answers.regularMedicines
  const deficiencies = unique((answers.deficiencies || []).map((v) => DEFICIENCIES[v]).filter(Boolean))
  return compact({
    age: Number(answers.age),
    gender: GENDERS[answers.gender],
    height_cm: Math.round(Number(answers.height)),
    weight_kg: Number(Number(answers.weight).toFixed(1)),
    pregnant: answers.gender === 'Female' ? answers.pregnant === 'Yes' : false,
    work_type: WORK_TYPES[answers.workType],
    sleep_hours: Number(answers.sleepHours ?? 7),
    exercise_days: Number(answers.exerciseDays),
    stress_level: Number(answers.stressLevel),
    sun_exposure: SUN[answers.sunExposure],
    diet_type: DIETS[answers.dietType],
    goals: unique((answers.healthGoals || []).map((v) => GOALS[v]).filter(Boolean)),
    conditions: mapChoices(answers.conditions, CONDITIONS),
    takes_medicines: medicines === 'Yes' || medicines === UNKNOWN_ANSWER,
    medicines:
      medicines === 'Yes'
        ? String(answers.medicineNames || '').trim()
        : medicines === UNKNOWN_ANSWER
          ? 'Not sure (customer unsure)'
          : '',
    allergies: mapChoices(answers.allergies, ALLERGIES),
    past_deficiencies: deficiencies.length ? deficiencies : undefined,
    health_data_consent: Boolean(answers.healthDataConsent),
    disclaimer_accepted: Boolean(answers.disclaimerConsent),
  })
}

/**
 * Purpose: the form definition (steps, fields, options) served by the backend.
 * Endpoint: GET /assessment/questions/
 * Params: none
 * Returns: Promise<{ version: string, steps: [{ id, title, fields: [...] }] }>
 */
export async function getAssessmentQuestions() {
  const { data } = await apiClient.get('/assessment/questions/')
  return data
}

/**
 * Purpose: submit the completed form. Also records the health-data and disclaimer consents.
 * Endpoint: POST /assessments/
 * Params: answers: the page's answers object (see buildAssessmentPayload)
 * Returns: Promise<{ id, bmi, ageBand, answers, createdAt }>
 * Errors: 400 field errors (use getFieldErrors), 429 (10 submissions per hour).
 */
export async function submitAssessment(answers) {
  const { data } = await apiClient.post('/assessments/', buildAssessmentPayload(answers))
  return normalizeAssessment(data)
}

/**
 * Purpose: the user's assessment history (newest first).
 * Endpoint: GET /assessments/
 * Params: { page = 1, pageSize = 20 }
 * Returns: Promise<{ count, page, pageSize, totalPages, hasNext, hasPrevious, results: [{ id, bmi, ageBand, createdAt }] }>
 */
export async function listAssessments({ page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get('/assessments/', { params: { page, page_size: pageSize } })
  return normalizePage(data, normalizeAssessment)
}

/**
 * Purpose: the most recent assessment.
 * Endpoint: GET /assessments/latest/
 * Params: none
 * Returns: Promise<Assessment | null> (null when the user has not taken it yet)
 */
export async function getLatestAssessment() {
  try {
    const { data } = await apiClient.get('/assessments/latest/')
    return normalizeAssessment(data)
  } catch (error) {
    if (getApiError(error).status === 404) return null
    throw error
  }
}

/**
 * Purpose: one assessment by id (own assessments only).
 * Endpoint: GET /assessments/{id}/
 * Params: id: number
 * Returns: Promise<Assessment>   Errors: 404 when it is not the user's.
 */
export async function getAssessment(id) {
  const { data } = await apiClient.get(`/assessments/${id}/`)
  return normalizeAssessment(data)
}
