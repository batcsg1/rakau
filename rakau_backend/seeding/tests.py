from django.test import TestCase

from trees.models import Species

from .seed import seed_species
from .species import EXOTIC_TREES, NATIVE_TREES


class SeedSpeciesTests(TestCase):
    def test_adds_every_species_with_native_flag(self):
        created, updated = seed_species()
        self.assertEqual((created, updated), (len(NATIVE_TREES) + len(EXOTIC_TREES), 0))
        self.assertTrue(Species.objects.get(scientific_name="Sophora microphylla").is_native)
        self.assertFalse(Species.objects.get(scientific_name="Pinus radiata").is_native)

    def test_rerun_changes_nothing(self):
        seed_species()
        self.assertEqual(seed_species(), (0, 0))
        self.assertEqual(Species.objects.count(), len(NATIVE_TREES) + len(EXOTIC_TREES))

    def test_existing_species_is_updated_not_duplicated(self):
        existing = Species.objects.create(
            common_name="Monkey Puzzle Tree",
            scientific_name="Araucaria Araucana",
            is_native=False,
            is_active=False,
        )
        self.assertEqual(seed_species()[1], 1)
        existing.refresh_from_db()
        self.assertEqual(existing.scientific_name, "Araucaria araucana")
        self.assertEqual(existing.common_name, "Monkey puzzle tree")
        # Slug and retirement are kept
        self.assertEqual(existing.slug, "monkey-puzzle-tree")
        self.assertFalse(existing.is_active)

    def test_no_duplicate_names_in_catalogue(self):
        scientific = [s.lower() for _, s in NATIVE_TREES + EXOTIC_TREES]
        common = [c.lower() for c, _ in NATIVE_TREES + EXOTIC_TREES]
        self.assertEqual(len(scientific), len(set(scientific)))
        self.assertEqual(len(common), len(set(common)))

    def test_slugs_are_ascii(self):
        seed_species()
        self.assertEqual(Species.objects.get(scientific_name="Sophora microphylla").slug, "kowhai")
