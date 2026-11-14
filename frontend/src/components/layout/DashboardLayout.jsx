import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  Bell,
  Bot,
  ShoppingCart,
  ChevronDown,
  ChevronLeft,
  CircleUserRound,
  ClipboardCheck,
  CreditCard,
  Edit3,
  FileHeart,
  LayoutDashboard,
  Leaf,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AmbientParticles from '../effects/AmbientParticles.jsx'
import ProfileAvatar from './ProfileAvatar.jsx'

const navigationGroups = [
  {
    label: 'OVERVIEW',
    links: [
      { to: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/profile', label: 'My health profile', icon: FileHeart },
      { to: '/dashboard/assessment', label: 'Health assessment', icon: ClipboardCheck },
      { to: '/dashboard/report', label: 'Wellness report', icon: FileHeart },
    ],
  },
  {
    label: 'WELLNESS',
    links: [
      { to: '/dashboard/recommendations', label: 'AI recommendations', icon: Sparkles },
      { to: '/dashboard/wellness-plan', label: 'My wellness plan', icon: Leaf },
      { to: '/dashboard/assistant', label: 'AI wellness assistant', icon: Bot },
      { to: '/dashboard/progress', label: 'Progress tracking', icon: Activity },
    ],
  },
  {
    label: 'YOUR ACCOUNT',
    links: [
      { to: '/dashboard/marketplace', label: 'Products & marketplace', icon: ShoppingBag },
      { to: '/dashboard/cart', label: 'Cart', icon: ShoppingCart },
      { to: '/dashboard/checkout', label: 'Checkout', icon: CreditCard },
      { to: '/dashboard/orders', label: 'My orders', icon: Package },
      { to: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { to: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const searchEntries = navigationGroups.flatMap((group) => group.links)

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const displayName = 'Account'
  const searchRef = useRef(null)
  const sidebarRef = useRef(null)
  const menuToggleRef = useRef(null)
  const profileMenuRef = useRef(null)
  const profileButtonRef = useRef(null)
  const currentPage = searchEntries.find(({ to, end }) => end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(`${to}/`))
  const filteredResults = searchQuery.trim()
    ? searchEntries.filter(({ label }) => label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : []

  const closeMenus = useCallback(() => {
    setNotificationsOpen(false)
    setProfileOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
    setSidebarOpen(false)
    if (sidebarOpen) menuToggleRef.current?.focus()
  }, [sidebarOpen])

  function navigateTo(path) {
    closeMenus()
    navigate(path)
  }

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!profileOpen) return undefined

    function handleOutsidePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target) && !profileButtonRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [profileOpen])

  useEffect(() => {
    if (profileOpen) profileMenuRef.current?.querySelector('[role="menuitem"]')?.focus()
  }, [profileOpen])

  useEffect(() => {
    if (sidebarOpen) sidebarRef.current?.querySelector('a')?.focus()
  }, [sidebarOpen])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        const shouldRestoreProfileFocus = profileOpen
        closeMenus()
        if (shouldRestoreProfileFocus) profileButtonRef.current?.focus()
        return
      }

      if (profileOpen && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        const items = [...(profileMenuRef.current?.querySelectorAll('[role="menuitem"]') || [])]
        if (!items.length) return
        const currentIndex = items.indexOf(document.activeElement)
        const nextIndex = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
        event.preventDefault()
        items[nextIndex]?.focus()
        return
      }

      if (!sidebarOpen || event.key !== 'Tab') return
      const focusable = sidebarRef.current?.querySelectorAll('a[href], button:not([disabled])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, profileOpen, closeMenus])

  return (
    <div className={`dashboard-shell${sidebarCollapsed ? ' dashboard-shell--collapsed' : ''}`}>
      <a className="dashboard-skip-link" href="#dashboard-main-content">Skip to main content</a>
      <AmbientParticles />
      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close dashboard menu" onClick={closeMenus} />}
      <aside ref={sidebarRef} className={`dashboard-sidebar${sidebarOpen ? ' dashboard-sidebar--open' : ''}`} aria-label="Application sidebar" role={sidebarOpen ? 'dialog' : undefined} aria-modal={sidebarOpen ? 'true' : undefined}>
        <div className="dashboard-brand-row">
          <Link className="brand dashboard-brand" to="/dashboard/overview" aria-label="NutraAI Labs overview">
            <span className="brand-mark"><Leaf size={17} /></span>
            <span className="dashboard-brand__name">NutraAI <strong>Labs</strong></span>
          </Link>
          <button className="sidebar-collapse-toggle" type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed((value) => !value)}>
            <ChevronLeft size={16} />
          </button>
        </div>
        <nav className="dashboard-nav" id="customer-navigation" aria-label="Customer navigation">
          {navigationGroups.map((group) => (
            <div className="dashboard-nav-group" key={group.label}>
              <span className="sidebar-caption">{group.label}</span>
              {group.links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  aria-label={label}
                  title={sidebarCollapsed ? label : undefined}
                  onClick={closeMenus}
                  className={({ isActive }) => `dashboard-nav__link${isActive ? ' is-active' : ''}`}
                >
                  <Icon size={16} strokeWidth={1.8} /><span className="dashboard-nav__label">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/contact" title={sidebarCollapsed ? 'Help & support' : undefined}><CircleUserRound size={15} /><span className="dashboard-nav__label">Help &amp; support</span></Link>
          <div className="sidebar-profile">
            <ProfileAvatar name={displayName} />
            <span className="sidebar-profile__copy"><strong>{displayName}</strong><small>Account services unavailable</small></span>
          </div>
          <Link className="sidebar-logout" to="/" title={sidebarCollapsed ? 'Back to website' : undefined}><Leaf size={14} /><span className="dashboard-nav__label">Back to website</span></Link>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button ref={menuToggleRef} className="dashboard-menu-toggle" type="button" aria-label={sidebarOpen ? 'Close dashboard menu' : 'Open dashboard menu'} aria-expanded={sidebarOpen} aria-controls="customer-navigation" onClick={() => setSidebarOpen((open) => !open)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="dashboard-breadcrumb" aria-label="Breadcrumb"><Link to="/dashboard/overview">Workspace</Link><span>/</span><strong>{currentPage?.label ?? 'Overview'}</strong></div>
          <div className="dashboard-top-actions">
            <div className={`app-search${searchOpen ? ' app-search--open' : ''}`}>
              {searchOpen && <input ref={searchRef} aria-label="Search application pages" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Escape') closeMenus()
                if (event.key === 'Enter' && filteredResults[0]) navigateTo(filteredResults[0].to)
              }} placeholder="Search pages..." />}
              <button type="button" aria-label={searchOpen ? 'Close search' : 'Search'} aria-expanded={searchOpen} onClick={() => {
                setNotificationsOpen(false)
                setProfileOpen(false)
                setSearchOpen((open) => !open)
              }}>{searchOpen ? <X size={17} /> : <Search size={17} />}</button>
              {searchOpen && searchQuery && <div className="app-search-results" role="listbox" aria-label="Search results">
                {filteredResults.length ? filteredResults.map(({ to, label, icon: Icon }) => <button key={to} type="button" role="option" aria-selected="false" onClick={() => navigateTo(to)}><Icon size={15} />{label}</button>) : <p>No matching pages.</p>}
              </div>}
            </div>
            <Link className="dashboard-cart-link" to="/dashboard/cart" aria-label="Shopping cart"><ShoppingCart size={17} /></Link>
            <div className="header-menu-anchor">
              <button type="button" className={`dashboard-notice${notificationsOpen ? ' is-open' : ''}`} aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => {
                setProfileOpen(false)
                setSearchOpen(false)
                setNotificationsOpen((open) => !open)
              }}><Bell size={17} /></button>
              {notificationsOpen && <div className="header-popover notification-popover" role="dialog" aria-label="Notifications">
                <div className="popover-heading"><strong>Notifications</strong></div>
                <div className="notification-item"><span><strong>Notification service unavailable</strong><small>Events will appear here when the service is connected.</small></span></div>
                <Link to="/dashboard/notifications" onClick={closeMenus}>View all notifications <span aria-hidden="true">→</span></Link>
              </div>}
            </div>
            <span className="topbar-divider" />
            <div className="header-menu-anchor">
              <button ref={profileButtonRef} className="topbar-user" type="button" aria-label={profileOpen ? 'Close profile menu' : 'Open profile menu'} aria-haspopup="menu" aria-controls="profile-menu" aria-expanded={profileOpen} onClick={() => {
                setNotificationsOpen(false)
                setSearchOpen(false)
                setProfileOpen((open) => !open)
              }}><span className="topbar-user__name">{displayName}</span><ProfileAvatar name={displayName} /><ChevronDown size={13} /></button>
              {profileOpen && <div ref={profileMenuRef} className="header-popover profile-popover" id="profile-menu" role="menu" aria-label="Profile menu" onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== profileButtonRef.current) setProfileOpen(false)
              }}>
                <div className="profile-popover__identity">
                  <ProfileAvatar name={displayName} className="profile-avatar--menu" />
                  <span><strong>{displayName}</strong><small>Account services unavailable</small></span>
                </div>
                <Link role="menuitem" to="/dashboard/profile" onClick={closeMenus}><UserRound size={15} />View Profile</Link>
                <Link role="menuitem" to="/dashboard/profile#basic-information" onClick={closeMenus}><Edit3 size={15} />Basic Information</Link>
                <Link role="menuitem" to="/dashboard/settings" onClick={closeMenus}><Settings size={15} />Settings</Link>
                <Link role="menuitem" to="/dashboard/notifications" onClick={closeMenus}><Bell size={15} />Notifications</Link>
                <Link role="menuitem" to="/login" onClick={closeMenus}><CircleUserRound size={15} />Connect account</Link>
              </div>}
            </div>
          </div>
        </header>
        <aside className="dashboard-service-notice" aria-label="Development preview status">
          <strong>Development Preview – Sample Data</strong>
          <span>Visual-only preview. No customer identity or personal data is loaded; backend actions remain unavailable.</span>
        </aside>
        <main id="dashboard-main-content" tabIndex="-1" className={`dashboard-content${location.pathname === '/dashboard' ? ' dashboard-content--overview' : ''}`}><Outlet /></main>
        <footer className="dashboard-footer"><span>NutraAI Labs · Workspace preview</span><span>Wellness information is not medical advice.</span></footer>
        <nav className="dashboard-bottom-nav" aria-label="Quick navigation">
          {[
            { to: '/dashboard/overview', label: 'Home', icon: LayoutDashboard, end: true },
            { to: '/dashboard/assessment', label: 'Assess', icon: ClipboardCheck },
            { to: '/dashboard/recommendations', label: 'Discover', icon: Sparkles },
            { to: '/dashboard/progress', label: 'Progress', icon: Activity },
          ].map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={closeMenus} className={({ isActive }) => `dashboard-bottom-nav__link${isActive ? ' is-active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}
        </nav>
        {(notificationsOpen || profileOpen || searchOpen) && <button className="menu-dismiss" type="button" tabIndex="-1" aria-label="Close open menu" onClick={closeMenus} />}
      </div>
    </div>
  )
}

export default DashboardLayout
