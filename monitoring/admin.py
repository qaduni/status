from django.contrib import admin
from .models import Website, StatusCheck, UptimeAlert, AlertNotification


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    """Admin interface for Website model"""
    
    list_display = ['name', 'url', 'user', 'status', 'check_interval', 'created_at']
    list_filter = ['status', 'created_at', 'check_interval']
    search_fields = ['name', 'url', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'latest_status_check', 'uptime_percentage']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'url', 'user', 'status')
        }),
        ('Monitoring Settings', {
            'fields': ('check_interval', 'timeout')
        }),
        ('Status Information', {
            'fields': ('latest_status_check', 'uptime_percentage'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def latest_status_check(self, obj):
        """Display latest status check"""
        latest = obj.latest_status_check
        if latest:
            return f"{latest.status} - {latest.checked_at}"
        return "No checks yet"
    latest_status_check.short_description = "Latest Status"


@admin.register(StatusCheck)
class StatusCheckAdmin(admin.ModelAdmin):
    """Admin interface for StatusCheck model"""
    
    list_display = ['website', 'status', 'status_code', 'response_time', 'checked_at']
    list_filter = ['status', 'checked_at', 'website']
    search_fields = ['website__name', 'website__url']
    readonly_fields = ['checked_at']
    
    def has_add_permission(self, request):
        """Disable manual creation of status checks"""
        return False


@admin.register(UptimeAlert)
class UptimeAlertAdmin(admin.ModelAdmin):
    """Admin interface for UptimeAlert model"""
    
    list_display = ['website', 'alert_type', 'threshold', 'is_active', 'created_at']
    list_filter = ['alert_type', 'is_active', 'created_at']
    search_fields = ['website__name', 'website__url']


@admin.register(AlertNotification)
class AlertNotificationAdmin(admin.ModelAdmin):
    """Admin interface for AlertNotification model"""
    
    list_display = ['alert', 'status_check', 'sent_at']
    list_filter = ['sent_at', 'alert__alert_type']
    search_fields = ['alert__website__name', 'message']
    readonly_fields = ['sent_at']
    
    def has_add_permission(self, request):
        """Disable manual creation of alert notifications"""
        return False