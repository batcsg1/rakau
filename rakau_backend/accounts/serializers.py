from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken


class RegisterSerializer(serializers.ModelSerializer):
    # Required because it's what users log in with
    email = serializers.EmailField()
    # Optional on Django's User model, but required to sign up
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password"]

    def validate_email(self, value):
        # Django doesn't make email unique, so block duplicates here (case-insensitive)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        # Runs AUTH_PASSWORD_VALIDATORS (too common, too similar to the username/name/email, etc.)
        user = User(
            username=attrs.get("username"),
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(attrs["password"], user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """
    Logs in with email + password and returns JWT tokens plus the user,
    so the client doesn't need a separate /me/ call after logging in.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    default_error_message = "Invalid email or password."

    def validate(self, attrs):
        try:
            user = User.objects.get(email__iexact=attrs["email"])
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            # Hash anyway so a missing email takes as long as a wrong password,
            # which stops response times revealing which emails have accounts
            User().set_password(attrs["password"])
            raise AuthenticationFailed(self.default_error_message)

        # authenticate() checks the password and rejects inactive accounts
        user = authenticate(
            request=self.context.get("request"),
            username=user.get_username(),
            password=attrs["password"],
        )
        if user is None:
            raise AuthenticationFailed(self.default_error_message)

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff"]
        read_only_fields = fields
