from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Species, Tree


class CreateTreeTests(APITestCase):
    url = "/api/trees/"

    def setUp(self):
        self.user = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )

    def payload(self, **overrides):
        return {
            "species_slug": self.species.slug,
            "latitude": -45.87,
            "longitude": 170.5,
            "condition": "healthy",
            **overrides,
        }

    def test_unauthenticated_create_returns_401(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_sets_owner_from_token_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["owner"], "kauri_fan")
        self.assertEqual(Tree.objects.get().owner, self.user)

    def test_duplicate_species_at_same_location_returns_400(self):
        self.client.force_authenticate(self.user)
        self.client.post(self.url, self.payload(), format="json")
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(Tree.objects.count(), 1)

    def test_other_user_can_record_same_species_at_same_location(self):
        other = User.objects.create_user("rimu_fan", email="rimu@example.com", password="x")
        self.client.force_authenticate(self.user)
        self.client.post(self.url, self.payload(), format="json")
        self.client.force_authenticate(other)
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_updating_a_tree_without_moving_it_is_not_a_duplicate(self):
        self.client.force_authenticate(self.user)
        tree_id = self.client.post(self.url, self.payload(), format="json").data["id"]
        response = self.client.patch(
            f"{self.url}{tree_id}/", {"condition": "stressed"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MyTreesTests(APITestCase):
    url = "/api/trees/mine/"

    def setUp(self):
        self.user = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.other = User.objects.create_user("rimu_fan", email="rimu@example.com", password="x")
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )

    def make_trees(self, owner, count, **fields):
        # Distinct longitudes keep each tree clear of the one-per-location constraint
        return [
            Tree.objects.create(
                owner=owner,
                species=self.species,
                latitude=-45.0,
                longitude=170.0 + i / 1000 + (0.5 if owner == self.other else 0),
                condition=fields.get("condition", "healthy"),
            )
            for i in range(count)
        ]

    def test_requires_authentication(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_only_returns_the_callers_trees(self):
        mine = self.make_trees(self.user, 2)
        self.make_trees(self.other, 3)
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual({t["id"] for t in response.data["results"]}, {t.id for t in mine})

    def test_newest_first(self):
        first, second = self.make_trees(self.user, 2)
        self.client.force_authenticate(self.user)
        ids = [t["id"] for t in self.client.get(self.url).data["results"]]
        self.assertEqual(ids, [second.id, first.id])

    def test_paginates_twenty_per_page(self):
        self.make_trees(self.user, 25)
        self.client.force_authenticate(self.user)

        page1 = self.client.get(self.url).data
        self.assertEqual(page1["count"], 25)
        self.assertEqual(len(page1["results"]), 20)
        self.assertIsNotNone(page1["next"])
        self.assertIsNone(page1["previous"])

        page2 = self.client.get(self.url, {"page": 2}).data
        self.assertEqual(len(page2["results"]), 5)
        self.assertIsNone(page2["next"])

    def test_page_out_of_range_returns_404(self):
        self.make_trees(self.user, 1)
        self.client.force_authenticate(self.user)
        self.assertEqual(
            self.client.get(self.url, {"page": 5}).status_code, status.HTTP_404_NOT_FOUND
        )

    def test_condition_filter_applies(self):
        self.make_trees(self.user, 2)
        Tree.objects.create(
            owner=self.user,
            species=self.species,
            latitude=-46.0,
            longitude=171.0,
            condition="stressed",
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url, {"condition": "stressed"})
        self.assertEqual(response.data["count"], 1)

    def test_main_list_is_not_paginated(self):
        # The catalogue screen expects a plain array from /api/trees/
        self.make_trees(self.user, 1)
        self.assertIsInstance(self.client.get("/api/trees/").data, list)


class SpeciesTests(APITestCase):
    url = "/api/species/"

    def setUp(self):
        self.user = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )
        Tree.objects.create(
            owner=self.user,
            species=self.species,
            latitude=-45.87,
            longitude=170.5,
            condition="healthy",
        )

    def test_list_omits_tree_count(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("tree_count", response.data[0])

    def test_detail_includes_tree_count(self):
        response = self.client.get(f"{self.url}{self.species.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["tree_count"], 1)
