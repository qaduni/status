from rest_framework import serializers
from .models import Website, StatusCheck, UptimeAlert, AlertNotification


class StatusCheckSerializer(serializers.ModelSerializer):
    """Serializer for StatusCheck model"""
    
    class Meta:
        model = StatusCheck
        fields = ['id', 'status', 'status_code', 'response_time', 'error_message', 'checked_at']
        read_only_fields = ['id', 'checked_at']


class WebsiteSerializer(serializers.ModelSerializer):
    """Serializer for Website model"""
    
    latest_status_check = StatusCheckSerializer(read_only=True)
    uptime_percentage = serializers.ReadOnlyField()
    recent_checks = serializers.SerializerMethodField()
    
    class Meta:
        model = Website
        fields = [
            'id', 'name', 'url', 'status', 'created_at', 'updated_at',
            'check_interval', 'timeout', 'latest_status_check', 
            'uptime_percentage', 'recent_checks'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'latest_status_check', 'uptime_percentage']
    
    def get_recent_checks(self, obj):
        """Get recent status checks for the website"""
        recent_checks = obj.status_checks.order_by('-checked_at')[:10]
        return StatusCheckSerializer(recent_checks, many=True).data
    
    def create(self, validated_data):
        """Create a new website and associate it with the current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WebsiteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new websites"""
    
    class Meta:
        model = Website
        fields = ['name', 'url', 'check_interval', 'timeout']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UptimeAlertSerializer(serializers.ModelSerializer):
    """Serializer for UptimeAlert model"""
    
    class Meta:
        model = UptimeAlert
        fields = ['id', 'website', 'alert_type', 'threshold', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        # Ensure the website belongs to the current user
        website = validated_data['website']
        if website.user != self.context['request'].user:
            raise serializers.ValidationError("You can only create alerts for your own websites.")
        return super().create(validated_data)


class AlertNotificationSerializer(serializers.ModelSerializer):
    """Serializer for AlertNotification model"""
    
    alert = UptimeAlertSerializer(read_only=True)
    status_check = StatusCheckSerializer(read_only=True)
    
    class Meta:
        model = AlertNotification
        fields = ['id', 'alert', 'status_check', 'message', 'sent_at']
        read_only_fields = ['id', 'sent_at']


class WebsiteStatusHistorySerializer(serializers.Serializer):
    """Serializer for website status history"""
    
    website_id = serializers.IntegerField()
    period = serializers.ChoiceField(choices=['1h', '24h', '7d', '30d'], default='24h')
    
    def validate_website_id(self, value):
        """Validate that the website exists and belongs to the user"""
        try:
            website = Website.objects.get(id=value, user=self.context['request'].user)
            return value
        except Website.DoesNotExist:
            raise serializers.ValidationError("Website not found or you don't have permission to access it.")


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    
    total_websites = serializers.IntegerField()
    online_websites = serializers.IntegerField()
    offline_websites = serializers.IntegerField()
    average_response_time = serializers.FloatField()
    average_uptime = serializers.FloatField()
    alerts_last_24h = serializers.IntegerField()