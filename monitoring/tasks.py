import requests
import time
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from .models import Website, StatusCheck


@shared_task
def check_website_status(website_id):
    """
    Celery task to check the status of a website
    """
    try:
        website = Website.objects.get(id=website_id, status='active')
    except Website.DoesNotExist:
        return f"Website with id {website_id} not found or not active"
    
    start_time = time.time()
    status = 'offline'
    status_code = None
    response_time = None
    error_message = None
    
    try:
        # Make the request
        response = requests.head(
            website.url,
            timeout=website.timeout,
            headers={'User-Agent': 'StatusMonitor/1.0'},
            allow_redirects=True
        )
        
        response_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds
        status_code = response.status_code
        
        if response.ok:
            # Determine if it's slow or online
            if response_time > 3000:  # 3 seconds threshold
                status = 'slow'
            else:
                status = 'online'
        else:
            status = 'offline'
            error_message = f"HTTP {status_code}"
            
    except requests.exceptions.Timeout:
        response_time = website.timeout * 1000  # Convert to milliseconds
        status = 'offline'
        error_message = "Request timeout"
        
    except requests.exceptions.ConnectionError:
        response_time = int((time.time() - start_time) * 1000)
        status = 'offline'
        error_message = "Connection failed"
        
    except requests.exceptions.RequestException as e:
        response_time = int((time.time() - start_time) * 1000)
        status = 'error'
        error_message = str(e)
    
    # Save the status check result
    status_check = StatusCheck.objects.create(
        website=website,
        status=status,
        status_code=status_code,
        response_time=response_time,
        error_message=error_message
    )
    
    # Check if we need to send alerts
    check_and_send_alerts.delay(status_check.id)
    
    return {
        'website_id': website.id,
        'website_name': website.name,
        'status': status,
        'response_time': response_time,
        'status_code': status_code,
        'error_message': error_message
    }


@shared_task
def check_all_websites():
    """
    Celery task to check all active websites
    """
    active_websites = Website.objects.filter(status='active')
    results = []
    
    for website in active_websites:
        task = check_website_status.delay(website.id)
        results.append({
            'website_id': website.id,
            'website_name': website.name,
            'task_id': task.id
        })
    
    return {
        'message': f'Initiated checks for {len(results)} websites',
        'results': results
    }


@shared_task
def check_and_send_alerts(status_check_id):
    """
    Check if any alerts should be triggered based on the status check
    """
    try:
        from .models import StatusCheck, UptimeAlert, AlertNotification
        
        status_check = StatusCheck.objects.get(id=status_check_id)
        website = status_check.website
        
        # Get active alerts for this website
        alerts = UptimeAlert.objects.filter(website=website, is_active=True)
        
        notifications_sent = []
        
        for alert in alerts:
            should_send = False
            
            if alert.alert_type == 'down' and status_check.status in ['offline', 'error']:
                should_send = True
            elif alert.alert_type == 'slow' and status_check.response_time and status_check.response_time > alert.threshold:
                should_send = True
            elif alert.alert_type == 'up' and status_check.status == 'online':
                # Only send 'up' alert if the previous status was down
                previous_check = StatusCheck.objects.filter(
                    website=website,
                    checked_at__lt=status_check.checked_at
                ).order_by('-checked_at').first()
                
                if previous_check and previous_check.status in ['offline', 'error']:
                    should_send = True
            
            if should_send:
                # Create alert notification
                message = f"Alert for {website.name}: {alert.get_alert_type_display()}"
                if alert.alert_type == 'down':
                    message += f" - Status: {status_check.status}"
                    if status_check.error_message:
                        message += f" - Error: {status_check.error_message}"
                elif alert.alert_type == 'slow':
                    message += f" - Response time: {status_check.response_time}ms (threshold: {alert.threshold}ms)"
                elif alert.alert_type == 'up':
                    message += f" - Website is back online"
                
                notification = AlertNotification.objects.create(
                    alert=alert,
                    status_check=status_check,
                    message=message
                )
                
                notifications_sent.append({
                    'alert_type': alert.alert_type,
                    'message': message
                })
        
        return {
            'status_check_id': status_check_id,
            'notifications_sent': len(notifications_sent),
            'details': notifications_sent
        }
        
    except StatusCheck.DoesNotExist:
        return f"StatusCheck with id {status_check_id} not found"


@shared_task
def cleanup_old_status_checks():
    """
    Cleanup old status checks to prevent database bloat
    Keep only the last 1000 checks per website
    """
    from django.db.models import OuterRef, Subquery
    
    websites = Website.objects.filter(status='active')
    total_deleted = 0
    
    for website in websites:
        # Get the 1000th most recent check for this website
        threshold_check = StatusCheck.objects.filter(
            website=website
        ).order_by('-checked_at')[999:1000]
        
        if threshold_check:
            threshold_date = threshold_check[0].checked_at
            
            # Delete checks older than the threshold
            deleted_count = StatusCheck.objects.filter(
                website=website,
                checked_at__lt=threshold_date
            ).delete()[0]
            
            total_deleted += deleted_count
    
    return f"Cleaned up {total_deleted} old status checks"


# Periodic task setup (to be configured in celery beat)
@shared_task
def periodic_website_checks():
    """
    Periodic task to check all websites
    This should be called every minute by celery beat
    """
    return check_all_websites.delay()