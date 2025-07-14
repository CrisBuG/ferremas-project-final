from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ReportTypeViewSet

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'types', ReportTypeViewSet, basename='report-type')

urlpatterns = [
    path('', include(router.urls)),
]