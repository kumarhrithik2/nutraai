import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage, getFieldErrors, logProgress, submitAssessment, updatePreferences } from '../services/apiBackend/index.js'

const steps = [
  { title: 'About you', short: 'About you', description: 'Share only the information you are comfortable entering.' },
  { title: 'Lifestyle', short: 'Lifestyle', description: 'Share a little about your day-to-day routines.' },
  { title: 'Diet and goals', short: 'Goals', description: 'Choose a diet preference and up to three areas of interest.' },
  { title: 'Health history', short: 'History', description: 'Share only what you are comfortable recording; choose None or I don’t know where appropriate.' },
  { title: 'Consent', short: 'Consent', description: 'Review how your entries would be handled before continuing.' },
  { title: 'Monthly check-in', short: 'Check-in', description: 'Optional reflection. You can skip this step.' },
  { title: 'Preferences', short: 'Preferences', description: 'Optional reminder preferences.' },
  { title: 'Review', short: 'Review', description: 'Check your entries before submitting.' },
]

const healthGoals = [
  'Energy',
  'Immunity',
  'Sleep',
  'Stress',
  'Bone and joint',
  'Heart',
  'Hair, skin and nails',
  'Muscle',
  'Digestion',
]

const conditions = ['Diabetes', 'Thyroid', 'Blood pressure', 'Heart', 'Kidney', 'Liver', 'PCOS', 'Other', 'None', "I don't know"]
const allergies = ['Nuts', 'Soy', 'Dairy', 'Gluten', 'Fish', 'Shellfish', 'Other', 'None', "I don't know"]
const deficiencies = ['Vitamin D', 'B12', 'Iron', 'None', 'Unknown']
const exclusiveOptions = {
  conditions: ['None', "I don't know"],
  allergies: ['None', "I don't know"],
  deficiencies: ['None', 'Unknown'],
}

function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={`assessment-field ${className}`}>
      <div className="assessment-field__heading">
        <span className="assessment-field__label">{label}</span>
        {hint && <span className="assessment-field__hint">{hint}</span>}
      </div>
      {children}
      {error && <span className="assessment-field__error" role="alert">{error}</span>}
    </div>
  )
}

function SelectField({ id, value, onChange, children, ...props }) {
  return (
    <select id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props}>
      {children}
    </select>
  )
}

function ChoiceList({ name, options, value, onChange }) {
  return (
    <div className="assessment-choice-list">
      {options.map((option) => (
        <label className={`assessment-choice${value === option ? ' is-selected' : ''}`} key={option}>
          <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
          <span className="assessment-choice__mark" aria-hidden="true" />
          {option}
        </label>
      ))}
    </div>
  )
}

function MultiSelect({ name, options, values = [], onToggle, disabledOptions = [] }) {
  return (
    <div className="assessment-multi-select">
      {options.map((option) => {
        const selected = values.includes(option)
        const disabled = disabledOptions.includes(option)
        return (
          <label className={`assessment-chip${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`} key={option}>
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={selected}
              disabled={disabled}
              onChange={() => onToggle(option)}
            />
            <span aria-hidden="true">{selected && <Check size={13} />}</span>
            {option}
          </label>
        )
      })}
    </div>
  )
}

function AssessmentReview({ answers, onEdit }) {
  const rows = [
    ['About you', [
      ['Age', answers.age ? `${answers.age} years` : '—'],
      ['Gender', answers.gender || '—'],
      ['Height', answers.height ? `${answers.height} cm` : '—'],
      ['Weight', answers.weight ? `${answers.weight} kg` : '—'],
      ...(answers.gender === 'Female' ? [['Pregnancy', answers.pregnant || '—']] : []),
    ]],
    ['Lifestyle', [
      ['Work type', answers.workType || '—'],
      ['Sleep', answers.sleepHours ? `${answers.sleepHours} hours per night` : '—'],
      ['Exercise', answers.exerciseDays === '' || answers.exerciseDays == null ? '—' : `${answers.exerciseDays} days per week`],
      ['Stress', answers.stressLevel ? `${answers.stressLevel} / 5` : '—'],
      ['Sun exposure', answers.sunExposure || 'Not provided'],
    ]],
    ['Diet and goals', [
      ['Diet type', answers.dietType || '—'],
      ['Goals', answers.healthGoals?.join(', ') || '—'],
    ]],
    ['Health history', [
      ['Conditions', answers.conditions?.join(', ') || '—'],
      ['Other condition', answers.conditions?.includes('Other') ? answers.conditionOther || 'Not provided' : 'Not provided'],
      ['Regular medicines', answers.regularMedicines || '—'],
      ['Medicine names', answers.regularMedicines === 'Yes' ? answers.medicineNames || 'Not provided' : 'Not provided'],
      ['Allergies', answers.allergies?.join(', ') || '—'],
      ['Other allergy', answers.allergies?.includes('Other') ? answers.allergyOther || 'Not provided' : 'Not provided'],
      ['Past deficiencies', answers.deficiencies?.join(', ') || 'Not provided'],
    ]],
    ['Consent', [
      ['Health data consent', answers.healthDataConsent ? 'Accepted' : 'Not accepted'],
      ['Wellness disclaimer', answers.disclaimerConsent ? 'Accepted' : 'Not accepted'],
    ]],
    ['Monthly check-in · optional', [
      ['Energy', answers.energyLevel || 'Not provided'],
      ['Water intake', answers.waterIntakeUnknown ? "I don't know" : answers.waterIntake ? `${answers.waterIntake} L` : 'Not provided'],
      ['Check-in weight', answers.checkInWeight ? `${answers.checkInWeight} kg` : 'Not provided'],
      ['Took supplements today', answers.tookSupplements || 'Not provided'],
    ]],
    ['Preferences · optional', [
      ['Reminder time', answers.reminderTime || 'Not provided'],
      ['Reminder channel', answers.reminderChannel || 'Not provided'],
    ]],
  ]

  return (
    <div className="assessment-review">
      {rows.map(([title, entries], index) => (
        <section className="assessment-review__section" key={title}>
          <div className="assessment-review__heading">
            <h3>{title}</h3>
            <button type="button" className="assessment-edit-link" onClick={() => onEdit(index)}>
              Edit
            </button>
          </div>
          <dl>
            {entries.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>
      ))}
      <p className="assessment-review__consent">
        Health data consent: {answers.healthDataConsent ? 'Accepted' : 'Not accepted'} ·
        {' '}Wellness disclaimer: {answers.disclaimerConsent ? 'Accepted' : 'Not accepted'}
      </p>
    </div>
  )
}

export function HealthAssessmentPage() {
  const { isPreviewMode } = useAuth()
  const [assessment, setAssessment] = useState({ step: 0, answers: {} })
  const [submissionStatus, setSubmissionStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const answers = assessment.answers
  const step = Math.min(Math.max(Number(assessment.step) || 0, 0), steps.length - 1)
  const [errors, setErrors] = useState({})
  const [goalLimitNotice, setGoalLimitNotice] = useState('')
  const currentStep = steps[step]
  const percent = Math.round(((step + 1) / steps.length) * 100)

  function setAnswer(field, value) {
    setAssessment((current) => ({ ...current, answers: { ...current.answers, [field]: value } }))
    setErrors((previous) => ({ ...previous, [field]: '' }))
    setSubmissionStatus('')
  }

  function toggleMulti(field, value, max = Infinity) {
    const selected = Array.isArray(answers[field]) ? answers[field] : []
    const exclusive = exclusiveOptions[field] || []
    const backupField = `${field}BeforeExclusive`

    if (selected.includes(value)) {
      if (exclusive.includes(value)) {
        const restored = Array.isArray(answers[backupField]) ? answers[backupField] : []
        setAnswer(field, restored)
        setAnswer(backupField, [])
      } else {
        setAnswer(field, selected.filter((item) => item !== value))
      }
    } else if (exclusive.includes(value)) {
      const previousSelection = selected.some((item) => exclusive.includes(item))
        ? (Array.isArray(answers[backupField]) ? answers[backupField] : [])
        : selected
      setAnswer(backupField, previousSelection)
      setAnswer(field, [value])
    } else {
      const base = selected.filter((item) => !exclusive.includes(item))
      const preserved = exclusive.length && selected.some((item) => exclusive.includes(item))
        ? (Array.isArray(answers[backupField]) ? answers[backupField] : [])
        : []
      const next = [...new Set([...preserved, ...base, value])]
      if (next.length > max) {
        setGoalLimitNotice(`Choose up to ${max} goals. Remove one before adding another.`)
        return
      }
      setAnswer(field, next)
      setGoalLimitNotice('')
    }

    setErrors((previous) => ({ ...previous, [field]: '' }))
  }

  function validateStep(stepIndex) {
    const nextErrors = {}
    if (stepIndex === 0) {
      const age = Number(answers.age)
      const height = Number(answers.height)
      const weight = Number(answers.weight)
      if (!answers.age || !Number.isInteger(age) || age < 18 || age > 90) nextErrors.age = 'Enter an age from 18 to 90.'
      if (!answers.gender) nextErrors.gender = 'Select a gender option.'
      if (!answers.height || !Number.isFinite(height) || height <= 0) nextErrors.height = 'Enter a positive height in centimetres.'
      if (!answers.weight || !Number.isFinite(weight) || weight <= 0) nextErrors.weight = 'Enter a positive weight in kilograms.'
      if (answers.gender === 'Female' && !answers.pregnant) nextErrors.pregnant = 'Please select Yes or No.'
    }
    if (stepIndex === 1) {
      const sleep = Number(answers.sleepHours ?? 7)
      const exercise = Number(answers.exerciseDays)
      const stress = Number(answers.stressLevel)
      if (!answers.workType) nextErrors.workType = 'Select your work type.'
      if (sleep < 3 || sleep > 12) nextErrors.sleepHours = 'Choose a value from 3 to 12 hours.'
      if (answers.exerciseDays === '' || answers.exerciseDays == null || !Number.isInteger(exercise) || exercise < 0 || exercise > 7) nextErrors.exerciseDays = 'Enter 0 to 7 days.'
      if (!answers.stressLevel || stress < 1 || stress > 5) nextErrors.stressLevel = 'Select a stress level from 1 to 5.'
    }
    if (stepIndex === 2) {
      if (!answers.dietType) nextErrors.dietType = 'Select a diet type.'
      if (!Array.isArray(answers.healthGoals) || answers.healthGoals.length < 1) nextErrors.healthGoals = 'Choose at least one goal.'
    }
    if (stepIndex === 3) {
      if (!answers.conditions?.length) nextErrors.conditions = 'Select at least one option, including None or I don’t know if applicable.'
      if (!answers.regularMedicines) nextErrors.regularMedicines = 'Select Yes, No or I don’t know.'
      if (!answers.allergies?.length) nextErrors.allergies = 'Select at least one option, including None or I don’t know if applicable.'
    }
    if (stepIndex === 4) {
      if (!answers.healthDataConsent) nextErrors.healthDataConsent = 'Please accept the health data consent to continue.'
      if (!answers.disclaimerConsent) nextErrors.disclaimerConsent = 'Please accept the disclaimer to continue.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function moveTo(nextStep) {
    setAssessment((current) => ({ ...current, step: nextStep }))
    setErrors({})
    setGoalLimitNotice('')
    setSubmissionStatus('')
  }

  async function continueAssessment() {
    if (step < 5 && !validateStep(step)) return
    if (step === 1 && !answers.sleepHours) setAnswer('sleepHours', '7')
    if (step === steps.length - 1) {
      const stepValidity = [0, 1, 2, 3, 4].map(validateStep)
      const firstInvalid = stepValidity.indexOf(false)
      if (firstInvalid !== -1) {
        moveTo(firstInvalid)
        validateStep(firstInvalid)
        return
      }
      if (isPreviewMode) {
        setSubmissionStatus('Assessment submission is not available in preview mode. No data was sent.')
        return
      }
      if (isSubmitting) return
      setIsSubmitting(true)
      setSubmissionStatus('')
      try {
        const result = await submitAssessment(answers)
        // Best-effort: save optional check-in/preferences if provided (non-blocking, ignore not-implemented)
        const checkIn = { energyLevel: answers.energyLevel, waterIntake: answers.waterIntake, waterIntakeUnknown: answers.waterIntakeUnknown, checkInWeight: answers.checkInWeight, tookSupplements: answers.tookSupplements }
        if (answers.energyLevel || answers.waterIntake || answers.checkInWeight || answers.tookSupplements) {
          logProgress(checkIn).catch(() => {})
        }
        if (answers.reminderTime || answers.reminderChannel) {
          updatePreferences({ emailUpdates: false, reminders: Boolean(answers.reminderTime || answers.reminderChannel), reminderTime: answers.reminderTime || '', reminderChannel: answers.reminderChannel || '' }).catch(() => {})
        }
        setSubmitted(result)
        setSubmissionStatus(`Assessment submitted successfully. BMI: ${result.bmi}, Age band: ${result.ageBand}.`)
      } catch (error) {
        const fieldErrors = getFieldErrors(error)
        setErrors(fieldErrors)
        setSubmissionStatus(getErrorMessage(error, 'Could not submit the assessment.'))
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    moveTo(step + 1)
  }

  function fieldError(field) {
    return errors[field] || ''
  }

  function renderAboutYou() {
    return (
      <div className="assessment-fields-grid">
        <Field label="Age" hint="18–90 years" error={fieldError('age')}>
          <input aria-label="Age" type="number" min="18" max="90" step="1" value={answers.age ?? ''} onChange={(event) => setAnswer('age', event.target.value)} />
        </Field>
        <Field label="Gender" error={fieldError('gender')}>
          <SelectField aria-label="Gender" value={answers.gender} onChange={(value) => setAnswer('gender', value)}>
            <option value="">Select an option</option>
            {['Female', 'Male', 'Other', 'Prefer not to say'].map((option) => <option key={option}>{option}</option>)}
          </SelectField>
        </Field>
        <Field label="Height" hint="Centimetres (cm)" error={fieldError('height')}>
          <input aria-label="Height in centimetres" type="number" min="0.1" step="0.1" value={answers.height ?? ''} onChange={(event) => setAnswer('height', event.target.value)} />
        </Field>
        <Field label="Weight" hint="Kilograms (kg)" error={fieldError('weight')}>
          <input aria-label="Weight in kilograms" type="number" min="0.1" step="0.1" value={answers.weight ?? ''} onChange={(event) => setAnswer('weight', event.target.value)} />
        </Field>
        {answers.gender === 'Female' && (
          <Field label="Are you pregnant?" className="assessment-field--full" error={fieldError('pregnant')}>
            <ChoiceList name="pregnant" options={['Yes', 'No']} value={answers.pregnant} onChange={(value) => setAnswer('pregnant', value)} />
          </Field>
        )}
      </div>
    )
  }

  function renderLifestyle() {
    const stressLabels = ['Very low', 'Low', 'Moderate', 'High', 'Very high']
    return (
      <div className="assessment-fields-grid">
        <Field label="Work type" error={fieldError('workType')}>
          <SelectField aria-label="Work type" value={answers.workType} onChange={(value) => setAnswer('workType', value)}>
            <option value="">Select an option</option>
            {['Desk', 'Field', 'Student', 'Homemaker', 'Retired'].map((option) => <option key={option}>{option}</option>)}
          </SelectField>
        </Field>
        <Field label="Sleep per night" hint={`${answers.sleepHours ?? 7} hours`} error={fieldError('sleepHours')} className="assessment-field--full">
          <input className="assessment-range" aria-label="Sleep hours per night" type="range" min="3" max="12" step="1" value={answers.sleepHours ?? 7} onChange={(event) => setAnswer('sleepHours', event.target.value)} />
          <span className="assessment-range__ends"><span>3 hours</span><span>12 hours</span></span>
        </Field>
        <Field label="Exercise days per week" hint="0–7 days" error={fieldError('exerciseDays')}>
          <input aria-label="Exercise days per week" type="number" min="0" max="7" step="1" value={answers.exerciseDays ?? ''} onChange={(event) => setAnswer('exerciseDays', event.target.value)} />
        </Field>
        <Field label="Stress level" hint={answers.stressLevel ? stressLabels[Number(answers.stressLevel) - 1] : 'Choose 1–5'} error={fieldError('stressLevel')} className="assessment-field--full">
          <div className="assessment-scale" role="group" aria-label="Stress level from very low to very high">
            {stressLabels.map((label, index) => {
              const value = String(index + 1)
              return <button className={answers.stressLevel === value ? 'is-selected' : ''} type="button" key={value} aria-pressed={answers.stressLevel === value} onClick={() => setAnswer('stressLevel', value)}><span>{value}</span><small>{label}</small></button>
            })}
          </div>
        </Field>
        <Field label="Sun exposure" hint="Optional">
          <SelectField aria-label="Sun exposure" value={answers.sunExposure} onChange={(value) => setAnswer('sunExposure', value)}>
            <option value="">Choose if you know</option>
            {['Low', 'Medium', 'High', "I don't know"].map((option) => <option key={option}>{option}</option>)}
          </SelectField>
        </Field>
      </div>
    )
  }

  function renderDietAndGoals() {
    return (
      <div className="assessment-fields-grid">
        <Field label="Diet type" error={fieldError('dietType')}>
          <SelectField aria-label="Diet type" value={answers.dietType} onChange={(value) => setAnswer('dietType', value)}>
            <option value="">Select an option</option>
            {['Vegetarian', 'Vegan', 'Eggetarian', 'Non-veg'].map((option) => <option key={option}>{option}</option>)}
          </SelectField>
        </Field>
        <Field label="Health goals" hint="Choose up to three" className="assessment-field--full" error={fieldError('healthGoals')}>
          <MultiSelect name="healthGoals" options={healthGoals} values={answers.healthGoals} onToggle={(value) => toggleMulti('healthGoals', value, 3)} />
          {goalLimitNotice && <span className="assessment-field__error" role="status">{goalLimitNotice}</span>}
          <span className="assessment-field__hint">Select one to three areas you would like to explore.</span>
        </Field>
      </div>
    )
  }

  function renderHealthHistory() {
    return (
      <div className="assessment-fields-grid">
        <Field label="Existing conditions" hint="Select all that apply" className="assessment-field--full" error={fieldError('conditions')}>
          <MultiSelect name="conditions" options={conditions} values={answers.conditions} onToggle={(value) => toggleMulti('conditions', value)} />
        </Field>
        {answers.conditions?.includes('Other') && (
          <Field label="Other condition" hint="Optional · if known" className="assessment-field--full">
            <input aria-label="Other condition" type="text" maxLength="160" value={answers.conditionOther ?? ''} onChange={(event) => setAnswer('conditionOther', event.target.value)} />
          </Field>
        )}
        <Field label="Regular medicines" hint="Include blood thinners in your list if applicable." className="assessment-field--full" error={fieldError('regularMedicines')}>
          <ChoiceList name="regularMedicines" options={['Yes', 'No', "I don't know"]} value={answers.regularMedicines} onChange={(value) => setAnswer('regularMedicines', value)} />
        </Field>
        {answers.regularMedicines === 'Yes' && (
          <Field label="Medicine names" hint="Optional · list names as you know them, including blood thinners if applicable." className="assessment-field--full">
            <textarea aria-label="Medicine names" rows="3" maxLength="500" value={answers.medicineNames ?? ''} onChange={(event) => setAnswer('medicineNames', event.target.value)} />
          </Field>
        )}
        <Field label="Allergies" hint="Select all that apply" className="assessment-field--full" error={fieldError('allergies')}>
          <MultiSelect name="allergies" options={allergies} values={answers.allergies} onToggle={(value) => toggleMulti('allergies', value)} />
        </Field>
        {answers.allergies?.includes('Other') && (
          <Field label="Other allergy" hint="Optional · if known" className="assessment-field--full">
            <input aria-label="Other allergy" type="text" maxLength="160" value={answers.allergyOther ?? ''} onChange={(event) => setAnswer('allergyOther', event.target.value)} />
          </Field>
        )}
        <Field label="Past deficiencies" hint="Optional · select all that apply" className="assessment-field--full">
          <MultiSelect name="deficiencies" options={deficiencies} values={answers.deficiencies} onToggle={(value) => toggleMulti('deficiencies', value)} />
        </Field>
      </div>
    )
  }

  function renderConsent() {
    return (
      <div className="assessment-consents">
        <label className={`assessment-consent${answers.healthDataConsent ? ' is-selected' : ''}`}>
          <input type="checkbox" checked={Boolean(answers.healthDataConsent)} onChange={(event) => setAnswer('healthDataConsent', event.target.checked)} />
          <span className="assessment-consent__mark" aria-hidden="true">{answers.healthDataConsent && <Check size={14} />}</span>
          <span><strong>Health data consent <i>Required</i></strong><small>I understand that my answers may include sensitive information and consent is required before an assessment can be submitted to a connected service.</small></span>
        </label>
        {fieldError('healthDataConsent') && <span className="assessment-field__error" role="alert">{fieldError('healthDataConsent')}</span>}
        <label className={`assessment-consent${answers.disclaimerConsent ? ' is-selected' : ''}`}>
          <input type="checkbox" checked={Boolean(answers.disclaimerConsent)} onChange={(event) => setAnswer('disclaimerConsent', event.target.checked)} />
          <span className="assessment-consent__mark" aria-hidden="true">{answers.disclaimerConsent && <Check size={14} />}</span>
          <span><strong>Wellness information disclaimer <i>Required</i></strong><small>I understand NutraAI provides wellness information and educational support, not medical diagnosis or treatment. I will consult a qualified healthcare professional for medical advice.</small></span>
        </label>
        {fieldError('disclaimerConsent') && <span className="assessment-field__error" role="alert">{fieldError('disclaimerConsent')}</span>}
        <p className="assessment-privacy-note">{isPreviewMode ? 'Preview mode: responses are not submitted.' : 'When you submit, your responses are saved to your account to generate recommendations and reports.'}</p>
      </div>
    )
  }

  function renderCheckIn() {
    return (
      <div className="assessment-fields-grid">
        <Field label="Energy level" hint="Optional · 1–5 or I don't know" className="assessment-field--full">
          <ChoiceList name="energyLevel" options={['1', '2', '3', '4', '5', "I don't know"]} value={answers.energyLevel} onChange={(value) => setAnswer('energyLevel', value)} />
        </Field>
        <Field label="Water intake" hint="Litres (L) · optional">
          <input aria-label="Water intake in litres" type="number" min="0" step="0.1" value={answers.waterIntake ?? ''} disabled={Boolean(answers.waterIntakeUnknown)} onChange={(event) => setAnswer('waterIntake', event.target.value)} />
        </Field>
        <label className="assessment-inline-check"><input type="checkbox" checked={Boolean(answers.waterIntakeUnknown)} onChange={(event) => setAnswer('waterIntakeUnknown', event.target.checked)} /> I don't know</label>
        <Field label="Weight" hint="Kilograms (kg) · optional">
          <input aria-label="Check-in weight in kilograms" type="number" min="0.1" step="0.1" value={answers.checkInWeight ?? ''} onChange={(event) => setAnswer('checkInWeight', event.target.value)} />
        </Field>
        <Field label="Took supplements today?" className="assessment-field--full">
          <ChoiceList name="tookSupplements" options={['Yes', 'No', "I don't know"]} value={answers.tookSupplements} onChange={(value) => setAnswer('tookSupplements', value)} />
        </Field>
      </div>
    )
  }

  function renderPreferences() {
    return (
      <div className="assessment-fields-grid">
        <Field label="Reminder time" hint="Optional">
          <input aria-label="Reminder time" type="time" value={answers.reminderTime ?? ''} onChange={(event) => setAnswer('reminderTime', event.target.value)} />
        </Field>
        <Field label="Reminder channel" hint="Saved as a preference only">
          <SelectField aria-label="Reminder channel" value={answers.reminderChannel} onChange={(value) => setAnswer('reminderChannel', value)}>
            <option value="">No preference</option>
            {['Email', 'SMS', 'Push notification'].map((option) => <option key={option}>{option}</option>)}
          </SelectField>
        </Field>
        <p className="assessment-privacy-note assessment-field--full">These preferences are not saved and no reminders will be sent until the relevant services are connected.</p>
      </div>
    )
  }

  const stepContent = [
    renderAboutYou,
    renderLifestyle,
    renderDietAndGoals,
    renderHealthHistory,
    renderConsent,
    renderCheckIn,
    renderPreferences,
    () => <AssessmentReview answers={answers} onEdit={moveTo} />,
  ]

  return (
    <>
      <header className="dashboard-page-title">
        <div><span className="eyebrow">Your wellness profile</span><h1>Health assessment</h1><p>Review and enter your information before submitting it to the assessment service.</p></div>
      </header>
      <section className="dashboard-panel assessment-panel assessment-panel--structured" aria-label="Health assessment">
        <>
            <div className="assessment-progress-header">
              <div><span className="eyebrow">STEP {step + 1} OF {steps.length}</span><strong>{currentStep.short}</strong></div>
              <span>{percent}% complete</span>
            </div>
            <div className="assessment-progress-bar" role="progressbar" aria-label="Assessment progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
            <ol className="assessment-step-indicator" aria-label="Assessment steps">
              {steps.map((item, index) => (
                <li className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} key={item.short} aria-current={index === step ? 'step' : undefined}>
                  <span>{index < step ? <Check size={13} /> : index + 1}</span><small>{item.short}</small>
                </li>
              ))}
            </ol>
            <div className="assessment-structured-body">
              <span className="eyebrow">Step {step + 1} · {currentStep.short}</span>
              <h2>{currentStep.title}</h2>
              <p className="assessment-helper">{currentStep.description}</p>
              {stepContent[step]()}
              <div className="assessment-structured-actions">
                <button className="button button--outline" type="button" onClick={() => moveTo(step - 1)} disabled={step === 0}>
                  <ArrowLeft size={15} /> Previous
                </button>
                <div>
                  {(step === 5 || step === 6) && <button className="button button--text" type="button" onClick={() => moveTo(step + 1)}>Skip this optional step</button>}
                  <button className="button button--primary" type="button" onClick={continueAssessment} disabled={isSubmitting || Boolean(submitted)}>
                    {isSubmitting ? 'Submitting...' : step === steps.length - 1 ? (submitted ? 'Submitted' : 'Submit assessment') : 'Continue'} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
        </>
      </section>
      {submissionStatus && <p className="dashboard-inline-error" role="status">{submissionStatus}</p>}
      <p className="dashboard-disclaimer">{submitted ? 'Your assessment has been saved to your account. Recommendations and reports are now available.' : 'Responses are held in memory until you submit. Submitting saves your assessment to your account.'} This is not medical advice.</p>
    </>
  )
}
