from django.urls import path

from . import views

urlpatterns = [
    path("subscriptions/membership/", views.MembershipView.as_view(), name="membership"),
    path("subscriptions/supplements/", views.SupplementSubscriptionsView.as_view(), name="supplement-subscriptions"),
    path("subscriptions/<int:pk>/", views.SubscriptionDetailView.as_view(), name="subscription-detail"),
    path("billing/history/", views.BillingHistoryView.as_view(), name="billing-history"),
    path("progress/", views.ProgressListCreateView.as_view(), name="progress"),
    path("notifications/", views.NotificationListView.as_view(), name="notifications"),
    path("notifications/unread-count/", views.NotificationUnreadCountView.as_view(), name="notifications-unread"),
    path("notifications/<int:pk>/read/", views.NotificationReadView.as_view(), name="notification-read"),
    path("notifications/read-all/", views.NotificationReadAllView.as_view(), name="notifications-read-all"),
    path("settings/preferences/", views.PreferencesView.as_view(), name="preferences"),
    path("reports/latest/", views.WellnessReportView.as_view(), name="wellness-report"),
    path("wellness-plan/", views.WellnessPlanView.as_view(), name="wellness-plan"),
]
