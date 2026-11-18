import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './ThemeContext.jsx'

const STORAGE_KEY = 'nutraai-theme'

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function normalizePreference(value) {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function getInitialPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* ignore */
  }
  return 'system'
}

function resolveTheme(preference) {
  return preference === 'system' ? getSystemTheme() : preference
}

function applyTheme(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#111916' : '#f6f4ec')
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(getInitialPreference)
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(getInitialPreference()))

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (preference !== 'system') return
      const next = media.matches ? 'dark' : 'light'
      setResolvedTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const setThemePreference = useCallback((next) => {
    const value = normalizePreference(next)
    setPreferenceState(value)
    setResolvedTheme(resolveTheme(value))
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }, [])

  const setTheme = useCallback((next) => {
    setThemePreference(next === 'dark' ? 'dark' : 'light')
  }, [setThemePreference])

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const resolved = resolveTheme(current)
      const value = resolved === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch {
        /* ignore */
      }
      return value
    })
  }, [])

  const value = useMemo(() => ({
    theme: resolvedTheme,
    resolvedTheme,
    themePreference: preference,
    isDark: resolvedTheme === 'dark',
    setTheme,
    setThemePreference,
    toggleTheme,
  }), [resolvedTheme, preference, setTheme, setThemePreference, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
