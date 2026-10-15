from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

PASSWORD = "Tane-Mahuta-2026"


class RegisterTests(APITestCase):
    url = reverse("register")

    def payload(self, **overrides):
        # A valid registration; each test overrides only the field it's checking
        return {
            "username": "kauri_fan",
            "email": "kauri@example.com",
            "first_name": "Tāne",
            "last_name": "Mahuta",
            "password": PASSWORD,
            **overrides,
        }

    def test_register_creates_user_and_hides_password(self):
        response = self.client.post(self.url, self.payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        user = User.objects.get(username="kauri_fan")
        self.assertTrue(user.check_password(PASSWORD))
        self.assertEqual((user.first_name, user.last_name), ("Tāne", "Mahuta"))

    def test_first_and_last_name_are_required(self):
        data = self.payload()
        del data["first_name"], data["last_name"]
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)
        self.assertIn("last_name", response.data)

    def test_blank_names_are_rejected(self):
        response = self.client.post(self.url, self.payload(first_name="  ", last_name=""))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)
        self.assertIn("last_name", response.data)

    def test_email_is_required(self):
        data = self.payload()
        del data["email"]
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ["email"])

    def test_email_is_stored_lowercase(self):
        self.client.post(self.url, self.payload(email="Kauri@Example.com"))
        self.assertEqual(User.objects.get(username="kauri_fan").email, "kauri@example.com")

    def test_duplicate_username_returns_400(self):
        User.objects.create_user("kauri_fan", email="first@example.com", password=PASSWORD)
        response = self.client.post(self.url, self.payload(email="second@example.com"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ["username"])

    def test_duplicate_email_is_case_insensitive(self):
        User.objects.create_user("first", email="kauri@example.com", password=PASSWORD)
        response = self.client.post(self.url, self.payload(email="KAURI@example.com"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ["email"])

    def test_weak_password_returns_400_on_password_field(self):
        response = self.client.post(self.url, self.payload(password="password"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ["password"])

    def test_password_too_similar_to_name_is_rejected(self):
        response = self.client.post(self.url, self.payload(password="mahuta123"))
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
        response = self.client.post(
            reverse("login"), {"username": "kauri_fan", "password": PASSWORD}
        )
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
