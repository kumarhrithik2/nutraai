import { useState } from 'react'
import { Eye, EyeOff, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AmbientParticles from '../components/effects/AmbientParticles.jsx'
import { getErrorMessage, getFieldErrors } from '../services/apiBackend/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from '../components/common/ThemeToggle.jsx'

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    isPreviewMode,
    sessionError,
    login,
    register,
  } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const title = isForgot ? 'Reset your password' : isRegister ? 'Create your account' : 'Welcome back'

  // Navigation notices (e.g. post-logout messages) and session errors share the same status
  // line as form messages. Derived at render instead of set inside effects to avoid
  // cascading renders from setState-in-effect.
  const notice = sessionError || location.state?.authNotice || ''

  function clearError(field) {
    setErrors((previous) => ({ ...previous, [field]: '' }))
    setStatus('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting || isAuthLoading) return

    setStatus('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const nextErrors = {}
    const name = String(formData.get('name') || '').trim()
    const confirmPassword = String(formData.get('confirm-password') || '')
    const terms = Boolean(formData.get('terms'))

    if (isRegister && !name) nextErrors.name = 'Enter your name.'
    if (!email) nextErrors.email = 'Enter your email address.'
    else if (form.elements.email.validity.typeMismatch) nextErrors.email = 'Enter a valid email address.'
    if (!isForgot && !password) nextErrors.password = 'Enter your password.'
    else if (!isForgot && password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (isRegister && !confirmPassword) nextErrors.confirmPassword = 'Confirm your password.'
    else if (isRegister && password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (isRegister && !terms) nextErrors.terms = 'Please accept the Terms & Conditions and Privacy Policy.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      form.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    if (isPreviewMode) {
      setStatus(isForgot ? 'Password recovery is unavailable. No reset request was sent.' : 'No account was created and no login was attempted.')
      return
    }

    if (isForgot) {
      setStatus('Password recovery is unavailable because its backend endpoint is not implemented. No reset request was sent.')
      return
    }

    setIsSubmitting(true)
    try {
      // Real backend call through AuthContext: POST /auth/login/ or /auth/register/.
      // Field-level 400 details are mapped back onto the form by getFieldErrors().
      if (isRegister) {
        await register({ name, email, password, confirmPassword, terms })
      } else {
        await login({ email, password })
      }
      navigate('/dashboard/overview', { replace: true })
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      setStatus(fieldErrors.form || getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  // A signed-in visitor (fresh login, or a session restored from the refresh cookie) has no
  // reason to see the auth forms. Preview mode is deliberately exempt so the sample-data
  // dashboard stays reachable without an account.
  if (isAuthenticated && !isPreviewMode) return <Navigate to="/dashboard/overview" replace />

  return (
    <main className="auth-page">
      <AmbientParticles />
      <div className="auth-theme-anchor"><ThemeToggle /></div>
      <div className="auth-botanical" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="auth-card">
        <Link className="brand auth-brand" to="/"><span className="brand-mark"><Leaf size={19} /></span><span>NutraAI <strong>Labs</strong></span></Link>
        <span className="eyebrow">{isRegister ? 'Your wellness, your way' : isForgot ? 'Account support' : 'Welcome back'}</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">{isRegister
          ? 'Create an account to begin your personal wellness journey.'
          : isForgot
            ? 'Password reset is not available yet.'
            : 'Your personal wellness space, all in one place.'}</p>
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting || isAuthLoading}>
          {isRegister && <div className="auth-form-field">
            <label className={`auth-field${errors.name ? ' auth-field--invalid' : ''}`}>
              <UserRound size={15} aria-hidden="true" />
              <input type="text" name="name" autoComplete="name" placeholder="Full name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'auth-name-error' : undefined} onChange={() => clearError('name')} />
            </label>
            {errors.name && <span className="auth-field-error" id="auth-name-error" role="alert">{errors.name}</span>}
          </div>}
          <div className="auth-form-field">
            <label className={`auth-field${errors.email ? ' auth-field--invalid' : ''}`}>
              <Mail size={15} aria-hidden="true" />
              <input type="email" name="email" autoComplete="email" placeholder="Email address" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'auth-email-error' : undefined} onChange={() => clearError('email')} />
            </label>
            {errors.email && <span className="auth-field-error" id="auth-email-error" role="alert">{errors.email}</span>}
          </div>
          {!isForgot && <div className="auth-form-field">
            <label className={`auth-field${errors.password ? ' auth-field--invalid' : ''}`}>
              <LockKeyhole size={15} aria-hidden="true" />
              <input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Password" minLength={8} required aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'auth-password-error' : undefined} onChange={() => clearError('password')} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </label>
            {errors.password && <span className="auth-field-error" id="auth-password-error" role="alert">{errors.password}</span>}
          </div>}
          {isRegister && <>
            <div className="auth-form-field">
              <label className={`auth-field${errors.confirmPassword ? ' auth-field--invalid' : ''}`}>
                <LockKeyhole size={15} aria-hidden="true" />
                <input type="password" name="confirm-password" autoComplete="new-password" placeholder="Confirm password" minLength={8} required aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'auth-confirm-password-error' : undefined} onChange={() => clearError('confirmPassword')} />
              </label>
              {errors.confirmPassword && <span className="auth-field-error" id="auth-confirm-password-error" role="alert">{errors.confirmPassword}</span>}
            </div>
            <div className="auth-form-field">
              <label className="auth-consent">
                <input type="checkbox" name="terms" aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? 'auth-terms-error' : undefined} onChange={() => clearError('terms')} />
                <span>I agree to the Terms & Conditions and Privacy Policy.</span>
              </label>
              {errors.terms && <span className="auth-field-error" id="auth-terms-error" role="alert">{errors.terms}</span>}
            </div>
          </>}
          {!isRegister && !isForgot && <div className="auth-options"><label><input type="checkbox" name="remember" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}
          <button className="button button--primary auth-submit" type="submit" disabled={isSubmitting || isAuthLoading}>
            {isAuthLoading ? 'Restoring session…' : isSubmitting ? (isRegister ? 'Creating account…' : 'Signing in…') : isRegister ? 'Create account' : isForgot ? 'Request reset' : 'Log in'}
          </button>
          {(notice || status) && <p className="form-status" role="status" aria-live="polite">{notice || status}</p>}
        </form>
        {!isRegister && !isForgot && <>
          <div className="auth-divider"><span>or</span></div>
          <button className="social-login" type="button" disabled={isSubmitting || isAuthLoading} onClick={() => setStatus('Google sign-in is unavailable because no Google authentication service is connected. No request was sent.')}>
            <span aria-hidden="true">G</span> Continue with Google
          </button>
        </>}
        <p className="auth-switch">{isRegister ? 'Already have an account?' : isForgot ? 'Remembered your password?' : 'Don’t have an account?'} <Link to={isRegister || isForgot ? '/login' : '/register'}>{isRegister || isForgot ? 'Log in' : 'Register'}</Link></p>
        <p className="auth-service-note">Your password is never stored in browser storage.</p>
      </div>
    </main>
  )
}

export function ForgotPasswordPage() {
  return <AuthPage mode="forgot" />
}

export default AuthPage
