from trees.models import Species

from .species import EXOTIC_TREES, NATIVE_TREES


def seed_species():
    """Add the starter species, or bring existing ones in line. Returns (created, updated).

    Safe to re-run: species are matched on scientific name ignoring case, like the model's unique
    constraint, so nothing is duplicated. Slugs and is_active are left alone on existing species so
    links keep working and species retired in the admin stay retired.
    """
    created = updated = 0
    for names, is_native in ((NATIVE_TREES, True), (EXOTIC_TREES, False)):
        for common_name, scientific_name in names:
            species = Species.objects.filter(scientific_name__iexact=scientific_name).first()
            if species is None:
                Species.objects.create(
                    common_name=common_name,
                    scientific_name=scientific_name,
                    is_native=is_native,
                )
                created += 1
                continue
            new_values = {
                "common_name": common_name,
                "scientific_name": scientific_name,
                "is_native": is_native,
            }
            if any(getattr(species, field) != value for field, value in new_values.items()):
                for field, value in new_values.items():
                    setattr(species, field, value)
                species.save(update_fields=list(new_values))
                updated += 1
    return created, updated
