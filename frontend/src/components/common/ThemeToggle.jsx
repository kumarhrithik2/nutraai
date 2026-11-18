import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

export default function ThemeToggle({ className = '', variant = 'icon' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${variant} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? <Sun size={variant === 'admin' ? 16 : 17} /> : <Moon size={variant === 'admin' ? 16 : 17} />}
      </span>
      {variant === 'labeled' ? <span className="theme-toggle__label">{isDark ? 'Light' : 'Dark'}</span> : null}
    </button>
  )
}
