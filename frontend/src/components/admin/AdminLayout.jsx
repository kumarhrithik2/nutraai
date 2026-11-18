import { useState } from 'react'
import {
  BarChart3,
  Boxes,
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
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const currentNav = navItems.find((item) =>
    item.to === '/admin/products'
      ? location.pathname.startsWith('/admin/products')
      : location.pathname === item.to,
  )

  return (
    <div className="admin-shell min-h-screen bg-[#f8f7f2] text-[#1c3028] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#122e26] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#1c4438] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a4437] text-[#d4a96a] flex items-center justify-center font-bold">
            <Shield size={18} />
          </div>
          <div>
            <span className="font-semibold text-sm">NutraAI Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="admin" className="theme-toggle--admin-mobile" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#1a4437] text-[#d4a96a] hover:bg-[#235747] transition"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop persistent, Mobile overlay) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#122e26] text-[#e8f0e5] flex flex-col border-r border-[#1c4438] transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-[#1c4438] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a4437] border border-[#266250] flex items-center justify-center text-[#d4a96a]">
              <Shield size={20} />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide text-white">NutraAI Labs</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#d4a96a]">
                Admin Portal
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-[#9bb0a6] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
          <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-[#6b857a]">
            Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a4437] text-white shadow-sm border border-[#286351]'
                      : 'text-[#a3b8af] hover:text-white hover:bg-[#16382f]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </div>

              </NavLink>
            )
          })}
        </nav>

        {/* Customer Store Link */}
        <div className="p-3 border-t border-[#1c4438]">
          <Link
            to="/dashboard/marketplace"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#c4d4cc] hover:text-white hover:bg-[#16382f] transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} className="text-[#d4a96a]" />
              <span>Customer Store</span>
            </span>
            <span className="text-[10px] text-[#8ea79d]">Live</span>
          </Link>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#1c4438] bg-[#0e241e]">
          <div className="flex items-center justify-between gap-2 p-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1a4437] text-[#d4a96a] font-semibold flex items-center justify-center text-xs shrink-0 border border-[#296452]">
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-[#82998f] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#9cb0a6] hover:text-[#f87171] hover:bg-[#1a382e] transition"
              title="Sign out of Admin Portal"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex bg-white px-8 py-4 items-center justify-between border-b border-[#e5eae3] sticky top-0 z-30 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-[#173d32] tracking-tight">
              {currentNav?.label || 'Admin Portal'}
            </h1>
            <p className="text-xs text-[#718078]">
              NutraAI Labs Administrative Workspace
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle variant="admin" className="theme-toggle--admin-header" />
            <Link
              to="/dashboard/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d6ded5] text-xs font-medium text-[#20342d] hover:bg-[#f6f8f5] hover:border-[#b0c0af] transition"
            >
              <ExternalLink size={13} className="text-[#173d32]" />
              <span>View Customer Marketplace</span>
            </Link>
            <div className="h-5 w-px bg-[#e5eae3]" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-xs text-[#718078] font-medium">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
