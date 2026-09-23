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
            "latitude", "longitude", "condition", "is_present",
            "height_m", "trunk_girth_cm", "crown_spread_m",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

class TreeDetailSerializer(serializers.ModelSerializer):

    species_name = serializers.ReadOnlyField(source="species.common_name")
    species_scientific_name = serializers.ReadOnlyField(source="species.scientific_name")

    class Meta:
        model = Tree
        fields = [
            "id", "owner",
            "species_name", "species_scientific_name",
            "latitude", "longitude", "condition", "is_present",
            "height_m", "trunk_girth_cm", "crown_spread_m",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at", "owner"]

