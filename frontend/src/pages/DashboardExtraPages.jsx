import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, Camera, Check, Package, Settings, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import IntegrationState from '../components/common/IntegrationState.jsx'

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <header className="dashboard-page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  )
}

export function HealthProfilePage() {
  const [values, setValues] = useState({ name: '', email: '', phone: '', focus: '', routine: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [picture, setPicture] = useState('')
  const pictureUrlRef = useRef('')

  useEffect(() => () => {
    if (pictureUrlRef.current) URL.revokeObjectURL(pictureUrlRef.current)
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setStatus('')
  }

  function selectPicture(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Choose an image that is 5 MB or smaller.')
      return
    }
    if (pictureUrlRef.current) URL.revokeObjectURL(pictureUrlRef.current)
    pictureUrlRef.current = URL.createObjectURL(file)
    setPicture(pictureUrlRef.current)
    setStatus('Image preview selected. It has not been uploaded.')
  }

  function submitProfile(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Enter your full name.'
    if (!values.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!event.currentTarget.elements.email.validity.valid) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStatus('Profile services are unavailable. Your changes have not been saved.')
  }

  return (
    <>
      <PageTitle eyebrow="Your information, your choice" title="My health profile" description="Review account details and general wellness preferences." />
      <section className="dashboard-panel basic-profile-panel" id="basic-information">
        <div className="panel-heading"><div><span className="eyebrow">Account details</span><h2>Basic information</h2></div></div>
        <p className="basic-profile-intro">No customer profile is loaded. Changes on this screen remain in memory and are not uploaded or saved.</p>
        <div className="basic-profile-picture">
          {picture ? <img className="profile-avatar profile-avatar--large" src={picture} alt="Selected profile preview" /> : <span className="profile-avatar profile-avatar--large" aria-hidden="true">?</span>}
          <div className="basic-profile-picture__actions">
            <strong>Profile picture</strong><small>JPG, PNG, or WebP · up to 5 MB</small>
            <div>
              <label className="button button--outline basic-profile-upload"><Camera size={14} /> Choose image<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectPicture} /></label>
              {picture && <button className="basic-profile-remove" type="button" onClick={() => {
                URL.revokeObjectURL(pictureUrlRef.current)
                pictureUrlRef.current = ''
                setPicture('')
                setStatus('Image preview removed. No profile picture was uploaded.')
              }}><Trash2 size={13} /> Remove preview</button>}
            </div>
          </div>
        </div>
        <form className="basic-profile-form" onSubmit={submitProfile} noValidate>
          <label>Full name<input name="name" autoComplete="name" value={values.name} onChange={updateField} aria-invalid={Boolean(errors.name)} />{errors.name && <span className="auth-field-error" role="alert">{errors.name}</span>}</label>
          <label>Email address<input name="email" type="email" autoComplete="email" value={values.email} onChange={updateField} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="auth-field-error" role="alert">{errors.email}</span>}</label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={updateField} /></label>
          <label>General wellness focus<select name="focus" value={values.focus} onChange={updateField}><option value="">Select an option</option><option>Building a consistent routine</option><option>Learning about everyday wellness</option><option>Prefer not to say</option></select></label>
          <label>Routine preference<select name="routine" value={values.routine} onChange={updateField}><option value="">Select an option</option><option>Fairly consistent</option><option>Changes day to day</option><option>Still finding what works</option><option>Prefer not to say</option></select></label>
          <div className="basic-profile-form__actions"><button className="button button--primary" type="submit">Save changes <Check size={14} /></button></div>
          {status && <p className="form-status basic-profile-form__status" role="status">{status}</p>}
        </form>
      </section>
      <p className="dashboard-disclaimer">Do not enter medical records or sensitive health information until secure account services are available.</p>
    </>
  )
}

export function WellnessPlanPage() {
  return (
    <>
      <PageTitle eyebrow="Your wellness journey" title="My wellness plan" description="Review a plan created from your verified account and wellness information." />
      <IntegrationState title="No wellness plan available" description="Plans are not generated or stored in this frontend. Connect the approved wellness service to load a customer plan." />
      <div className="wellness-plan-actions">
        <Link className="button button--outline" to="/dashboard/assessment">Health assessment <ArrowRight size={14} /></Link>
        <Link className="button button--outline" to="/dashboard/progress">Progress tracking <ArrowRight size={14} /></Link>
      </div>
    </>
  )
}

export function MarketplacePage() {
  return (
    <>
      <PageTitle eyebrow="Product catalogue" title="Products & marketplace" description="Browse verified product information when the catalogue service is available." action={<Link className="button button--outline" to="/dashboard/cart">View cart <ArrowRight size={14} /></Link>} />
      <IntegrationState title="Catalogue unavailable" description="No product listings, prices, ingredients, benefits, or availability are currently loaded." />
    </>
  )
}

export function OrdersPage() {
  return (
    <>
      <PageTitle eyebrow="Your account" title="My orders" description="Order history will be available after account and commerce services are connected." />
      <IntegrationState icon={Package} title="Order history unavailable" description="No orders are loaded or created by this frontend." />
    </>
  )
}

export function OrderDetailsPage() {
  return (
    <>
      <PageTitle eyebrow="Your account" title="Order details" description="Order details will be available after account and commerce services are connected." />
      <IntegrationState icon={Package} title="Order details unavailable" description="No order record is loaded or created by this frontend." />
    </>
  )
}

export function NotificationsPage() {
  return (
    <>
      <PageTitle eyebrow="Your account" title="Notifications" description="Account and service notifications will appear here when the notification service is connected." />
      <IntegrationState icon={Bell} title="Notifications unavailable" description="No notifications have been generated or marked as read." />
    </>
  )
}

export function SettingsPage() {
  const [preferences, setPreferences] = useState({ emailUpdates: false, reminders: false })
  const [status, setStatus] = useState('')

  function updatePreference(event) {
    const { name, checked } = event.target
    setPreferences((current) => ({ ...current, [name]: checked }))
    setStatus('')
  }

  return (
    <>
      <PageTitle eyebrow="Your account" title="Settings" description="Manage account and communication preferences." />
      <section className="dashboard-panel settings-panel">
        <div className="settings-section-heading"><span><Settings size={17} /></span><div><h2>Communication preferences</h2><p>Changes are not saved until account services are connected.</p></div></div>
        <label className="settings-option"><span><strong>Product and platform updates</strong><small>Optional updates about the NutraAI platform.</small></span><input name="emailUpdates" type="checkbox" checked={preferences.emailUpdates} onChange={updatePreference} /></label>
        <label className="settings-option"><span><strong>Wellness routine reminders</strong><small>Optional reminders for self-selected routines.</small></span><input name="reminders" type="checkbox" checked={preferences.reminders} onChange={updatePreference} /></label>
        <div className="settings-actions"><button className="button button--primary" type="button" onClick={() => setStatus('Settings service is unavailable. Your preferences have not been saved.')}>Save preferences <Check size={14} /></button>{status && <span role="status" className="form-status">{status}</span>}</div>
      </section>
    </>
  )
}
