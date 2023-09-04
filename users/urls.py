from django.urls import path, include
from .views import CustomUserCreate, BlacklistTokenView, UserInfoView
from rest_framework.routers import DefaultRouter


app_name = 'users'

router = DefaultRouter()
router.register('user-info', UserInfoView, basename='user_info')

urlpatterns = [
    path('register/', CustomUserCreate.as_view(), name='create_user'),
    path('logout/blacklist/', BlacklistTokenView.as_view(), name='blacklist'),
    path('', include(router.urls))
]
