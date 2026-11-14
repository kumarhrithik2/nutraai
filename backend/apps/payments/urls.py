from django.urls import path

from . import views

urlpatterns = [
    path("payments/verify/", views.VerifyPaymentView.as_view(), name="payment-verify"),
    path("payments/webhook/", views.WebhookView.as_view(), name="payment-webhook"),
]
