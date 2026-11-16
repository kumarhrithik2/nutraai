import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppErrorBoundary from '../components/layout/AppErrorBoundary.jsx'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import HomePage from '../pages/HomePage.jsx'

const AuthPage = lazy(() => import('../pages/AuthPage.jsx'))
const ForgotPasswordPage = lazy(() => import('../pages/AuthPage.jsx').then((module) => ({ default: module.ForgotPasswordPage })))
const AboutPage = lazy(() => import('../pages/PublicPages.jsx').then((module) => ({ default: module.AboutPage })))
const ContactPage = lazy(() => import('../pages/PublicPages.jsx').then((module) => ({ default: module.ContactPage })))
const HowItWorksPage = lazy(() => import('../pages/PublicPages.jsx').then((module) => ({ default: module.HowItWorksPage })))
const MembershipPage = lazy(() => import('../pages/PublicPages.jsx').then((module) => ({ default: module.MembershipPage })))
const ProductDetailsPage = lazy(() => import('../pages/PublicPages.jsx').then((module) => ({ default: module.ProductDetailsPage })))
const ProductsPage = lazy(() => import('../pages/PublicPages.jsx').then((module) => ({ default: module.ProductsPage })))
const AssistantPage = lazy(() => import('../pages/DashboardPages.jsx').then((module) => ({ default: module.AssistantPage })))
const DashboardOverview = lazy(() => import('../pages/DashboardPages.jsx').then((module) => ({ default: module.DashboardOverview })))
const HealthAssessmentPage = lazy(() => import('../pages/HealthAssessmentPage.jsx').then((module) => ({ default: module.HealthAssessmentPage })))
const ProgressPage = lazy(() => import('../pages/DashboardPages.jsx').then((module) => ({ default: module.ProgressPage })))
const RecommendationsPage = lazy(() => import('../pages/DashboardPages.jsx').then((module) => ({ default: module.RecommendationsPage })))
const WellnessReportPage = lazy(() => import('../pages/DashboardPages.jsx').then((module) => ({ default: module.WellnessReportPage })))
const CommercePages = lazy(() => import('../pages/CommercePages.jsx'))
const SubscriptionDashboard = lazy(() => import('../components/subscriptions/SubscriptionDashboard.jsx'))
const HealthProfilePage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.HealthProfilePage })))
const WellnessPlanPage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.WellnessPlanPage })))
const MarketplacePage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.MarketplacePage })))
const OrdersPage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.OrdersPage })))
const OrderDetailsPage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.OrderDetailsPage })))
const NotificationsPage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.NotificationsPage })))
const SettingsPage = lazy(() => import('../pages/DashboardExtraPages.jsx').then((module) => ({ default: module.SettingsPage })))

// Admin Portal imports
const AdminRoute = lazy(() => import('./AdminRoute.jsx'))
const AdminLayout = lazy(() => import('../components/admin/AdminLayout.jsx'))
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage.jsx'))
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage.jsx'))
const AdminModulePlaceholder = lazy(() =>
  import('../pages/admin/AdminPlaceholderPage.jsx').then((m) => ({ default: m.AdminModulePlaceholder }))
)

function DashboardWorkspace() {
  const { isAuthenticated, isLoading, isPreviewMode } = useAuth()

  if (isPreviewMode || isAuthenticated) return <DashboardLayout />
  if (isLoading) return <div className="screen-loading" role="status">Restoring your account session…</div>
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<div className="screen-loading" role="status">Loading your wellness space…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage mode="forgot" />} />
          <Route path="/assessment" element={<Navigate to="/dashboard/assessment" replace />} />

          {/* Customer Dashboard Workspace */}
          <Route path="/dashboard" element={<DashboardWorkspace />}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="profile" element={<HealthProfilePage />} />
            <Route path="assessment" element={<HealthAssessmentPage />} />
            <Route path="report" element={<WellnessReportPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="wellness-plan" element={<WellnessPlanPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="cart" element={<CommercePages page="cart" />} />
            <Route path="checkout" element={<CommercePages page="checkout" />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="subscriptions" element={<SubscriptionDashboard />} />
            <Route path="subscriptions/membership" element={<SubscriptionDashboard />} />
            <Route path="subscriptions/supplements" element={<SubscriptionDashboard />} />
            <Route path="subscriptions/billing" element={<SubscriptionDashboard />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Standalone Admin Portal */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/products" replace />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route
                path="overview"
                element={
                  <AdminModulePlaceholder
                    title="Overview Dashboard"
                    description="High-level business metrics, catalogue health, and quick administration actions."
                  />
                }
              />
              <Route
                path="inventory"
                element={
                  <AdminModulePlaceholder
                    title="Inventory Management"
                    description="Batch stock adjustments, reorder thresholds, and warehouse status."
                  />
                }
              />
              <Route
                path="orders"
                element={
                  <AdminModulePlaceholder
                    title="Orders & Fulfillment"
                    description="Track incoming customer orders, review payment verification, and dispatch supplements."
                  />
                }
              />
              <Route
                path="customers"
                element={
                  <AdminModulePlaceholder
                    title="Customer Accounts"
                    description="Review registered customers, health profiles, and active supplement regimens."
                  />
                }
              />
              <Route
                path="subscriptions"
                element={
                  <AdminModulePlaceholder
                    title="Subscription Plans"
                    description="Manage recurring supplement deliveries, billing cycles, and membership tiers."
                  />
                }
              />
              <Route
                path="analytics"
                element={
                  <AdminModulePlaceholder
                    title="Sales & Health Analytics"
                    description="Catalogue performance, top trending ingredients, and revenue insights."
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <AdminModulePlaceholder
                    title="Administration Settings"
                    description="Configure store policies, tax rules, staff roles, and system audit logs."
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  )
}

export default AppRoutes
