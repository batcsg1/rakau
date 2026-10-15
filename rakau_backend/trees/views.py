from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import Species, Tree
from .pagination import MyTreesPagination
from .permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly
from .serializers import SpeciesDetailSerializer, SpeciesSerializer, TreeSerializer


class TreeViewSet(viewsets.ModelViewSet):
    queryset = Tree.objects.all()
    serializer_class = TreeSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = Tree.objects.select_related("owner", "species")
        params = self.request.query_params

        if species := params.get("species_slug"):
            queryset = queryset.filter(species__slug=species)
        if condition := params.get("condition"):
            queryset = queryset.filter(condition=condition)
        if region := params.get("region"):
            queryset = queryset.filter(region=region)
        if (present := params.get("is_present")) is not None:
            queryset = queryset.filter(is_present=present.lower() == "true")
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # GET /api/trees/mine/?page=n — the caller's own trees, newest first, 20 per page.
    # Owner scoping happens in the queryset, so another user's trees can never be returned;
    # the list filters (condition, region, ...) from get_queryset still apply
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mine(self, request):
        queryset = self.get_queryset().filter(owner=request.user).order_by("-created_at")
        paginator = MyTreesPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class SpeciesViewSet(viewsets.ModelViewSet):
    queryset = Species.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return Species.objects.annotate(tree_count=Count("trees"))

    # The list stays lean for pickers; a single species also reports how many trees use it
    def get_serializer_class(self):
        if self.action == "retrieve":
            return SpeciesDetailSerializer
        return SpeciesSerializer
