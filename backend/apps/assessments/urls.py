from django.urls import path

from . import views

urlpatterns = [
    path("assessment/questions/", views.QuestionsView.as_view(), name="assessment-questions"),
    path("assessments/", views.AssessmentListCreateView.as_view(), name="assessment-list"),
    path("assessments/latest/", views.AssessmentLatestView.as_view(), name="assessment-latest"),
    path("assessments/<int:pk>/", views.AssessmentDetailView.as_view(), name="assessment-detail"),
]
