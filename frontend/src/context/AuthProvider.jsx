import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from './AuthContext.jsx'
import {
  getErrorMessage,
  loginUser,
  logoutUser,
  onSessionExpired,
  registerUser,
  restoreSession,
} from '../services/apiBackend/index.js'

export function AuthProvider({ children }) {
  const isPreviewMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PREVIEW_MODE === 'true'
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(!isPreviewMode)
  const [sessionError, setSessionError] = useState('')
  const restorePromiseRef = useRef(null)

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
      .then(({ user: restoredUser, error }) => {
        if (!active) return
        setUser(restoredUser)
        if (error) setSessionError(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isPreviewMode])

  useEffect(() => {
    if (isPreviewMode) return undefined
    return onSessionExpired(() => {
      setUser(null)
      setSessionError('Your session has expired. Please sign in again.')
    })
  }, [isPreviewMode])

  const login = useCallback(async (credentials) => {
    const authenticatedUser = await loginUser(credentials)
    setUser(authenticatedUser)
    setSessionError('')
    return authenticatedUser
  }, [])

  const register = useCallback(async (details) => {
    const authenticatedUser = await registerUser(details)
    setUser(authenticatedUser)
    setSessionError('')
    return authenticatedUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    isPreviewMode,
    sessionError,
    login,
    register,
    logout,
  }), [user, isLoading, isPreviewMode, sessionError, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
