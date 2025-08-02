from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WebsiteViewSet, StatusCheckViewSet, 
    UptimeAlertViewSet, AlertNotificationViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'status-checks', StatusCheckViewSet, basename='statuscheck')
router.register(r'alerts', UptimeAlertViewSet, basename='uptimealert')
router.register(r'notifications', AlertNotificationViewSet, basename='alertnotification')

urlpatterns = [
    path('', include(router.urls)),
]