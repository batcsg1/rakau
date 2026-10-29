from django import forms
from django_filters import rest_framework as filters

from .models import Condition, Region, Significance, Tree

# (min, max) query-param pairs whose bounds must not be reversed
RANGE_PAIRS = [("height_min", "height_max"), ("girth_min", "girth_max")]

# ?ordering= values. id breaks ties between trees saved in the same instant, so pages stay stable
ORDERINGS = {"newest": ["-created_at", "-id"], "oldest": ["created_at", "id"]}
ORDERING_CHOICES = [("newest", "Newest first"), ("oldest", "Oldest first")]


# Rejects a reversed range (e.g. height_min=10&height_max=5) with the same
# {"field": ["message"]} shape as every other filter error
class TreeFilterForm(forms.Form):
    def clean(self):
        cleaned_data = super().clean()
        for min_name, max_name in RANGE_PAIRS:
            low, high = cleaned_data.get(min_name), cleaned_data.get(max_name)
            if low is not None and high is not None and low > high:
                self.add_error(min_name, f"Must not be greater than {max_name}.")
        return cleaned_data


# Query-param filters for /api/trees/ and /api/trees/mine/. A value outside a field's
# choices fails validation, so the view returns 400 ({"region": ["..."]}) instead of an
# empty list. Adding a filter is one line here
class TreeFilter(filters.FilterSet):
    species_slug = filters.CharFilter(field_name="species__slug")
    condition = filters.ChoiceFilter(choices=Condition.choices)
    region = filters.ChoiceFilter(choices=Region.choices)
    is_present = filters.BooleanFilter()
    significance_status = filters.ChoiceFilter(choices=Significance.choices)
    # ?significant_only=true hides "none" trees; false (or leaving it out) applies no filter
    significant_only = filters.BooleanFilter(method="filter_significant_only")

    # Inclusive ranges; either bound can be given on its own
    height_min = filters.NumberFilter(field_name="height_m", lookup_expr="gte", min_value=0)
    height_max = filters.NumberFilter(field_name="height_m", lookup_expr="lte", min_value=0)
    girth_min = filters.NumberFilter(field_name="trunk_girth_cm", lookup_expr="gte", min_value=0)
    girth_max = filters.NumberFilter(field_name="trunk_girth_cm", lookup_expr="lte", min_value=0)

    # ?ordering=oldest lists the first-recorded trees first; leaving it out keeps newest first
    ordering = filters.ChoiceFilter(choices=ORDERING_CHOICES, method="filter_ordering")

    class Meta:
        model = Tree
        form = TreeFilterForm
        fields = [
            "species_slug",
            "condition",
            "region",
            "is_present",
            "significance_status",
            "significant_only",
            "height_min",
            "height_max",
            "girth_min",
            "girth_max",
            "ordering",
        ]

    def filter_significant_only(self, queryset, name, value):
        if value:
            return queryset.exclude(significance_status=Significance.NONE)
        return queryset

    def filter_ordering(self, queryset, name, value):
        return queryset.order_by(*ORDERINGS[value])
