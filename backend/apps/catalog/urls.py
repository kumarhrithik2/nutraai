from django.urls import path

from . import views

urlpatterns = [
    # Public customer catalog
    path("products/", views.ProductListView.as_view(), name="product-list"),
    path("products/facets/", views.ProductFacetsView.as_view(), name="product-facets"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("categories/<slug:slug>/", views.CategoryDetailView.as_view(), name="category-detail"),
    # Admin product catalog
    path("admin/products/", views.AdminProductListCreateView.as_view(), name="admin-product-list"),
    path("admin/products/<int:pk>/", views.AdminProductDetailView.as_view(), name="admin-product-detail"),
    path("admin/products/<int:pk>/status/", views.AdminProductStatusToggleView.as_view(), name="admin-product-status"),
    path("admin/products/<int:pk>/images/", views.AdminProductImageUploadView.as_view(), name="admin-product-image-upload"),
    path(
        "admin/products/<int:pk>/images/<int:image_id>/",
        views.AdminProductImageDeleteView.as_view(),
        name="admin-product-image-delete",
    ),
]
