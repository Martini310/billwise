from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated


class CustomTokenObtainPairView(TokenObtainPairView):
    # Replace the serializer with your custom
    serializer_class = CustomTokenObtainPairSerializer


class GoogleSignupView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        print('before if -------------------')
        if response.status_code == 200:
            print('in if -------------------')
            refresh = RefreshToken.for_user(self.user)
            access_token = str(refresh.access_token)
            return Response({'access_token': access_token})

        return response


from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def google_login(request):
    adapter = GoogleOAuth2Adapter()
    client = OAuth2Client(request, adapter)
    token = request.data.get('access_token')
    user = adapter.complete_login(request, client, token)
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    return Response({'access_token': access_token})