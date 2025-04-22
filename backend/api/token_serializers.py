from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Override the default 'username' field to use 'email' for authentication
    username_field = 'email'  # tell simplejwt to expect 'email' instead of 'username'

    def validate(self, attrs):
        # Extract email and password from the incoming request data
        email = attrs.get("email")
        password = attrs.get("password")

        # Use Django's authenticate function to verify email and password
        # Pass the request in context for authentication backends that need it
        user = authenticate(request=self.context.get('request'), email=email, password=password)

        # If authentication fails, raise a validation error explaining the problem
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        # Call the superclass method to generate token data (access and refresh tokens)
        data = super().validate(attrs)

        # Add the user's email to the response data for convenience on the client side
        data['email'] = user.email
        return data