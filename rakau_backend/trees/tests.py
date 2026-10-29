from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Significance, Species, Tree


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

    def test_oldest_first(self):
        first, second, third = self.make_trees(self.user, 3)
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url, {"ordering": "oldest"})
        self.assertEqual(
            [t["id"] for t in response.data["results"]], [first.id, second.id, third.id]
        )

    def test_oldest_first_paginates_without_gaps(self):
        trees = self.make_trees(self.user, 25)
        self.client.force_authenticate(self.user)
        page1 = self.client.get(self.url, {"ordering": "oldest"}).data["results"]
        page2 = self.client.get(self.url, {"ordering": "oldest", "page": 2}).data["results"]
        self.assertEqual([t["id"] for t in page1 + page2], [t.id for t in trees])

    def test_main_list_ordering(self):
        mine = self.make_trees(self.user, 2)
        theirs = self.make_trees(self.other, 1)
        newest = [t["id"] for t in self.client.get("/api/trees/").data]
        oldest = [t["id"] for t in self.client.get("/api/trees/", {"ordering": "oldest"}).data]
        expected = [t.id for t in mine + theirs]
        self.assertEqual(oldest, expected)
        self.assertEqual(newest, expected[::-1])

    def test_invalid_ordering_returns_400(self):
        response = self.client.get("/api/trees/", {"ordering": "height"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ordering", response.data)

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


class SignificanceFilterTests(APITestCase):
    url = "/api/trees/"

    def setUp(self):
        self.user = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )
        # One tree per status in Otago, plus a heritage tree in Canterbury for the
        # combined significance + region filter
        self.otago = {
            status_value: self.make_tree(i, status_value, "otago")
            for i, status_value in enumerate(Significance.values)
        }
        self.canterbury_heritage = self.make_tree(10, Significance.HERITAGE, "canterbury")

    def make_tree(self, i, significance, region):
        # Distinct longitudes keep each tree clear of the one-per-location constraint
        return Tree.objects.create(
            owner=self.user,
            species=self.species,
            latitude=-45.0,
            longitude=170.0 + i / 1000,
            condition="healthy",
            region=region,
            significance_status=significance,
        )

    def ids(self, response, url=None):
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"] if url == "mine" else response.data
        return {t["id"] for t in results}

    def test_each_status_returns_only_trees_with_that_status(self):
        for status_value in Significance.values:
            with self.subTest(significance_status=status_value):
                expected = {t.id for t in Tree.objects.filter(significance_status=status_value)}
                response = self.client.get(self.url, {"significance_status": status_value})
                self.assertEqual(self.ids(response), expected)

    def test_significant_only_excludes_none(self):
        response = self.client.get(self.url, {"significant_only": "true"})
        expected = {t.id for t in Tree.objects.exclude(significance_status=Significance.NONE)}
        self.assertEqual(self.ids(response), expected)
        self.assertNotIn(self.otago[Significance.NONE].id, self.ids(response))

    def test_significant_only_false_applies_no_filter(self):
        response = self.client.get(self.url, {"significant_only": "false"})
        self.assertEqual(self.ids(response), set(Tree.objects.values_list("id", flat=True)))

    def test_significance_combined_with_region_satisfies_both(self):
        response = self.client.get(
            self.url, {"significance_status": "heritage", "region": "canterbury"}
        )
        self.assertEqual(self.ids(response), {self.canterbury_heritage.id})

        response = self.client.get(self.url, {"significant_only": "true", "region": "otago"})
        self.assertEqual(
            self.ids(response),
            {
                self.otago[s].id
                for s in (
                    Significance.LOCALLY_NOTABLE,
                    Significance.HERITAGE,
                    Significance.PROTECTED,
                )
            },
        )

    def test_filters_apply_to_my_trees(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.url}mine/", {"significance_status": "protected"})
        self.assertEqual(self.ids(response, "mine"), {self.otago[Significance.PROTECTED].id})

    def test_unknown_status_returns_400(self):
        response = self.client.get(self.url, {"significance_status": "famous"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("significance_status", response.data)

    def test_create_without_status_defaults_to_none(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {
                "species_slug": self.species.slug,
                "latitude": -46.0,
                "longitude": 171.0,
                "condition": "healthy",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["significance_status"], Significance.NONE)

    def test_create_with_invalid_status_returns_400(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {
                "species_slug": self.species.slug,
                "latitude": -46.0,
                "longitude": 171.0,
                "condition": "healthy",
                "significance_status": "famous",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("significance_status", response.data)


class AddressFieldTests(APITestCase):
    url = "/api/trees/"

    def setUp(self):
        self.user = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )
        self.client.force_authenticate(self.user)

    def payload(self, **overrides):
        return {
            "species_slug": self.species.slug,
            "latitude": -45.8655,
            "longitude": 170.5145,
            "condition": "healthy",
            **overrides,
        }

    def test_create_with_full_address(self):
        address = {
            "street_address": "51 Union Street",
            "suburb": "North Dunedin",
            "city": "Dunedin",
            "postcode": "9016",
        }
        response = self.client.post(self.url, self.payload(**address), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        for field, value in address.items():
            self.assertEqual(response.data[field], value)

    def test_region_is_saved_and_shown_in_my_trees(self):
        # UAT I2: an auto-filled region has to survive the save and appear in My Trees
        response = self.client.post(
            self.url,
            self.payload(street_address="149 Forfar Street", region="otago"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["region"], "otago")
        mine = self.client.get(f"{self.url}mine/").data["results"]
        self.assertEqual(mine[0]["id"], response.data["id"])
        self.assertEqual(mine[0]["region"], "otago")

    def test_region_can_be_left_blank(self):
        response = self.client.post(self.url, self.payload(region=""), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["region"], "")

    def test_unknown_region_returns_400(self):
        response = self.client.post(self.url, self.payload(region="atlantis"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("region", response.data)

    def test_address_is_optional(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        for field in ["street_address", "suburb", "city", "postcode"]:
            self.assertEqual(response.data[field], "")

    def test_postcode_with_leading_zero_is_kept(self):
        response = self.client.post(self.url, self.payload(postcode="0627"), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["postcode"], "0627")

    def test_invalid_postcode_returns_400(self):
        for postcode in ["901", "90160", "ABCD", "90 6"]:
            with self.subTest(postcode=postcode):
                response = self.client.post(
                    self.url, self.payload(postcode=postcode), format="json"
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("postcode", response.data)
        self.assertEqual(Tree.objects.count(), 0)

    def test_address_can_be_updated(self):
        tree = Tree.objects.create(
            owner=self.user,
            species=self.species,
            latitude=-45.8655,
            longitude=170.5145,
            condition="healthy",
        )
        response = self.client.patch(
            f"{self.url}{tree.id}/",
            {"street_address": "1 Queen Street", "city": "Auckland", "postcode": "1010"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tree.refresh_from_db()
        self.assertEqual(
            (tree.street_address, tree.city, tree.postcode), ("1 Queen Street", "Auckland", "1010")
        )
