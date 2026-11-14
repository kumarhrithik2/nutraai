from django.urls import path

from . import views

urlpatterns = [
    path("cart/", views.CartView.as_view(), name="cart"),
    path("cart/items/", views.CartItemsView.as_view(), name="cart-items"),
    path("cart/items/<int:product_id>/", views.CartItemDetailView.as_view(), name="cart-item"),
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("orders/", views.OrderListView.as_view(), name="order-list"),
    path("orders/<str:number>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("orders/<str:number>/cancel/", views.OrderCancelView.as_view(), name="order-cancel"),
    path("orders/<str:number>/pay/", views.OrderPayView.as_view(), name="order-pay"),
]
