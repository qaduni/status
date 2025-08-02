from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator
from django.utils import timezone


class Website(models.Model):
    """Model to store websites to be monitored"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('deleted', 'Deleted'),
    ]
    
    name = models.CharField(max_length=255, help_text="Display name for the website")
    url = models.URLField(validators=[URLValidator()], help_text="URL to monitor")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='websites')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Monitoring settings
    check_interval = models.PositiveIntegerField(default=60, help_text="Check interval in seconds")
    timeout = models.PositiveIntegerField(default=10, help_text="Request timeout in seconds")
    
    class Meta:
        unique_together = ['user', 'url']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.url})"
    
    @property
    def latest_status_check(self):
        """Get the most recent status check for this website"""
        return self.status_checks.order_by('-checked_at').first()
    
    @property
    def uptime_percentage(self):
        """Calculate uptime percentage from recent status checks"""
        recent_checks = self.status_checks.order_by('-checked_at')[:100]  # Last 100 checks
        if not recent_checks:
            return 0
        
        successful_checks = recent_checks.filter(status='online').count()
        return (successful_checks / len(recent_checks)) * 100


class StatusCheck(models.Model):
    """Model to store individual status check results"""
    
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('slow', 'Slow'),
        ('error', 'Error'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='status_checks')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    status_code = models.PositiveIntegerField(null=True, blank=True, help_text="HTTP status code")
    response_time = models.PositiveIntegerField(null=True, blank=True, help_text="Response time in milliseconds")
    error_message = models.TextField(null=True, blank=True, help_text="Error message if check failed")
    checked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['website', '-checked_at']),
            models.Index(fields=['status', '-checked_at']),
        ]
    
    def __str__(self):
        return f"{self.website.name} - {self.status} at {self.checked_at}"


class UptimeAlert(models.Model):
    """Model to store uptime alert configurations"""
    
    ALERT_TYPES = [
        ('down', 'Website Down'),
        ('slow', 'Slow Response'),
        ('up', 'Website Back Up'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=10, choices=ALERT_TYPES)
    threshold = models.PositiveIntegerField(help_text="Threshold value (e.g., response time in ms)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['website', 'alert_type']
    
    def __str__(self):
        return f"{self.website.name} - {self.get_alert_type_display()}"


class AlertNotification(models.Model):
    """Model to store sent alert notifications"""
    
    alert = models.ForeignKey(UptimeAlert, on_delete=models.CASCADE, related_name='notifications')
    status_check = models.ForeignKey(StatusCheck, on_delete=models.CASCADE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"Alert for {self.alert.website.name} at {self.sent_at}"