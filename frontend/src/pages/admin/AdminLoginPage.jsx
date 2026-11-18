import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Shield, ShieldAlert } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getErrorMessage } from '../../services/apiBackend/index.js'
import ThemeToggle from '../../components/common/ThemeToggle.jsx'

export default function AdminLoginPage() {
  const { login, logout, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated as administrator
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const destination = location.state?.from?.pathname || '/admin/products'
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, user, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const authenticatedUser = await login({ email: cleanEmail, password })

      // Strict role check: normal customer accounts must never access Admin Portal
      if (authenticatedUser?.role !== 'admin') {
        await logout()
        setError('Access denied. This portal requires administrator privileges.')
        return
      }

      const destination = location.state?.from?.pathname || '/admin/products'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Unable to sign in. Please verify your administrator credentials.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page min-h-screen bg-[#11241e] text-[#f6f4ec] flex flex-col justify-between selection:bg-[#d4a96a] selection:text-[#11241e]">
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[#213f35]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#173d32] border border-[#2d5849] flex items-center justify-center text-[#d4a96a]">
            <Shield size={20} />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide text-white">NutraAI Labs</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#213f35] text-[#d4a96a] border border-[#2d5849]">
              Portal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="admin" className="theme-toggle--admin-login" />
          <Link
            to="/"
            className="text-xs text-[#a0b0a8] hover:text-[#d4a96a] transition-colors flex items-center gap-1.5"
          >
            Customer store <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-[#173d32] border border-[#244f41] rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#11241e] text-[#d4a96a] border border-[#244f41] mb-3">
                <Lock size={12} /> Restricted Access
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Admin Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#9eb2a8] mt-2">
                Sign in with authorized administrator credentials to manage products and store operations.
              </p>
            </div>

            {error && (
              <div
                className="mb-6 p-3.5 rounded-xl bg-[#3d1a1a] border border-[#6b2b2b] text-[#fca5a5] text-xs flex items-start gap-2.5"
                role="alert"
              >
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#ef4444]" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium uppercase tracking-wider text-[#a0b0a8] mb-2"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71857c]">
                    <Mail size={16} />
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nutraai.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#11241e] border border-[#244f41] text-white text-sm placeholder-[#556960] focus:outline-none focus:border-[#d4a96a] focus:ring-1 focus:ring-[#d4a96a] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-medium uppercase tracking-wider text-[#a0b0a8] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71857c]">
                    <Lock size={16} />
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#11241e] border border-[#244f41] text-white text-sm placeholder-[#556960] focus:outline-none focus:border-[#d4a96a] focus:ring-1 focus:ring-[#d4a96a] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#71857c] hover:text-[#d4a96a] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-[#d4a96a] text-[#11241e] hover:bg-[#e2b97c] active:bg-[#c49859] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Verifying credentials…</span>
                ) : (
                  <>
                    <span>Sign in to Admin</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#244f41] text-center">
              <p className="text-[11px] text-[#71857c] leading-relaxed">
                Authorized NutraAI Labs staff only. All administration activity is audited and recorded.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#213f35] text-center text-xs text-[#71857c]">
        © 2026 NutraAI Labs. Internal Administration System.
      </footer>
    </div>
  )
}
