from django.db.models import Count, F, Q
from rest_framework import serializers
from .models import Tree, Species

class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ["id", "common_name", "scientific_name", "is_native", "is_active", "slug"]
        read_only_fields = ["slug"]


class SpeciesDetailSerializer(serializers.ModelSerializer):
    tree_count = serializers.IntegerField(read_only=True)

    class Meta(SpeciesSerializer.Meta):
        fields = SpeciesSerializer.Meta.fields + ["tree_count"]

    def get_tree_count(self, obj):
        return getattr(obj, "tree_count", None)

class TreeSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    species_name = serializers.ReadOnlyField(source="species.common_name")
    species_scientific_name = serializers.ReadOnlyField(source="species.scientific_name")
    species_slug = serializers.SlugRelatedField(
        source="species",
        slug_field="slug",
        queryset=Species.objects.filter(is_active=True),
    )
    
    class Meta:
        model = Tree
        fields = [
            "id", "owner",
            "species_name", "species_scientific_name", "species_slug",
            "latitude", "longitude", "region", "condition", "is_present",
            "height_m", "trunk_girth_cm", "crown_spread_m",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def validate(self, attrs):
        # DRF skips the model's unique_tree_per_owner_location check because owner is
        # read-only, so check it here to return a 400 instead of a database error
        request = self.context.get("request")
        owner = self.instance.owner if self.instance else getattr(request, "user", None)
        if owner is None or not owner.is_authenticated:
            return attrs

        def current(field):
            return attrs.get(field, getattr(self.instance, field, None))

        duplicates = Tree.objects.filter(
            owner=owner,
            species=current("species"),
            latitude=current("latitude"),
            longitude=current("longitude"),
        )
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError(
                "You've already recorded this species at this location."
            )
        return attrs

class TreeDetailSerializer(serializers.ModelSerializer):

    species_name = serializers.ReadOnlyField(source="species.common_name")
    species_scientific_name = serializers.ReadOnlyField(source="species.scientific_name")

    class Meta:
        model = Tree
        fields = [
            "id", "owner",
            "species_name", "species_scientific_name",
            "latitude", "longitude", "region", "condition", "is_present",
            "height_m", "trunk_girth_cm", "crown_spread_m",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at", "owner"]

