import io
import os
import shutil
import tempfile

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Significance, Species, Tree, TreePhoto
from .serializers import MAX_PHOTO_BYTES, MAX_PHOTOS_PER_TREE


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

    # Restored from v0.2.0 (TreeValidationTests, removed in 971ae5b; #65)
    def test_invalid_create_returns_400_per_field_and_creates_nothing(self):
        self.client.force_authenticate(self.user)
        cases = {
            "species_slug": {"species_slug": "not-a-tree"},
            "condition": {"condition": "sad"},
            "latitude": {"latitude": 200},
            "longitude": {"longitude": -500},
        }
        for field, overrides in cases.items():
            with self.subTest(field=field):
                response = self.client.post(self.url, self.payload(**overrides), format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                # The shared shape: {"field": ["message", ...]}
                self.assertIsInstance(response.data[field], list)
                self.assertTrue(response.data[field])
        self.assertEqual(Tree.objects.count(), 0)

    def test_missing_required_fields_return_400(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ["species_slug", "latitude", "longitude", "condition"]:
            self.assertIn(field, response.data)
        self.assertEqual(Tree.objects.count(), 0)

    def test_retired_species_is_rejected(self):
        self.client.force_authenticate(self.user)
        self.species.is_active = False
        self.species.save()
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("species_slug", response.data)
        self.assertEqual(Tree.objects.count(), 0)


# REQ-01 AC4 to AC6: only a tree's owner can change or remove it (#43)
class UpdateDeleteTreeTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.other = User.objects.create_user("rimu_fan", email="rimu@example.com", password="x")
        species = Species.objects.create(common_name="Kauri", scientific_name="Agathis australis")
        self.tree = Tree.objects.create(
            owner=self.owner,
            species=species,
            latitude=-45.87,
            longitude=170.5,
            condition="healthy",
        )
        self.url = f"/api/trees/{self.tree.id}/"

    def saved(self):
        # Every stored column, so "unchanged" also catches a partial write or a bumped updated_at
        return Tree.objects.values().get(pk=self.tree.pk)

    def test_owner_patch_returns_200_with_changed_fields(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            self.url, {"condition": "stressed", "height_m": 12.5}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["condition"], "stressed")
        self.assertEqual(response.data["height_m"], "12.50")
        self.tree.refresh_from_db()
        self.assertEqual(self.tree.condition, "stressed")

    def test_invalid_patch_returns_400_and_leaves_tree_unchanged(self):
        self.client.force_authenticate(self.owner)
        before = self.saved()
        for field, value in [
            ("condition", "wilting"),
            ("latitude", -458.87),  # the UAT T3 typo
            ("longitude", 200),
            ("height_m", -1),
            ("species_slug", "not-a-species"),
        ]:
            with self.subTest(field=field):
                response = self.client.patch(self.url, {field: value}, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)
                self.assertEqual(self.saved(), before)

    def test_owner_delete_returns_204_and_removes_tree(self):
        self.client.force_authenticate(self.owner)
        count = Tree.objects.count()
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Tree.objects.count(), count - 1)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)

    def test_other_user_patch_returns_403_and_leaves_tree_unchanged(self):
        self.client.force_authenticate(self.other)
        before = self.saved()
        response = self.client.patch(self.url, {"condition": "dead"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.saved(), before)

    def test_other_user_delete_returns_403_and_keeps_tree(self):
        self.client.force_authenticate(self.other)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Tree.objects.filter(pk=self.tree.pk).exists())

    def test_unauthenticated_patch_returns_401_and_leaves_tree_unchanged(self):
        before = self.saved()
        response = self.client.patch(self.url, {"condition": "dead"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.saved(), before)

    def test_unauthenticated_delete_returns_401_and_keeps_tree(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Tree.objects.filter(pk=self.tree.pk).exists())

    def test_staff_can_update_and_delete_any_tree(self):
        # IsOwnerOrReadOnly lets staff moderate; the client's canModify mirrors this
        staff = User.objects.create_user("ranger", email="ranger@example.com", is_staff=True)
        self.client.force_authenticate(staff)
        response = self.client.patch(self.url, {"condition": "diseased"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.delete(self.url).status_code, status.HTTP_204_NO_CONTENT)

    # Restored from v0.2.0 (TreePermissionTests, removed in 971ae5b; #65). The rest of that
    # class is covered by the tests above
    def test_anyone_can_read_a_tree(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

    def test_tree_without_owner_can_only_be_changed_by_staff(self):
        self.tree.owner = None
        self.tree.save()
        self.client.force_authenticate(self.owner)
        response = self.client.patch(self.url, {"condition": "stressed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        staff = User.objects.create_user("ranger", email="ranger@example.com", is_staff=True)
        self.client.force_authenticate(staff)
        response = self.client.patch(self.url, {"condition": "stressed"}, format="json")
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
        self.assertEqual(page2["count"], 25)
        self.assertEqual(len(page2["results"]), 5)
        self.assertIsNone(page2["next"])
        self.assertIsNotNone(page2["previous"])

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


# Restored from v0.2.0 (removed in 971ae5b; #65)
class SpeciesPermissionTests(APITestCase):
    """IsAdminOrReadOnly: anyone reads the species list, only staff change it."""

    url = "/api/species/"

    def setUp(self):
        self.user = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.staff = User.objects.create_user(
            "ranger", email="ranger@example.com", password="x", is_staff=True
        )
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )
        self.new_species = {"common_name": "Rimu", "scientific_name": "Dacrydium cupressinum"}

    def test_anyone_can_read_species(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

    def test_regular_user_cannot_create_update_or_delete(self):
        self.client.force_authenticate(self.user)
        detail = f"{self.url}{self.species.id}/"
        create = self.client.post(self.url, self.new_species, format="json")
        update = self.client.patch(detail, {"common_name": "Not Kauri"}, format="json")
        delete = self.client.delete(detail)
        for response in (create, update, delete):
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Species.objects.count(), 1)
        self.species.refresh_from_db()
        self.assertEqual(self.species.common_name, "Kauri")

    def test_unauthenticated_cannot_create(self):
        response = self.client.post(self.url, self.new_species, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post(self.url, self.new_species, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Species.objects.count(), 2)


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


def photo_upload(fmt="JPEG", name=None, size=(8, 8), noise=False):
    # A real image made in memory; noise makes it incompressible, for the size limit
    width, height = size
    if noise:
        image = Image.frombytes("RGB", size, os.urandom(width * height * 3))
    else:
        image = Image.new("RGB", size, "green")
    buffer = io.BytesIO()
    if fmt == "PNG":
        image.save(buffer, format=fmt, compress_level=0)
    else:
        image.save(buffer, format=fmt)
    extension = {"JPEG": "jpg"}.get(fmt, fmt.lower())
    return SimpleUploadedFile(name or f"tree.{extension}", buffer.getvalue())


# Uploads go to a throwaway folder rather than the real media/ (#44)
@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="rakau-test-media-"))
class TreePhotoTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.owner = User.objects.create_user("kauri_fan", email="kauri@example.com", password="x")
        self.other = User.objects.create_user("rimu_fan", email="rimu@example.com", password="x")
        species = Species.objects.create(common_name="Kauri", scientific_name="Agathis australis")
        self.tree = Tree.objects.create(
            owner=self.owner,
            species=species,
            latitude=-45.87,
            longitude=170.5,
            condition="healthy",
        )
        self.url = f"/api/trees/{self.tree.id}/photos/"

    def upload(self, file=None, **fields):
        return self.client.post(
            self.url, {"image": file or photo_upload(), **fields}, format="multipart"
        )

    def add_photo(self):
        return TreePhoto.objects.create(tree=self.tree, image=photo_upload())

    def test_owner_upload_returns_201_and_shows_on_the_tree(self):
        self.client.force_authenticate(self.owner)
        response = self.upload(caption="New growth on the north side")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["caption"], "New growth on the north side")
        self.assertTrue(response.data["url"].startswith("http://testserver/media/trees/"))
        self.assertNotIn("image", response.data)

        photo = TreePhoto.objects.get()
        self.assertTrue(photo.image.storage.exists(photo.image.name))
        detail = self.client.get(f"/api/trees/{self.tree.id}/").data
        self.assertEqual([p["id"] for p in detail["photos"]], [photo.id])

    def test_jpeg_png_and_webp_are_accepted(self):
        self.client.force_authenticate(self.owner)
        for fmt in ["JPEG", "PNG", "WEBP"]:
            with self.subTest(fmt=fmt):
                response = self.upload(photo_upload(fmt))
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_caption_is_optional(self):
        self.client.force_authenticate(self.owner)
        response = self.upload()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["caption"], "")

    def test_anyone_can_view_photos(self):
        photo = self.add_photo()
        for user in [None, self.other]:
            with self.subTest(user=user):
                self.client.force_authenticate(user)
                response = self.client.get(self.url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual([p["id"] for p in response.data], [photo.id])

    def test_other_user_upload_returns_403_and_stores_nothing(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.upload().status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(TreePhoto.objects.exists())

    def test_unauthenticated_upload_returns_401_and_stores_nothing(self):
        self.assertEqual(self.upload().status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(TreePhoto.objects.exists())

    def test_staff_can_upload_to_any_tree(self):
        staff = User.objects.create_user("ranger", email="ranger@example.com", is_staff=True)
        self.client.force_authenticate(staff)
        self.assertEqual(self.upload().status_code, status.HTTP_201_CREATED)

    def test_wrong_file_type_returns_400(self):
        self.client.force_authenticate(self.owner)
        for label, file in [
            ("gif", photo_upload("GIF")),  # a real image, just not an allowed format
            ("text", SimpleUploadedFile("notes.txt", b"not an image")),
            ("disguised", SimpleUploadedFile("tree.jpg", b"not an image either")),
        ]:
            with self.subTest(file=label):
                response = self.upload(file)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("image", response.data)
        self.assertFalse(TreePhoto.objects.exists())

    def test_missing_image_returns_400(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(self.url, {"caption": "No file"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_file_over_5_mb_returns_400(self):
        self.client.force_authenticate(self.owner)
        big = photo_upload("PNG", size=(1400, 1400), noise=True)
        self.assertGreater(big.size, MAX_PHOTO_BYTES)
        response = self.upload(big)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["image"], ["Photos must be 5 MB or smaller."])
        self.assertFalse(TreePhoto.objects.exists())

    def test_sixth_photo_returns_400(self):
        for _ in range(MAX_PHOTOS_PER_TREE):
            self.add_photo()
        self.client.force_authenticate(self.owner)
        response = self.upload()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["image"], ["A tree can have at most 5 photos."])
        self.assertEqual(self.tree.photos.count(), MAX_PHOTOS_PER_TREE)

    def test_caption_over_200_characters_returns_400(self):
        self.client.force_authenticate(self.owner)
        response = self.upload(caption="x" * 201)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("caption", response.data)

    def test_owner_delete_returns_204_and_removes_the_file(self):
        photo = self.add_photo()
        name = photo.image.name
        self.client.force_authenticate(self.owner)
        response = self.client.delete(f"{self.url}{photo.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TreePhoto.objects.exists())
        self.assertFalse(photo.image.storage.exists(name))

    def test_other_user_delete_returns_403_and_keeps_the_photo(self):
        photo = self.add_photo()
        self.client.force_authenticate(self.other)
        response = self.client.delete(f"{self.url}{photo.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(photo.image.storage.exists(photo.image.name))

    def test_unauthenticated_delete_returns_401_and_keeps_the_photo(self):
        photo = self.add_photo()
        response = self.client.delete(f"{self.url}{photo.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(TreePhoto.objects.filter(pk=photo.pk).exists())

    def test_deleting_another_trees_photo_through_this_tree_returns_404(self):
        # Owning one tree mustn't let you delete photos on someone else's
        others_tree = Tree.objects.create(
            owner=self.other,
            species=self.tree.species,
            latitude=-36.85,
            longitude=174.76,
            condition="healthy",
        )
        photo = TreePhoto.objects.create(tree=others_tree, image=photo_upload())
        self.client.force_authenticate(self.owner)
        response = self.client.delete(f"{self.url}{photo.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(TreePhoto.objects.filter(pk=photo.pk).exists())

    def test_deleting_a_tree_removes_its_photo_files(self):
        photo = self.add_photo()
        name = photo.image.name
        self.client.force_authenticate(self.owner)
        self.client.delete(f"/api/trees/{self.tree.id}/")
        self.assertFalse(photo.image.storage.exists(name))


class TreeOwnerFilterTests(APITestCase):
    url = "/api/trees/"

    def setUp(self):
        self.kauri_fan = User.objects.create_user("kauri_fan", password="x")
        self.rimu_fan = User.objects.create_user("rimu_fan", password="x")
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )
        self.otago_tree = self.make_tree(self.kauri_fan, 0, "otago")
        self.canterbury_tree = self.make_tree(self.kauri_fan, 1, "canterbury")
        self.other_tree = self.make_tree(self.rimu_fan, 2, "otago")
        self.ownerless_tree = self.make_tree(None, 3, "otago")

    def make_tree(self, owner, i, region):
        # Distinct longitudes keep each tree clear of the one-per-location constraint
        return Tree.objects.create(
            owner=owner,
            species=self.species,
            latitude=-45.0,
            longitude=170.0 + i / 1000,
            condition="healthy",
            region=region,
        )

    def ids(self, params):
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return {t["id"] for t in response.data}

    def test_returns_only_that_users_trees(self):
        self.assertEqual(
            self.ids({"owner": "kauri_fan"}), {self.otago_tree.id, self.canterbury_tree.id}
        )

    def test_ignores_case(self):
        self.assertEqual(
            self.ids({"owner": "Kauri_Fan"}), {self.otago_tree.id, self.canterbury_tree.id}
        )

    def test_only_matches_the_whole_username(self):
        self.assertEqual(self.ids({"owner": "kauri"}), set())

    def test_unknown_username_returns_an_empty_list(self):
        self.assertEqual(self.ids({"owner": "nobody"}), set())

    def test_blank_owner_applies_no_filter(self):
        self.assertEqual(self.ids({"owner": ""}), set(Tree.objects.values_list("id", flat=True)))

    def test_combines_with_other_filters(self):
        self.assertEqual(self.ids({"owner": "kauri_fan", "region": "otago"}), {self.otago_tree.id})

    def test_my_trees_cannot_be_used_to_see_another_users_trees(self):
        self.client.force_authenticate(self.kauri_fan)
        response = self.client.get(f"{self.url}mine/", {"owner": "rimu_fan"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])


class TreeOwnersTests(APITestCase):
    url = "/api/trees/owners/"

    def setUp(self):
        self.species = Species.objects.create(
            common_name="Kauri", scientific_name="Agathis australis"
        )
        self.next_longitude = 170.0

    def make_owner(self, username, trees=1):
        owner = User.objects.create_user(username, password="x")
        for _ in range(trees):
            # Distinct longitudes keep each tree clear of the one-per-location constraint
            self.next_longitude += 0.001
            Tree.objects.create(
                owner=owner,
                species=self.species,
                latitude=-45.0,
                longitude=self.next_longitude,
                condition="healthy",
            )
        return owner

    def test_anyone_can_search_and_results_are_sorted(self):
        self.make_owner("rimu_fan")
        self.make_owner("kauri_fan")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, ["kauri_fan", "rimu_fan"])

    def test_search_matches_any_part_of_the_name_ignoring_case(self):
        self.make_owner("kauri_fan")
        self.make_owner("rimu_fan")
        self.make_owner("totara")
        self.assertEqual(
            self.client.get(self.url, {"search": "FAN"}).data, ["kauri_fan", "rimu_fan"]
        )

    def test_each_owner_is_listed_once(self):
        self.make_owner("kauri_fan", trees=3)
        self.assertEqual(self.client.get(self.url).data, ["kauri_fan"])

    def test_users_without_trees_are_left_out(self):
        self.make_owner("kauri_fan")
        User.objects.create_user("no_trees", password="x")
        self.assertEqual(self.client.get(self.url).data, ["kauri_fan"])

    def test_no_match_returns_an_empty_list(self):
        self.make_owner("kauri_fan")
        self.assertEqual(self.client.get(self.url, {"search": "zzz"}).data, [])

    def test_results_are_capped_at_twenty(self):
        for i in range(25):
            self.make_owner(f"user_{i:02}")
        self.assertEqual(len(self.client.get(self.url).data), 20)

    def test_does_not_clash_with_the_tree_detail_route(self):
        self.make_owner("kauri_fan")
        tree = Tree.objects.get()
        self.assertEqual(self.client.get(f"/api/trees/{tree.id}/").data["id"], tree.id)
