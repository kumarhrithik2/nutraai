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
const AdminOverviewPage = lazy(() => import('../pages/admin/AdminOverviewPage.jsx'))
const AdminInventoryPage = lazy(() => import('../pages/admin/AdminInventoryPage.jsx'))
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage.jsx'))
const AdminCustomersPage = lazy(() => import('../pages/admin/AdminCustomersPage.jsx'))
const AdminSubscriptionsPage = lazy(() => import('../pages/admin/AdminSubscriptionsPage.jsx'))
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage.jsx'))
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage.jsx'))

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
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="cart" element={<CommercePages page="cart" />} />
            <Route path="checkout" element={<CommercePages page="checkout" />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="subscriptions" element={<SubscriptionDashboard />} />
            <Route path="subscriptions/membership" element={<Navigate to="/dashboard/subscriptions" replace />} />
            <Route path="subscriptions/supplements" element={<Navigate to="/dashboard/subscriptions" replace />} />
            <Route path="subscriptions/billing" element={<Navigate to="/dashboard/subscriptions" replace />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Standalone Admin Portal */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<AdminOverviewPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="inventory" element={<AdminInventoryPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  )
}

export default AppRoutes
