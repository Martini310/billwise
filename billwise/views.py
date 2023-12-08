from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from users.models import NewUser
from rest_framework import status
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialAccount
import os
from django.db import transaction
import jwt

class CustomTokenObtainPairView(TokenObtainPairView):
    # Replace the serializer with your custom
    serializer_class = CustomTokenObtainPairSerializer


consumer_key = ''
client_id = os.environ.get('GOOGLE_CLIENT')
consumer_secret = os.environ.get('GOOGLE_SECRET')
access_token_method = 'POST'
access_token_url = 'https://www.googleapis.com/oauth2/v4/token'
callback_url = 'http://localhost:3000/api/auth/callback/google'
scope = ['openid', 'profile', 'email']


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a
        social provider, but before the login is actually processed
        (and before the pre_social_login signal is emitted).
        """
        # Get the social account information
        social_account = sociallogin.account
        print('pre social')
        # Check if a user already exists for this social account
        try:
            print('try')
            user = social_account.user
        except NewUser.DoesNotExist:
            print('except')
            # User does not exist, initiate the signup process
            # You might want to customize this process based on your needs
            print(social_account.extra_data)
            user = NewUser.objects.create_user(email=social_account.extra_data['email'],
                                                username=social_account.extra_data['username'],
                                                password=None,  # Set a password if required
                                                first_name='test',
                                                )

        # Update the sociallogin instance with the user
        sociallogin.connect(request, user)


class GoogleLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        adapter = GoogleOAuth2Adapter(request)
        client = OAuth2Client(adapter, client_id, consumer_secret,
                                'POST', 'https://www.googleapis.com/oauth2/v4/token',
                                'http://localhost:3000/api/auth/callback/google',
                                ['openid', 'profile', 'email'])
        print(client.callback_url)

        token = request.data.get('id_token')

        # Assuming you want the user's Google ID
        google_user_id = "112564696803489595108"
        jwt_token = jwt.decode(token, options={
                    "verify_signature": False,
                    "verify_iss": True,
                    "verify_aud": True,
                    "verify_exp": True,
                },audience=client_id,)
        print(jwt)
        client.client_id = client_id
        # Use a database transaction to ensure that the user and social login are saved atomically
        with transaction.atomic():
            # Use try-except block to catch the SocialLogin.DoesNotExist exception
            try:
                social_login = adapter.complete_login(request, client, token, {"id_token": token})
            except Exception:
                # Handle the case where the user does not exist
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            

            # Extract the user object from SocialLogin
            user_instance = social_login.user if social_login.user else social_login.account.user
            user_instance.username = 'bla'
            # print(social_login.account)
            print(social_login.token)
            print(social_login.state)
            print(social_login.email_addresses)
            # Save the user and social login objects
            user_instance.save()
            social_login.save(request)

            refresh = RefreshToken.for_user(user_instance)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response({'access_token': access_token, 'refresh_token': refresh_token, 'id': user_instance.id, 'username': user_instance.username})

# class GoogleLoginView(APIView):
#     authentication_classes = []
#     permission_classes = [AllowAny]

#     def post(self, request, *args, **kwargs):
#         adapter = GoogleOAuth2Adapter(request)
#         client = OAuth2Client(adapter, client_id, consumer_secret,
#                                 'POST', 'https://www.googleapis.com/oauth2/v4/token',
#                                 'http://localhost:3000/api/auth/callback/google',
#                                 ['openid', 'profile', 'email'])
#         print(client.callback_url)

#         token = request.data.get('id_token')

#         # Assuming you want the user's Google ID
#         google_user_id = "112564696803489595108"

#         # social_account = SocialAccount.objects.get(uid=google_user_id)
#         # user = social_account.user

#         social_account = SocialAccount.objects.filter(uid=google_user_id).first()

#         if social_account:
#             user = social_account.user
#             refresh = RefreshToken.for_user(user)
#             access_token = str(refresh.access_token)
#             refresh_token = str(refresh)

#             return Response({'access_token': access_token, 'refresh_token': refresh_token, 'id': user.id, 'username': user.username})
#         else:
#             # Handle the case where the user does not exist
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)



google_login = GoogleLoginView.as_view()
