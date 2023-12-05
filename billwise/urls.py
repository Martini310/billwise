from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (TokenRefreshView)
from .views import CustomTokenObtainPairView, GoogleSignupView

urlpatterns = [
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/user/', include('users.urls', namespace='users')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('accounts/', include('allauth.urls')),
    path('api/google/', GoogleSignupView.as_view(), name='google_signup'),
]
