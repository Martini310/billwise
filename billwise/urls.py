from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (TokenRefreshView)
from .views import CustomTokenObtainPairView, GoogleLogin

from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/user/', include('users.urls', namespace='users')),

    path("api/auth/register/", RegisterView.as_view(), name="rest_register"),
    path("api/auth/login/", LoginView.as_view(), name="rest_login"),
    path("api/auth/logout/", LogoutView.as_view(), name="rest_logout"),
    path("api/auth/user/", UserDetailsView.as_view(), name="rest_user_details"),
    path("api/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/auth/token/refresh/", get_refresh_view().as_view(), name="token_refresh"),
    path("api/auth/google/", GoogleLogin.as_view(), name="google_login")
]
