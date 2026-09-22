from django.contrib.auth.models import User
from django.db import models
from django.utils.text import slugify
from django.db.models.functions import Lower
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.
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
            #Case-insensitive Allows lower case and normal case to count as the same species.
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

# A model for different tree conditions

class Condition(models.TextChoices):
    HEALTHY = "healthy", "Healthy"
    STRESSED = "stressed", "Stressed"
    DISEASED = "diseased", "Diseased"
    DEAD = "dead", "Dead"

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
    latitude = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    condition = models.CharField(
        max_length=16,
        choices=Condition.choices,
    )
    height_m = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(150)],
    )
    trunk_girth_cm = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(3000)],
    )
    crown_spread_m = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(200)],
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