from django.urls import path, include
from .views import CustomUserCreate, BlacklistTokenView, UserInfoView, change_password
from rest_framework.routers import DefaultRouter


app_name = 'users'

router = DefaultRouter()
router.register('user-info', UserInfoView, basename='user_info')

urlpatterns = [
    path('register/', CustomUserCreate.as_view(), name='create_user'),
    path('logout/blacklist/', BlacklistTokenView.as_view(), name='blacklist'),
    path('', include(router.urls)),
    path('change_password/', change_password, name='change_password'),
]
