# Website Status Monitor

## Overview

This is a comprehensive full-stack website monitoring application built with Django backend and React frontend. The system tracks the status and performance of multiple websites, providing real-time monitoring capabilities, user authentication, and historical data analysis with a clean dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and building
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Authentication**: JWT token-based authentication with secure storage

### Backend Architecture
- **Framework**: Django with Django REST Framework
- **Language**: Python 3.11
- **Database**: PostgreSQL with Django ORM
- **Authentication**: JWT tokens with djangorestframework-simplejwt
- **Background Tasks**: Celery with Redis broker for periodic monitoring
- **API Pattern**: RESTful API design with comprehensive serializers
- **CORS**: Configured for frontend integration

## Key Components

### Database Schema (Django Models)
- **User Model**: Django's built-in user authentication system
- **Website Model**: Stores monitored website information (id, name, url, user, created_at, updated_at, is_active)
- **StatusCheck Model**: Records monitoring results (id, website, status, status_code, response_time, checked_at, error_message)
- **UptimeAlert Model**: User-defined alert thresholds (id, website, user, alert_type, threshold_value, is_active)
- **AlertNotification Model**: Alert history and notifications (id, alert, triggered_at, resolved_at, notification_sent)

### API Endpoints
- **Authentication**:
  - `POST /api/auth/register/` - User registration
  - `POST /api/auth/login/` - User login (returns JWT tokens)
  - `POST /api/auth/refresh/` - Refresh JWT token
- **Website Management**:
  - `GET /api/websites/` - Retrieve user's websites with latest status
  - `POST /api/websites/` - Add new website to monitor
  - `PUT /api/websites/{id}/` - Update website details
  - `DELETE /api/websites/{id}/` - Remove website from monitoring
  - `POST /api/websites/{id}/check/` - Manually trigger status check
- **Monitoring Data**:
  - `GET /api/websites/{id}/status-history/` - Historical status data
  - `GET /api/websites/{id}/uptime-stats/` - Uptime statistics

### Frontend Features
- **Authentication Pages**: Login and registration with JWT token management
- **Dashboard**: Real-time overview of all monitored services for authenticated users
- **Statistics Cards**: Total services, online/offline counts, average uptime
- **Website Cards**: Individual website status with response times and actions
- **Add Website Form**: Simple form to add new websites for monitoring
- **Historical Charts**: Response time trends and uptime visualization
- **Theme Support**: Light/dark mode toggle
- **Auto-refresh**: Periodic status checks every 60 seconds
- **User Management**: Profile settings and account management

### Background Processing
- **Celery Workers**: Asynchronous task processing for website monitoring
- **Periodic Tasks**: Automated monitoring every 60 seconds using Celery Beat
- **Redis Broker**: Message broker for task queue management
- **Alert System**: Automated notifications when websites go down or recover

## Data Flow

1. **User Registration/Login**: JWT-based authentication with secure token management
2. **Website Registration**: Authenticated users add websites through the form interface
3. **Background Monitoring**: Celery workers periodically check website availability and response times
4. **Data Storage**: Check results are stored in PostgreSQL with Django ORM
5. **Real-time Updates**: Frontend automatically refreshes to show latest status via API calls
6. **Alert Processing**: System triggers notifications when thresholds are exceeded
7. **Historical Analysis**: Past check results provide comprehensive trend analysis

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Django ORM
- **Background Tasks**: Celery with Redis broker
- **Authentication**: djangorestframework-simplejwt for JWT tokens
- **API Framework**: Django REST Framework with comprehensive serializers
- **CORS**: django-cors-headers for frontend integration
- **UI Framework**: React with shadcn/ui components
- **HTTP Client**: Native fetch API with TanStack Query
- **Styling**: Tailwind CSS with CSS variables for theming

### Development Tools
- **Python**: Django development server with auto-reload
- **TypeScript**: Frontend type safety
- **Vite**: Frontend development server and build tool
- **Database Migrations**: Django's built-in migration system

## Deployment Strategy

### Development Environment
- **Backend**: Django development server on port 8000
- **Frontend**: Vite build integrated with Django static files
- **Database**: PostgreSQL via DATABASE_URL environment variable
- **Task Queue**: Celery workers with Redis broker for background processing

### Production Setup
- **Django**: WSGI/ASGI server deployment
- **Static Files**: Django serves built React frontend
- **Database**: PostgreSQL with proper migrations
- **Background Processing**: Celery workers and beat scheduler
- **Monitoring**: Comprehensive logging and error tracking

### Environment Configuration
- **Database**: DATABASE_URL for PostgreSQL connection
- **Redis**: Required for Celery task queue
- **Django Secret**: SECRET_KEY for session security
- **CORS**: Configured domains for frontend access

## Setup Instructions

1. **Database Setup**: Ensure PostgreSQL is running and DATABASE_URL is set
2. **Install Dependencies**: `pip install -r requirements.txt` and `npm install`
3. **Run Migrations**: `python manage.py migrate`
4. **Create Superuser**: `python manage.py createsuperuser`
5. **Build Frontend**: `npm run build` and copy to Django static files
6. **Start Django**: `python manage.py runserver 0.0.0.0:8000`
7. **Start Celery**: `celery -A backend worker --loglevel=info` (separate terminal)
8. **Start Beat**: `celery -A backend beat --loglevel=info` (separate terminal)

The application now features a robust Django backend with comprehensive user authentication, background task processing, and seamless React frontend integration.