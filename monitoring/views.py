from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Avg, Q
from datetime import timedelta, datetime
from .models import Website, StatusCheck, UptimeAlert, AlertNotification
from .serializers import (
    WebsiteSerializer, WebsiteCreateSerializer, StatusCheckSerializer,
    UptimeAlertSerializer, AlertNotificationSerializer,
    DashboardStatsSerializer, WebsiteStatusHistorySerializer
)
from .tasks import check_website_status


class WebsiteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing websites"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return websites for the current user only"""
        return Website.objects.filter(user=self.request.user, status='active')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return WebsiteCreateSerializer
        return WebsiteSerializer
    
    def perform_destroy(self, instance):
        """Soft delete by setting status to 'deleted'"""
        instance.status = 'deleted'
        instance.save()
    
    @action(detail=True, methods=['post'])
    def check_status(self, request, pk=None):
        """Manually trigger a status check for a specific website"""
        website = self.get_object()
        
        # Trigger the Celery task
        task = check_website_status.delay(website.id)
        
        return Response({
            'message': 'Status check initiated',
            'task_id': task.id,
            'website': website.name
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=False, methods=['post'])
    def check_all(self, request):
        """Trigger status checks for all user's websites"""
        websites = self.get_queryset()
        task_ids = []
        
        for website in websites:
            task = check_website_status.delay(website.id)
            task_ids.append(task.id)
        
        return Response({
            'message': f'Status checks initiated for {websites.count()} websites',
            'task_ids': task_ids
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get status history for a specific website"""
        website = self.get_object()
        
        # Get query parameters
        period = request.query_params.get('period', '24h')
        limit = int(request.query_params.get('limit', '100'))
        
        # Calculate time range
        now = timezone.now()
        if period == '1h':
            start_time = now - timedelta(hours=1)
        elif period == '24h':
            start_time = now - timedelta(hours=24)
        elif period == '7d':
            start_time = now - timedelta(days=7)
        elif period == '30d':
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(hours=24)
        
        # Get status checks
        status_checks = website.status_checks.filter(
            checked_at__gte=start_time
        ).order_by('-checked_at')[:limit]
        
        serializer = StatusCheckSerializer(status_checks, many=True)
        return Response({
            'website': website.name,
            'period': period,
            'checks': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for the current user"""
        websites = self.get_queryset()
        
        # Basic counts
        total_websites = websites.count()
        
        # Get latest status for each website
        online_count = 0
        offline_count = 0
        total_response_time = 0
        response_time_count = 0
        total_uptime = 0
        
        for website in websites:
            latest_check = website.latest_status_check
            if latest_check:
                if latest_check.status == 'online':
                    online_count += 1
                else:
                    offline_count += 1
                
                if latest_check.response_time:
                    total_response_time += latest_check.response_time
                    response_time_count += 1
            
            uptime = website.uptime_percentage
            if uptime is not None:
                total_uptime += uptime
        
        # Calculate averages
        avg_response_time = (total_response_time / response_time_count) if response_time_count > 0 else 0
        avg_uptime = (total_uptime / total_websites) if total_websites > 0 else 0
        
        # Count alerts in last 24 hours
        alerts_24h = AlertNotification.objects.filter(
            alert__website__user=request.user,
            sent_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        stats = {
            'total_websites': total_websites,
            'online_websites': online_count,
            'offline_websites': offline_count,
            'average_response_time': round(avg_response_time, 2),
            'average_uptime': round(avg_uptime, 2),
            'alerts_last_24h': alerts_24h
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class StatusCheckViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing status checks"""
    
    serializer_class = StatusCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return status checks for the current user's websites only"""
        return StatusCheck.objects.filter(
            website__user=self.request.user,
            website__status='active'
        ).order_by('-checked_at')


class UptimeAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for managing uptime alerts"""
    
    serializer_class = UptimeAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return alerts for the current user's websites only"""
        return UptimeAlert.objects.filter(
            website__user=self.request.user,
            website__status='active'
        )


class AlertNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing alert notifications"""
    
    serializer_class = AlertNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for the current user's websites only"""
        return AlertNotification.objects.filter(
            alert__website__user=self.request.user
        ).order_by('-sent_at')