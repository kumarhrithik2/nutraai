import { useEffect, useState } from 'react'
import { Leaf, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import ThemeToggle from '../common/ThemeToggle.jsx'

const navigation = [
  { label: 'About', href: '/#about' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'Products', href: '/#products' },
  { label: 'AI Wellness', href: '/#ai-wellness' },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  function closeMenu() {
    setMenuOpen(false)
  }

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return undefined

    const targetId = decodeURIComponent(location.hash.slice(1))
    const frame = window.requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      document.getElementById(targetId)?.scrollIntoView({ behavior, block: 'start' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="NutraAI Labs home" onClick={closeMenu}>
          <span className="brand-mark"><Leaf size={19} strokeWidth={2} /></span>
          <span>NutraAI <strong>Labs</strong></span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          className={`primary-navigation${menuOpen ? ' primary-navigation--open' : ''}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              onClick={closeMenu}
              className={({ isActive }) => `primary-nav__link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="mobile-nav-actions">
            <ThemeToggle variant="labeled" className="mobile-theme-toggle" />
            <Link to="/login" onClick={closeMenu}>Log in</Link>
            <Link className="button button--primary" to="/register" onClick={closeMenu}>
              Get started
            </Link>
          </div>
        </nav>
        <div className="header-actions">
          <ThemeToggle className="header-theme-toggle" />
          <Link className="login-link" to="/login">Log in</Link>
          <Link className="button button--primary header-cta" to="/register">
            Get started <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
           )
}

export default Header
