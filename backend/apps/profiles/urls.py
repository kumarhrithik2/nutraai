from django.urls import path

from . import views

urlpatterns = [
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("profile/avatar/", views.AvatarView.as_view(), name="profile-avatar"),
    path("profile/options/", views.OptionsView.as_view(), name="profile-options"),
    path("profile/consents/", views.ConsentView.as_view(), name="profile-consents"),
    path("addresses/", views.AddressListView.as_view(), name="address-list"),
    path("addresses/<int:pk>/", views.AddressDetailView.as_view(), name="address-detail"),
]
