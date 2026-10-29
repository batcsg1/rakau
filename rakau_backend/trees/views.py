from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .filters import ORDERINGS, TreeFilter
from .models import Species, Tree
from .pagination import MyTreesPagination
from .permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly
from .serializers import SpeciesDetailSerializer, SpeciesSerializer, TreeSerializer


class TreeViewSet(viewsets.ModelViewSet):
    queryset = Tree.objects.all()
    serializer_class = TreeSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TreeFilter

    def get_queryset(self):
        # Newest first unless ?ordering= asks otherwise (TreeFilter.filter_ordering)
        return Tree.objects.select_related("owner", "species").order_by(*ORDERINGS["newest"])

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # GET /api/trees/mine/?page=n — the caller's own trees, newest first, 20 per page.
    # Owner scoping happens in the queryset, so another user's trees can never be returned;
    # the TreeFilter query params (condition, region, ordering, ...) still apply
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mine(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(owner=request.user)
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
