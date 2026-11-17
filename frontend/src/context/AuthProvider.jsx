import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from './AuthContext.jsx'
import {
  getCart,
  getErrorMessage,
  getProfile,
  loginUser,
  logoutUser,
  onSessionExpired,
  registerUser,
  restoreSession,
} from '../services/apiBackend/index.js'

export function AuthProvider({ children }) {
  const isPreviewMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PREVIEW_MODE === 'true'
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(!isPreviewMode)
  const [sessionError, setSessionError] = useState('')
  const restorePromiseRef = useRef(null)

  const refreshProfile = useCallback(async () => {
    if (isPreviewMode) return null
    try {
      const p = await getProfile()
      setProfile(p)
      setUser((current) => current ? { ...current, name: p.name || current.name, avatarUrl: p.avatarUrl || '' } : current)
      return p
    } catch {
      return null
    }
  }, [isPreviewMode])

  const refreshCartCount = useCallback(async () => {
    if (isPreviewMode) { setCartCount(0); return 0 }
    try {
      const cart = await getCart()
      const count = cart?.itemCount ?? 0
      setCartCount(count)
      return count
    } catch {
      setCartCount(0)
      return 0
    }
  }, [isPreviewMode])

  useEffect(() => {
    if (isPreviewMode) return undefined

    let active = true
    if (!restorePromiseRef.current) {
      restorePromiseRef.current = restoreSession().then(
        (restoredUser) => ({ user: restoredUser, error: null }),
        (error) => ({ user: null, error }),
      )
    }

    restorePromiseRef.current
      .then(async ({ user: restoredUser, error }) => {
        if (!active) return
        setUser(restoredUser)
        if (error) setSessionError(getErrorMessage(error))
        if (restoredUser) {
          await Promise.allSettled([refreshProfile(), refreshCartCount()])
        } else {
          setProfile(null)
          setCartCount(0)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isPreviewMode, refreshCartCount, refreshProfile])

  useEffect(() => {
    if (isPreviewMode) return undefined
    return onSessionExpired(() => {
      setUser(null)
      setProfile(null)
      setCartCount(0)
      setSessionError('Your session has expired. Please sign in again.')
    })
  }, [isPreviewMode])

  const login = useCallback(async (credentials) => {
    const authenticatedUser = await loginUser(credentials)
    setUser(authenticatedUser)
    setSessionError('')
    if (authenticatedUser?.role !== 'admin') {
      Promise.allSettled([refreshProfile(), refreshCartCount()])
    } else {
      setProfile(null)
      setCartCount(0)
    }
    return authenticatedUser
  }, [refreshCartCount, refreshProfile])

  const register = useCallback(async (details) => {
    const authenticatedUser = await registerUser(details)
    setUser(authenticatedUser)
    setSessionError('')
    Promise.allSettled([refreshProfile(), refreshCartCount()])
    return authenticatedUser
  }, [refreshCartCount, refreshProfile])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
      setProfile(null)
      setCartCount(0)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    profile,
    cartCount,
    isAuthenticated: Boolean(user),
    isLoading,
    isPreviewMode,
    sessionError,
    login,
    register,
    logout,
    refreshProfile,
    refreshCartCount,
    setCartCount,
  }), [user, profile, cartCount, isLoading, isPreviewMode, sessionError, login, register, logout, refreshProfile, refreshCartCount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
