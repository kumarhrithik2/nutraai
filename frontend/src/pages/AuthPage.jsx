import { useState } from 'react'
import { Eye, EyeOff, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import AmbientParticles from '../components/effects/AmbientParticles.jsx'

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const title = isForgot ? 'Reset your password' : isRegister ? 'Create your account' : 'Welcome back'

  function clearError(field) {
    setErrors((previous) => ({ ...previous, [field]: '' }))
    setStatus('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setStatus('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const nextErrors = {}
    if (isRegister && !String(formData.get('name') || '').trim()) nextErrors.name = 'Enter your name.'
    if (!email) nextErrors.email = 'Enter your email address.'
    else if (form.elements.email.validity.typeMismatch) nextErrors.email = 'Enter a valid email address.'
    if (!isForgot && !password) nextErrors.password = 'Enter your password.'
    else if (!isForgot && password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (isRegister && !String(formData.get('confirm-password') || '')) nextErrors.confirmPassword = 'Confirm your password.'
    else if (isRegister && password !== String(formData.get('confirm-password'))) nextErrors.confirmPassword = 'Passwords do not match.'
    if (isRegister && !formData.get('terms')) nextErrors.terms = 'Please accept the Terms & Conditions and Privacy Policy.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      form.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    setStatus(isForgot
      ? 'Password recovery is unavailable. No reset request was sent.'
      : 'Account services are unavailable. No account was created and no login was attempted.')
  }

  return (
    <main className="auth-page">
      <AmbientParticles />
      <div className="auth-botanical" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="auth-card">
        <Link className="brand auth-brand" to="/"><span className="brand-mark"><Leaf size={19} /></span><span>NutraAI <strong>Labs</strong></span></Link>
        <span className="eyebrow">{isRegister ? 'Your wellness, your way' : isForgot ? 'Account support' : 'Welcome back'}</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">{isRegister
          ? 'Create an account when secure account services are available.'
          : isForgot
            ? 'Request a password reset when account services are available.'
            : 'Log in when secure account services are available.'}</p>
        <form onSubmit={handleSubmit} noValidate>
          {isRegister && <div className="auth-form-field"><label className={`auth-field${errors.name ? ' auth-field--invalid' : ''}`}><UserRound size={15} /><input type="text" name="name" autoComplete="name" placeholder="Full name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'auth-name-error' : undefined} onChange={() => clearError('name')} /></label>{errors.name && <span className="auth-field-error" id="auth-name-error" role="alert">{errors.name}</span>}</div>}
          <div className="auth-form-field"><label className={`auth-field${errors.email ? ' auth-field--invalid' : ''}`}><Mail size={15} /><input type="email" name="email" autoComplete="email" placeholder="Email address" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'auth-email-error' : undefined} onChange={() => clearError('email')} /></label>{errors.email && <span className="auth-field-error" id="auth-email-error" role="alert">{errors.email}</span>}</div>
          {!isForgot && <div className="auth-form-field"><label className={`auth-field${errors.password ? ' auth-field--invalid' : ''}`}><LockKeyhole size={15} /><input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Password" minLength={8} required aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'auth-password-error' : undefined} onChange={() => clearError('password')} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>{errors.password && <span className="auth-field-error" id="auth-password-error" role="alert">{errors.password}</span>}</div>}
          {isRegister && <><div className="auth-form-field"><label className={`auth-field${errors.confirmPassword ? ' auth-field--invalid' : ''}`}><LockKeyhole size={15} /><input type="password" name="confirm-password" autoComplete="new-password" placeholder="Confirm password" minLength={8} required aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'auth-confirm-password-error' : undefined} onChange={() => clearError('confirmPassword')} /></label>{errors.confirmPassword && <span className="auth-field-error" id="auth-confirm-password-error" role="alert">{errors.confirmPassword}</span>}</div><div className="auth-form-field"><label className="auth-consent"><input type="checkbox" name="terms" onChange={() => clearError('terms')} /> <span>I agree to the Terms &amp; Conditions and Privacy Policy, which will be available when account services launch.</span></label>{errors.terms && <span className="auth-field-error" role="alert">{errors.terms}</span>}</div></>}
          {!isRegister && !isForgot && <div className="auth-options"><label><input type="checkbox" name="remember" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}
          <button className="button button--primary auth-submit" type="submit">{isRegister ? 'Create account' : isForgot ? 'Request reset' : 'Log in'}</button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
        {!isRegister && !isForgot && <><div className="auth-divider"><span>or</span></div><button className="social-login" type="button" onClick={() => setStatus('Social sign-in is unavailable. No sign-in request was sent.')}><span>G</span> Continue with Google</button></>}
        <p className="auth-switch">{isRegister ? 'Already have an account?' : isForgot ? 'Remembered your password?' : 'Don’t have an account?'} <Link to={isRegister || isForgot ? '/login' : '/register'}>{isRegister || isForgot ? 'Log in' : 'Register'}</Link></p>
        <p className="auth-service-note">No account service is connected. Information entered here is not sent or stored.</p>
      </div>
    </main>
  )
}

export function ForgotPasswordPage() {
  return <AuthPage mode="forgot" />
}

export default AuthPage
