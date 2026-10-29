from rest_framework import serializers

from .models import Species, Tree, TreePhoto

# Upload rules for tree photos (#44)
PHOTO_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024
MAX_PHOTOS_PER_TREE = 5


class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ["id", "common_name", "scientific_name", "is_native", "is_active", "slug"]
        read_only_fields = ["slug"]


class SpeciesDetailSerializer(serializers.ModelSerializer):
    tree_count = serializers.IntegerField(read_only=True)

    class Meta(SpeciesSerializer.Meta):
        fields = [*SpeciesSerializer.Meta.fields, "tree_count"]


class TreePhotoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = TreePhoto
        fields = ["id", "url", "caption", "created_at", "image"]
        read_only_fields = ["id", "created_at"]
        # Uploaded as "image"; read back as an absolute "url" the client can load directly
        extra_kwargs = {"image": {"write_only": True}}

    def get_url(self, photo):
        request = self.context.get("request")
        return request.build_absolute_uri(photo.image.url) if request else photo.image.url

    def validate_image(self, image):
        if image.size > MAX_PHOTO_BYTES:
            raise serializers.ValidationError("Photos must be 5 MB or smaller.")
        # DRF's ImageField has already opened the file with Pillow, so this is the real format
        # rather than whatever the file name claims
        if image.image.format not in PHOTO_FORMATS:
            raise serializers.ValidationError("Upload a JPEG, PNG or WebP image.")
        return image

    def validate(self, attrs):
        tree = self.context["tree"]
        if tree.photos.count() >= MAX_PHOTOS_PER_TREE:
            raise serializers.ValidationError(
                {"image": [f"A tree can have at most {MAX_PHOTOS_PER_TREE} photos."]}
            )
        return attrs


class TreeSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")
    # So the detail screen gets the gallery in the same request
    photos = TreePhotoSerializer(many=True, read_only=True)

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
            "id",
            "owner",
            "species_name",
            "species_scientific_name",
            "species_slug",
            "latitude",
            "longitude",
            "region",
            "street_address",
            "suburb",
            "city",
            "postcode",
            "condition",
            "is_present",
            "significance_status",
            "height_m",
            "trunk_girth_cm",
            "crown_spread_m",
            "photos",
            "created_at",
            "updated_at",
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
