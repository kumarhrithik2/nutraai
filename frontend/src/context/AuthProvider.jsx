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
  const [cart, setCart] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(!isPreviewMode)
  const [sessionError, setSessionError] = useState('')
  const restorePromiseRef = useRef(null)

  const applyCart = useCallback((nextCart) => {
    setCart(nextCart || null)
    setCartCount(nextCart?.itemCount ?? 0)
  }, [])

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

  const refreshCart = useCallback(async () => {
    if (isPreviewMode) { applyCart(null); return null }
    try {
      const nextCart = await getCart()
      applyCart(nextCart)
      return nextCart
    } catch {
      applyCart(null)
      return null
    }
  }, [isPreviewMode, applyCart])

  const refreshCartCount = useCallback(async () => {
    const nextCart = await refreshCart()
    return nextCart?.itemCount ?? 0
  }, [refreshCart])

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
          if (restoredUser.role !== 'admin') {
            await Promise.allSettled([refreshProfile(), refreshCart()])
          } else {
            setProfile(null)
            applyCart(null)
          }
        } else {
          setProfile(null)
          applyCart(null)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isPreviewMode, refreshCart, refreshProfile, applyCart])

  useEffect(() => {
    if (isPreviewMode) return undefined
    return onSessionExpired(() => {
      setUser(null)
      setProfile(null)
      applyCart(null)
      setSessionError('Your session has expired. Please sign in again.')
    })
  }, [isPreviewMode, applyCart])

  const login = useCallback(async (credentials) => {
    const authenticatedUser = await loginUser(credentials)
    setUser(authenticatedUser)
    setSessionError('')
    if (authenticatedUser?.role !== 'admin') {
      Promise.allSettled([refreshProfile(), refreshCart()])
    } else {
      setProfile(null)
      applyCart(null)
    }
    return authenticatedUser
  }, [refreshCart, refreshProfile, applyCart])

  const register = useCallback(async (details) => {
    const authenticatedUser = await registerUser(details)
    setUser(authenticatedUser)
    setSessionError('')
    Promise.allSettled([refreshProfile(), refreshCart()])
    return authenticatedUser
  }, [refreshCart, refreshProfile])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
      setProfile(null)
      applyCart(null)
    }
  }, [applyCart])

  const value = useMemo(() => ({
    user,
    profile,
    cart,
    cartCount,
    isAuthenticated: Boolean(user),
    isLoading,
    isPreviewMode,
    sessionError,
    login,
    register,
    logout,
    refreshProfile,
    refreshCart,
    refreshCartCount,
    applyCart,
    setCartCount,
  }), [user, profile, cart, cartCount, isLoading, isPreviewMode, sessionError, login, register, logout, refreshProfile, refreshCart, refreshCartCount, applyCart])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
