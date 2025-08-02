# Website Status Monitor

A comprehensive full-stack website monitoring application built with Django backend and React frontend. Monitor multiple websites, track uptime, response times, and receive alerts when sites go down.

## Features

### Core Functionality
- **Real-time Website Monitoring**: Track multiple websites with automatic status checks
- **User Authentication**: Secure JWT-based authentication system
- **Dashboard Interface**: Clean, responsive dashboard showing all monitored sites
- **Historical Data**: Track response times and uptime over time
- **Alert System**: Get notified when websites go down or recover
- **Background Processing**: Automated monitoring using Celery workers

### Technical Features
- **Django REST API**: Comprehensive API with proper serialization
- **PostgreSQL Database**: Robust data storage with Django ORM
- **React Frontend**: Modern UI with TypeScript and Tailwind CSS
- **JWT Authentication**: Secure token-based authentication
- **Celery Integration**: Background task processing for monitoring
- **Redis Broker**: Message queue for task management

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (for Celery)

### Environment Setup
1. **Database Configuration**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/monitoring_db"
   ```

2. **Install Python Dependencies**
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt
   pip install django-cors-headers psycopg2-binary celery redis
   pip install python-decouple requests django-filter
   ```

3. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

### Database Setup
```bash
# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### Running the Application

1. **Build Frontend**
   ```bash
   npm run build
   cp -r dist/public/* client/dist/
   ```

2. **Start Django Server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Start Celery Worker** (separate terminal)
   ```bash
   celery -A backend worker --loglevel=info
   ```

4. **Start Celery Beat** (separate terminal)
   ```bash
   celery -A backend beat --loglevel=info
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token

### Website Management
- `GET /api/websites/` - List user's websites
- `POST /api/websites/` - Add new website
- `PUT /api/websites/{id}/` - Update website
- `DELETE /api/websites/{id}/` - Delete website
- `POST /api/websites/{id}/check/` - Manual status check

### Monitoring Data
- `GET /api/websites/{id}/status-history/` - Historical data
- `GET /api/websites/{id}/uptime-stats/` - Uptime statistics

## Architecture

### Backend (Django)
- **Models**: Website, StatusCheck, UptimeAlert, AlertNotification
- **Serializers**: DRF serializers for API responses
- **Views**: Class-based views with permissions
- **Authentication**: JWT tokens with djangorestframework-simplejwt
- **Background Tasks**: Celery for periodic monitoring

### Frontend (React)
- **Components**: Modular React components with TypeScript
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **Authentication**: JWT token management

### Database Schema
- **User**: Django's built-in authentication
- **Website**: Monitored sites with user association
- **StatusCheck**: Historical monitoring data
- **UptimeAlert**: User-defined alert thresholds
- **AlertNotification**: Alert history and notifications

## Development

### Project Structure
```
├── backend/              # Django project settings
├── accounts/             # User authentication app
├── monitoring/           # Core monitoring app
├── client/              # React frontend
├── manage.py            # Django management
└── requirements.txt     # Python dependencies
```

### Key Files
- `monitoring/models.py` - Database models
- `monitoring/views.py` - API endpoints
- `monitoring/tasks.py` - Celery background tasks
- `monitoring/serializers.py` - API serialization
- `backend/settings.py` - Django configuration
- `backend/celery.py` - Celery configuration

## Production Deployment

1. **Environment Variables**
   - `DATABASE_URL` - PostgreSQL connection
   - `SECRET_KEY` - Django secret key
   - `REDIS_URL` - Redis connection (default: redis://localhost:6379)

2. **Static Files**
   ```bash
   python manage.py collectstatic
   ```

3. **WSGI Server**
   - Use Gunicorn or uWSGI for production
   - Configure reverse proxy (Nginx)

4. **Background Workers**
   - Deploy Celery workers
   - Set up Celery Beat for scheduling

## License

MIT License - see LICENSE file for details.