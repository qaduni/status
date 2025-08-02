from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register, login, logout, profile, change_password

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('profile/', profile, name='profile'),
    path('change-password/', change_password, name='change_password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]