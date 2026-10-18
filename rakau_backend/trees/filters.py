from django_filters import rest_framework as filters

from .models import Condition, Region, Tree


# Query-param filters for /api/trees/ and /api/trees/mine/. A value outside a field's
# choices fails validation, so the view returns 400 ({"region": ["..."]}) instead of an
# empty list. Adding a filter is one line here
class TreeFilter(filters.FilterSet):
    species_slug = filters.CharFilter(field_name="species__slug")
    condition = filters.ChoiceFilter(choices=Condition.choices)
    region = filters.ChoiceFilter(choices=Region.choices)
    is_present = filters.BooleanFilter()

    class Meta:
        model = Tree
        fields = ["species_slug", "condition", "region", "is_present"]
