from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models.functions import Lower
from django.utils.text import slugify

# Coordinate bounds; the client's Add Tree form checks the same ranges
MIN_LATITUDE, MAX_LATITUDE = -90, 90
MIN_LONGITUDE, MAX_LONGITUDE = -180, 180

# Upper limits that catch typos (e.g. girth entered in mm) rather than real-world records
MAX_HEIGHT_M = 150
MAX_TRUNK_GIRTH_CM = 3000
MAX_CROWN_SPREAD_M = 200

# NZ post codes are always four digits, e.g. "9016" or "0627"
NZ_POSTCODE_VALIDATOR = RegexValidator(r"^\d{4}$", "Enter a 4-digit NZ post code.")


class Species(models.Model):
    common_name = models.CharField(max_length=100)
    scientific_name = models.CharField(max_length=100)
    is_native = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        ordering = ["common_name"]
        verbose_name_plural = "species"
        constraints = [
            # Case-insensitive: allows lower case and normal case to count as the same species.
            models.UniqueConstraint(
                Lower("scientific_name"),
                name="unique_species_scientific_name_ci",
            ),
        ]

    def __str__(self):
        return self.common_name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.common_name)
            slug = base_slug
            suffix = 2
            while Species.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{suffix}"
                suffix += 1
            self.slug = slug
        super().save(*args, **kwargs)


# The health states a tree can be recorded in
class Condition(models.TextChoices):
    HEALTHY = "healthy", "Healthy"
    STRESSED = "stressed", "Stressed"
    DISEASED = "diseased", "Diseased"
    DEAD = "dead", "Dead"


# The 16 regions of New Zealand
class Region(models.TextChoices):
    NORTHLAND = "northland", "Northland"
    AUCKLAND = "auckland", "Auckland"
    WAIKATO = "waikato", "Waikato"
    BAY_OF_PLENTY = "bay-of-plenty", "Bay of Plenty"
    GISBORNE = "gisborne", "Gisborne"
    HAWKES_BAY = "hawkes-bay", "Hawke's Bay"
    TARANAKI = "taranaki", "Taranaki"
    MANAWATU_WHANGANUI = "manawatu-whanganui", "Manawatū-Whanganui"
    WELLINGTON = "wellington", "Wellington"
    TASMAN = "tasman", "Tasman"
    NELSON = "nelson", "Nelson"
    MARLBOROUGH = "marlborough", "Marlborough"
    WEST_COAST = "west-coast", "West Coast"
    CANTERBURY = "canterbury", "Canterbury"
    OTAGO = "otago", "Otago"
    SOUTHLAND = "southland", "Southland"


# A tree's official or recognised standing. "none" also covers users who are unsure
class Significance(models.TextChoices):
    NONE = "none", "None"
    LOCALLY_NOTABLE = "locally_notable", "Locally notable"
    HERITAGE = "heritage", "Heritage"
    PROTECTED = "protected", "Protected"


class Tree(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="trees",
        null=True,
        blank=True,
    )
    species = models.ForeignKey(
        Species,
        on_delete=models.PROTECT,
        related_name="trees",
    )
    is_present = models.BooleanField(default=True)
    latitude = models.FloatField(
        validators=[MinValueValidator(MIN_LATITUDE), MaxValueValidator(MAX_LATITUDE)],
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(MIN_LONGITUDE), MaxValueValidator(MAX_LONGITUDE)],
    )
    condition = models.CharField(
        max_length=16,
        choices=Condition.choices,
    )
    region = models.CharField(
        max_length=32,
        choices=Region.choices,
        blank=True,
        db_index=True,
    )
    # Optional street address, usually filled in from a Photon lookup on the client
    street_address = models.CharField(max_length=200, blank=True)
    suburb = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=4, blank=True, validators=[NZ_POSTCODE_VALIDATOR])
    significance_status = models.CharField(
        max_length=16,
        choices=Significance.choices,
        default=Significance.NONE,
        db_index=True,
    )
    height_m = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        db_index=True,
        validators=[MinValueValidator(0), MaxValueValidator(MAX_HEIGHT_M)],
    )
    trunk_girth_cm = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        db_index=True,
        validators=[MinValueValidator(0), MaxValueValidator(MAX_TRUNK_GIRTH_CM)],
    )
    crown_spread_m = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(MAX_CROWN_SPREAD_M)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "species", "latitude", "longitude"],
                name="unique_tree_per_owner_location",
            ),
        ]

    def __str__(self):
        return f"{self.species} ({self.latitude}, {self.longitude})"
