from django.urls import path

from . import views

urlpatterns = [
    path("admin/overview/", views.AdminOverviewView.as_view(), name="admin-overview"),
    path("admin/inventory/", views.AdminInventoryListView.as_view(), name="admin-inventory"),
    path("admin/inventory/alerts/", views.AdminInventoryAlertsView.as_view(), name="admin-inventory-alerts"),
    path("admin/inventory/adjustments/", views.AdminStockAdjustmentsView.as_view(), name="admin-inventory-adjustments"),
    path("admin/inventory/<int:product_id>/adjust/", views.AdminInventoryAdjustView.as_view(), name="admin-inventory-adjust"),
    path("admin/orders/", views.AdminOrderListView.as_view(), name="admin-orders"),
    path("admin/orders/<str:number>/", views.AdminOrderDetailView.as_view(), name="admin-order-detail"),
    path("admin/orders/<str:number>/status/", views.AdminOrderStatusView.as_view(), name="admin-order-status"),
    path("admin/orders/<str:number>/collect-cod/", views.AdminOrderCollectCodView.as_view(), name="admin-order-collect-cod"),
    path("admin/orders/<str:number>/cancel/", views.AdminOrderCancelView.as_view(), name="admin-order-cancel"),
    path("admin/customers/", views.AdminCustomerListView.as_view(), name="admin-customers"),
    path("admin/customers/<int:user_id>/", views.AdminCustomerDetailView.as_view(), name="admin-customer-detail"),
    path("admin/customers/<int:user_id>/status/", views.AdminCustomerStatusView.as_view(), name="admin-customer-status"),
    path("admin/subscriptions/memberships/", views.AdminMembershipListView.as_view(), name="admin-memberships"),
    path("admin/subscriptions/supplements/", views.AdminSupplementSubscriptionListCreateView.as_view(), name="admin-supplement-subscriptions"),
    path("admin/subscriptions/supplements/<int:pk>/", views.AdminSupplementSubscriptionDetailView.as_view(), name="admin-supplement-subscription-detail"),
    path("admin/analytics/", views.AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("admin/settings/store/", views.AdminStoreSettingsView.as_view(), name="admin-store-settings"),
    path("admin/settings/profile/", views.AdminProfileView.as_view(), name="admin-profile"),
]
