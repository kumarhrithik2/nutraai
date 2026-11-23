import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import ThemeToggle from '../common/ThemeToggle.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const navItems = [
  { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products Catalogue', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const sidebarEl = sidebarRef.current
    if (!sidebarEl) return
    const observer = new ResizeObserver(() => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    })
    observer.observe(sidebarEl)
    return () => observer.disconnect()
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const currentNav = navItems.find((item) =>
    item.to === '/admin/products'
      ? location.pathname.startsWith('/admin/products')
      : location.pathname === item.to,
  )

  const showLabels = !sidebarCollapsed || mobileMenuOpen

  const sidebarClasses = [
    'admin-sidebar',
    dark ? 'admin-sidebar--dark' : 'admin-sidebar--light',
    mobileMenuOpen ? 'admin-sidebar--open' : '',
    sidebarCollapsed && !mobileMenuOpen ? 'admin-sidebar--collapsed' : '',
  ].filter(Boolean).join(' ')

  const navLinkClasses = ({ isActive }) => {
    const base = 'admin-nav__link flex items-center text-xs font-medium transition-all duration-300 px-3 py-2.5 rounded-xl'
    const center = sidebarCollapsed ? 'justify-center gap-2' : 'justify-between gap-3'
    if (isActive) {
      return `${base} ${center} admin-nav__link--active`
    }
    return dark
      ? `${base} ${center} admin-nav__link--inactive`
      : `${base} ${center} admin-nav__link--inactive-light`
  }

  return (
    <div className={`admin-shell min-h-screen bg-[#f8f7f2] text-[#1c3028] flex flex-col md:flex-row ${dark ? 'admin-shell--dark' : ''}`}>
      {/* Mobile Top Bar */}
      <div className={`md:hidden px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 ${dark ? 'bg-[#080808] border-b border-[#2a2a2a]' : 'bg-[#ffffff] border-b border-[#e2e7df]'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors ${dark ? 'bg-[#1a1a1a] text-[#C6A36B]' : 'bg-[#e8f0e5] text-[#173d32]'}`}>
            <Shield size={18} />
          </div>
          <div>
            <span className={`font-semibold text-sm transition-colors ${dark ? 'text-white' : 'text-[#173d32]'}`}>NutraAI Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="admin" className={`theme-toggle--admin-mobile transition-colors duration-300 ${dark ? 'border-[#383027] bg-[#141414] text-[#C6A36B]' : 'border-[#d6ded5] bg-[#ffffff] text-[#173d32]'}`} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 rounded-lg transition-all ${dark ? 'bg-[#141414] text-[#C6A36B] hover:bg-[#222]' : 'bg-[#fbfaf6] text-[#173d32] hover:bg-[#f6f4ec]'}`} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside ref={sidebarRef} className={sidebarClasses} aria-label="Admin navigation" role={mobileMenuOpen ? 'dialog' : undefined} aria-modal={mobileMenuOpen ? 'true' : undefined}>
        {/* Brand */}
        <div className="admin-brand p-5 flex items-center justify-between border-b transition-colors duration-300">
          <div className={`flex items-center transition-all duration-300 ${showLabels ? 'gap-3' : 'gap-0 justify-center w-full'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[#C6A36B] transition-colors duration-300 border shrink-0 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-[#1a4437] border-[#266250]'}`}>
              <Shield size={20} />
            </div>
            {showLabels && (
              <div className="min-w-0">
                <div className="font-semibold text-sm tracking-wide transition-colors duration-300 text-white whitespace-nowrap">
                  NutraAI Labs
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest transition-colors duration-300 text-[#C6A36B] whitespace-nowrap">
                  Admin Portal
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className={`md:flex items-center p-1.5 rounded-lg transition-all duration-300 text-[#B9AA98] hover:text-white hover:bg-[#1a1a1a] ${dark ? 'hover:text-[#C6A36B]' : 'hover:text-[#d4a96a]'}`} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            {mobileMenuOpen && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={`md:hidden text-xs hover:text-white transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#9bb0a6]'}`}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="admin-nav flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
          <div className="admin-nav-caption px-3 py-2 text-[10px] uppercase font-bold tracking-wider">
            Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClasses}
                title={sidebarCollapsed && !mobileMenuOpen ? item.label : undefined}
              >
                <div className="flex items-center transition-all duration-300">
                  <Icon size={16} className="shrink-0 transition-transform duration-300" />
                  {showLabels && <span className="admin-nav__label">{item.label}</span>}
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Customer Store Link */}
        <div className="admin-store-link p-3 border-t flex items-center justify-between transition-colors duration-300">
          <Link
            to="/dashboard/marketplace"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center text-xs font-medium transition-all duration-300 ${showLabels ? 'gap-2 px-3 py-2 rounded-xl' : 'gap-0 justify-center px-2 py-2 rounded-xl'}`} title={sidebarCollapsed && !mobileMenuOpen ? 'Customer Store' : undefined}
          >
            <span className="flex items-center transition-all duration-300">
              <ExternalLink size={14} />
              {showLabels && <span>Customer Store</span>}
            </span>
            {showLabels && <span className="text-[10px]">Live</span>}
          </Link>
        </div>

        {/* User Card & Logout */}
        <div className="admin-user-card p-3 border-t transition-colors duration-300 flex items-center justify-between gap-2 p-2">
          <div className={`flex items-center gap-2.5 min-w-0 transition-all duration-300 ${showLabels ? '' : 'justify-center gap-0'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 border font-semibold transition-all duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#C6A36B]' : 'bg-[#e8f0e5] border-[#d6ded5] text-[#173d32]'}`}>
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            {showLabels && (
              <div className="min-w-0">
                <div className={`text-xs font-medium truncate transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
                  {user?.name || 'Administrator'}
                </div>
                <div className={`text-[10px] truncate transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
                  {user?.email}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`p-1.5 rounded-lg transition-all duration-300 ${dark ? 'text-[#9cb0a6] hover:text-[#f87171] hover:bg-[#1a382e]' : 'text-[#718078] hover:text-[#dc2626] hover:bg-[#fee2e2]'}`} title="Sign out of Admin Portal" aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className={`hidden md:flex px-8 py-4 items-center justify-between border-b sticky top-0 z-30 transition-colors duration-300 shadow-xs ${dark ? 'bg-[#201C17] border-[#383027]' : 'bg-white border-[#e2e7df] shadow-xs'}`}>
          <div>
            <h1 className={`text-lg font-bold tracking-tight transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              {currentNav?.label || 'Admin Portal'}
            </h1>
            <p className={`text-xs transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              NutraAI Labs Administrative Workspace
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle variant="admin" className={`theme-toggle--admin-header transition-colors duration-300 ${dark ? 'border-[#383027] bg-[#141414] text-[#C6A36B]' : ''}`} />
            <Link
              to="/dashboard/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${dark ? 'border-[#383027] text-[#B9AA98] hover:bg-[#222] hover:border-[#C6A36B]' : 'border-[#d6ded5] text-[#173d32] hover:bg-[#f6f4ec] hover:border-[#b0c0af]'}`}
            >
              <ExternalLink size={13} />
              <span>View Customer Marketplace</span>
            </Link>
            <div className="h-5 w-px transition-colors duration-300" />
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${dark ? 'bg-[#C6A36B]' : 'bg-[#10b981]'}`} />
              <span className={`text-xs font-medium transition-colors duration-300 ${dark ? 'text-white' : 'text-[#718078]'}`}>{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
