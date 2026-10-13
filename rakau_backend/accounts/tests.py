from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

PASSWORD = "Tane-Mahuta-2026"


class RegisterTests(APITestCase):
    url = reverse("register")

    def test_register_creates_user_and_hides_password(self):
        response = self.client.post(
            self.url,
            {"username": "kauri_fan", "email": "kauri@example.com", "password": PASSWORD},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        self.assertTrue(User.objects.get(username="kauri_fan").check_password(PASSWORD))

    def test_email_is_required(self):
        response = self.client.post(self.url, {"username": "kauri_fan", "password": PASSWORD})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_email_is_stored_lowercase(self):
        self.client.post(
            self.url, {"username": "kauri_fan", "email": "Kauri@Example.com", "password": PASSWORD}
        )
        self.assertEqual(User.objects.get(username="kauri_fan").email, "kauri@example.com")

    def test_duplicate_username_returns_400(self):
        User.objects.create_user("kauri_fan", email="first@example.com", password=PASSWORD)
        response = self.client.post(
            self.url,
            {"username": "kauri_fan", "email": "second@example.com", "password": "Another-Pass-99"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_duplicate_email_is_case_insensitive(self):
        User.objects.create_user("first", email="kauri@example.com", password=PASSWORD)
        response = self.client.post(
            self.url,
            {"username": "second", "email": "KAURI@example.com", "password": "Another-Pass-99"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_weak_password_returns_400_on_password_field(self):
        response = self.client.post(
            self.url, {"username": "kauri_fan", "email": "kauri@example.com", "password": "password"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)


class LoginTests(APITestCase):
    def setUp(self):
        User.objects.create_user("kauri_fan", email="kauri@example.com", password=PASSWORD)

    def login(self, email="kauri@example.com", password=PASSWORD):
        return self.client.post(reverse("login"), {"email": email, "password": password})

    def test_login_returns_tokens_and_user(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "kauri_fan")
        self.assertNotIn("password", response.data)

    def test_email_is_case_insensitive(self):
        self.assertEqual(self.login(email="KAURI@Example.com").status_code, status.HTTP_200_OK)

    def test_wrong_password_returns_401(self):
        self.assertEqual(self.login(password="wrong").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unknown_email_returns_same_401_as_wrong_password(self):
        unknown = self.login(email="nobody@example.com")
        wrong_password = self.login(password="wrong")
        self.assertEqual(unknown.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(unknown.data, wrong_password.data)

    def test_username_is_not_accepted_in_place_of_email(self):
        response = self.client.post(reverse("login"), {"username": "kauri_fan", "password": PASSWORD})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_inactive_user_cannot_log_in(self):
        User.objects.filter(username="kauri_fan").update(is_active=False)
        self.assertEqual(self.login().status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_returns_new_access_token(self):
        refresh = self.login().data["refresh"]
        response = self.client.post(reverse("token-refresh"), {"refresh": refresh})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


class MeTests(APITestCase):
    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get(reverse("me")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_user_for_bearer_token(self):
        User.objects.create_user("kauri_fan", email="kauri@example.com", password=PASSWORD)
        access = self.client.post(
            reverse("login"), {"email": "kauri@example.com", "password": PASSWORD}
        ).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "kauri_fan")
        self.assertEqual(response.data["email"], "kauri@example.com")
