from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from users.models import NewUser


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
import os
from allauth.socialaccount.models import SocialAccount
from rest_framework_simplejwt.tokens import AccessToken

consumer_key = ''
client_id = os.environ.get('GOOGLE_CLIENT')
consumer_secret = os.environ.get('GOOGLE_SECRET')
access_token_method = 'POST'
access_token_url = 'https://www.googleapis.com/oauth2/v4/token'
callback_url = 'http://localhost:3000/api/auth/callback/google'
scope = ['openid', 'profile', 'email']

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def google_login(request):
    print('view in')

    adapter = GoogleOAuth2Adapter(request)
    client = OAuth2Client(adapter, client_id, consumer_secret, access_token_method, access_token_url, callback_url, scope)
    client.client_id = client_id
    token = request.data.get('id_token')

    print(request.data)

    # Decode the ID token to get a dictionary
    # decoded_token = adapter.verify_and_decode(token)

    # Access the 'sub' field from the decoded token
    # google_user_id = decoded_token.get("sub")
    google_user_id = "112564696803489595108"

    social_account = SocialAccount.objects.get(uid=google_user_id)
    user = social_account.user

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    print(refresh)
    # print(refresh.refresh_token)
    return Response({'access_token': access_token, 'id': user.id, 'username': user.username})
