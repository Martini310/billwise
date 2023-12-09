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
from django.contrib.auth import get_user_model

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


# class GoogleLoginView(APIView):
#     authentication_classes = []
#     permission_classes = [AllowAny]

#     def post(self, request, *args, **kwargs):
#         adapter = GoogleOAuth2Adapter(request)
#         client = OAuth2Client(adapter, client_id, consumer_secret,
#                                 'POST', 'https://www.googleapis.com/oauth2/v4/token',
#                                 'http://localhost:8000/accounts/google/login/callback',
#                                 ['openid', 'profile', 'email'])
#         print(client.callback_url)

#         token = request.data.get('id_token')

#         client.client_id = client_id
#         # Use a database transaction to ensure that the user and social login are saved atomically
#         with transaction.atomic():
#             # Use try-except block to catch the SocialLogin.DoesNotExist exception
#             try:
#                 social_login = adapter.complete_login(request, client, token, {"id_token": token})
#             except Exception:
#                 # Handle the case where the user does not exist
#                 return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
#             print(social_login.account.extra_data)
            
#             # Extract user data from SocialAccount.extra_data
#             extra_data = social_login.account.extra_data

#             user_data = {
#                 'email': extra_data.get('email'),
#                 'username': extra_data.get('given_name', ''),  # Use a default if username is not present
#                 'first_name': extra_data.get('given_name', ''),
#             }

#             # Create or update the user
#             # user_instance, created = NewUser.objects.update_or_create(
#             #     email=user_data['email'],
#             #     defaults=user_data
#             # )
#             user_instance = NewUser(**user_data)
#             # user_instance, created = NewUser.objects.get_or_create(email=user_data['email'], defaults=user_data)
#             user_instance.save()

#             print(social_login)
#             users = NewUser.objects.all()
#             print(users)

#             # Associate the user_instance with the SocialAccount
#             social_account, created = SocialAccount.objects.get_or_create(
#                 user=user_instance,
#                 provider='google',  # Adjust based on your actual provider
#                 uid=extra_data.get('sub')
#             )
#             print(created)

#             social_login.account = social_account
#             print(social_login.account)

#             users = NewUser.objects.all()
#             print(users)
#             socials = SocialAccount.objects.all()
#             print(socials)

#             print('----------------')

#             print(user_instance.id)

#             refresh = RefreshToken.for_user(user_instance)
#             print(refresh)

#             access_token = str(refresh.access_token)
#             refresh_token = str(refresh)
#             print(refresh.payload)

#             return Response({'access_token': access_token, 'refresh_token': refresh_token, 'id': user_instance.id, 'username': user_instance.username})


class GoogleLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        adapter = GoogleOAuth2Adapter(request)
        client = OAuth2Client(adapter, client_id, consumer_secret,
                                'POST', 'https://www.googleapis.com/oauth2/v4/token',
                                'http://localhost:8000/accounts/google/login/callback',
                                ['openid', 'profile', 'email'])

        token = request.data.get('id_token')
        print(token)
        client.client_id = client_id
        with transaction.atomic():
            try:
                social_login = adapter.complete_login(request, client, token, {"id_token": token})
            except Exception:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            extra_data = social_login.account.extra_data
            print(extra_data)
            email = extra_data.get('email')
            username = extra_data.get('given_name', '')

            # Check if a user with the provided email already exists
            user_instance = get_user_model().objects.filter(email=email).first()

            if not user_instance:
                # If user does not exist, create a new one
                user_instance = get_user_model()(email=email, username=username, first_name=username)
                user_instance.save()

            social_account, created = SocialAccount.objects.get_or_create(
                user=user_instance,
                provider='google',
                uid=extra_data.get('sub'),
                # extra_data=extra_data
            )

            social_login.account = social_account

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






# consumer_key = ''
# client_id = os.environ.get('GOOGLE_CLIENT')
# consumer_secret = os.environ.get('GOOGLE_SECRET')
# access_token_method = 'POST'
# access_token_url = 'https://www.googleapis.com/oauth2/v4/token'
# callback_url = 'http://localhost:3000/api/auth/callback/google'
# scope = ['openid', 'profile', 'email']

# @api_view(['POST'])
# @authentication_classes([])
# @permission_classes([])
# def google_login(request):
#     print('view in')

#     adapter = GoogleOAuth2Adapter(request)
#     client = OAuth2Client(adapter, client_id, consumer_secret, access_token_method, access_token_url, callback_url, scope)
#     client.client_id = client_id
#     token = request.data.get('id_token')

#     print(request.data)

#     # Decode the ID token to get a dictionary
#     # decoded_token = adapter.verify_and_decode(token)

#     # Access the 'sub' field from the decoded token
#     # google_user_id = decoded_token.get("sub")
#     google_user_id = "112564696803489595108"

#     social_account = SocialAccount.objects.get(uid=google_user_id)
#     user = social_account.user

#     refresh = RefreshToken.for_user(user)
#     access_token = str(refresh.access_token)
#     print(refresh)
#     # print(refresh.refresh_token)
#     return Response({'access_token': access_token, 'id': user.id, 'username': user.username})