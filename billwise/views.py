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
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialAccount
import os
from django.db import transaction
# import jwt
from django.contrib.auth import get_user_model

class CustomTokenObtainPairView(TokenObtainPairView):
    # Replace the serializer with your custom
    serializer_class = CustomTokenObtainPairSerializer


client_id = os.environ.get('GOOGLE_CLIENT')
consumer_secret = os.environ.get('GOOGLE_SECRET')

import logging

logger = logging.getLogger(__name__)

from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.views import View    
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.views import OAuth2LoginView, OAuth2CallbackView
from allauth.socialaccount.providers.oauth2.client import OAuth2Client


class CustomGoogleOAuth2Adapter(GoogleOAuth2Adapter):
    def complete_login(self, request, app, token, **kwargs):
        response = super().complete_login(request, app, token, **kwargs)
        try:
            print('------------------------------------------------ --------------')
            # Customize the login process here, e.g., set cookies
            # You can access the user using `response.account.user`
            print(token)

            print(response)
            # response.set_cookie('adf', 'adfdsf')
            # return response
                # Obtain user instance from the response
            user = response.user

            # Log in the user
            login(request, user)

            # Set session data (optional)
            request.session['authenticated'] = True

            # Set cookies with tokens
            response.set_cookie('access_token', token.token)
            response.set_cookie('refresh_token', token.token_secret)

            # Redirect to the frontend
            redirect_url = 'http://127.0.0.1:3000/'
        except Exception as e:
            logger.error(f"Social login error: {e}")
            print(f"Social login error: {e}")
            raise
        return redirect(redirect_url)

class CustomGoogleLoginView(OAuth2LoginView):
    adapter_class = CustomGoogleOAuth2Adapter
    client_class = OAuth2Client

class CustomGoogleCallbackView(OAuth2CallbackView):
    adapter_class = CustomGoogleOAuth2Adapter
    client_class = OAuth2Client

abab = OAuth2LoginView.adapter_view(CustomGoogleOAuth2Adapter)
baba = OAuth2CallbackView.adapter_view(CustomGoogleOAuth2Adapter)

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    # def pre_social_login(self, request, sociallogin):
    #     """
    #     Invoked just after a user successfully authenticates via a
    #     social provider, but before the login is actually processed
    #     (and before the pre_social_login signal is emitted).
    #     """
    #     # Get the social account information
    #     social_account = sociallogin.account
    #     print('pre social')
    #     # Check if a user already exists for this social account
    #     try:
    #         print('try')
    #         user = social_account.user
    #     except NewUser.DoesNotExist:
    #         print('except')
    #         # User does not exist, initiate the signup process
    #         # You might want to customize this process based on your needs
    #         print(social_account.extra_data)
    #         user = NewUser.objects.create_user(email=social_account.extra_data['email'],
    #                                             username=social_account.extra_data['username'],
    #                                             password=None,  # Set a password if required
    #                                             first_name='test',
    #                                             )

    #     # Update the sociallogin instance with the user
    #     sociallogin.connect(request, user)
    pass














# class GoogleLoginView(APIView):
#     authentication_classes = []
#     permission_classes = [AllowAny]

#     def post(self, request, *args, **kwargs):
#         adapter = GoogleOAuth2Adapter(request)
#         client = OAuth2Client(adapter, client_id, consumer_secret,
#                                 'POST', 'https://www.googleapis.com/oauth2/v4/token',
#                                 'http://localhost:8000/accounts/google/login/callback',
#                                 ['openid', 'profile', 'email', 'id_token'])

#         token = request.data.get('id_token')
#         acctoken = request.data.get('access_token')
#         print(request.data)
#         client.client_id = client_id
#         print(client)
#         print(client.get_access_token(acctoken))


#         with transaction.atomic():
#             try:
#                 social_login = adapter.complete_login(request, client, token, {"id_token": token})
#             except Exception:
#                 return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#             extra_data = social_login.account.extra_data
#             print('extra data', extra_data)
#             email = extra_data.get('email')
#             username = extra_data.get('given_name', '')

#             # Check if a user with the provided email already exists
#             user_instance = get_user_model().objects.filter(email=email).first()

#             if not user_instance:
#                 # If user does not exist, create a new one
#                 user_instance = get_user_model()(email=email, username=username, first_name=username)
#                 user_instance.save()

#             social_account, created = SocialAccount.objects.get_or_create(
#                 user=user_instance,
#                 provider='google',
#                 uid=extra_data.get('sub'),
#                 # extra_data=extra_data
#             )

#             social_login.account = social_account

#             refresh = RefreshToken.for_user(user_instance)

#             access_token = str(refresh.access_token)
#             refresh_token = str(refresh)

#             return Response({'access_token': access_token, 'refresh_token': refresh_token, 'id': user_instance.id, 'username': user_instance.username})



















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



# google_login = GoogleLoginView.as_view()

