import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * AdminRoute
 * Enforces authentication and administrator role ('admin') on all /admin routes.
 *
 * Rules:
 * 1. Shows loading indicator while session is being restored.
 * 2. Unauthenticated visitors are redirected to /admin/login.
 * 3. Authenticated customer users (role !== 'admin') are rejected and redirected to /dashboard.
 * 4. Backend-confirmed admins (role === 'admin') are granted access.
 * 5. Respects development preview mode.
 */
export default function AdminRoute() {
  const { user, isAuthenticated, isLoading, isPreviewMode } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="screen-loading" role="status">
        Restoring administrator session…
      </div>
    )
  }

  // Development preview mode
  if (isPreviewMode) {
    return <Outlet />
  }

  // Unauthenticated -> redirect to admin login with return location
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  // Authenticated non-admin -> reject and redirect to customer dashboard
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Authorized administrator
  return <Outlet />
}
