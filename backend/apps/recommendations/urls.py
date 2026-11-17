from django.urls import path
from . import views

urlpatterns = [
    path("recommendations/latest/", views.RecommendationLatestView.as_view(), name="recommendation-latest"),
    path("recommendations/<int:pk>/", views.RecommendationDetailView.as_view(), name="recommendation-detail"),
    path("recommendations/<int:recommendation_id>/feedback/", views.RecommendationFeedbackView.as_view(), name="recommendation-feedback"),
]
