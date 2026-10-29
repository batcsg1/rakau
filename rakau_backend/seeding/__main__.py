# Seeds the species catalogue. Run from rakau_backend/ after migrating:  python -m seeding
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rakau_backend.settings")
django.setup()

from .seed import seed_species  # noqa: E402 (needs Django set up first)

created, updated = seed_species()
print(f"Species seeded: {created} added, {updated} updated")
