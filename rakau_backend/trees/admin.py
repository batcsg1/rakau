from django.contrib import admin
from django.db.models import Count

from .models import Species, Tree

# Register your models here.


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    list_display = ["common_name", "scientific_name", "is_native", "is_active", "tree_count"]
    list_filter = ["is_native", "is_active"]
    search_fields = ["common_name", "scientific_name"]
    prepopulated_fields = {"slug": ["common_name"]}

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(tree_count=Count("trees"))

    @admin.display(description="Trees", ordering="tree_count")
    def tree_count(self, obj):
        return obj.tree_count


@admin.register(Tree)
class TreeAdmin(admin.ModelAdmin):
    list_display = ["id", "species", "owner", "region", "condition", "is_present", "created_at"]
    list_filter = ["condition", "region", "is_present", "species"]
    search_fields = ["species__common_name", "species__scientific_name", "owner__username"]
    list_select_related = ["species", "owner"]
    autocomplete_fields = ["species", "owner"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"
    fieldsets = [
        (None, {"fields": ["species", "owner", "condition", "is_present"]}),
        ("Location", {"fields": ["latitude", "longitude", "region"]}),
        ("Measurements", {"fields": ["height_m", "trunk_girth_cm", "crown_spread_m"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"]}),
    ]
