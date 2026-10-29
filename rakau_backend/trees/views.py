from django.db.models import Count
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import ORDERINGS, TreeFilter
from .models import Species, Tree
from .pagination import MyTreesPagination
from .permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly
from .serializers import (
    SpeciesDetailSerializer,
    SpeciesSerializer,
    TreePhotoSerializer,
    TreeSerializer,
)


class TreeViewSet(viewsets.ModelViewSet):
    queryset = Tree.objects.all()
    serializer_class = TreeSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TreeFilter

    def get_queryset(self):
        # Newest first unless ?ordering= asks otherwise (TreeFilter.filter_ordering)
        return (
            Tree.objects.select_related("owner", "species")
            .prefetch_related("photos")
            .order_by(*ORDERINGS["newest"])
        )

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

    # GET /api/trees/{id}/photos/ — anyone; POST (multipart "image", optional "caption") — the
    # owner or staff. get_object() runs IsOwnerOrReadOnly, so photos follow the tree's own rule
    @action(detail=True, methods=["get", "post"], parser_classes=[MultiPartParser, FormParser])
    def photos(self, request, pk=None):
        tree = self.get_object()
        context = {**self.get_serializer_context(), "tree": tree}
        if request.method == "GET":
            return Response(TreePhotoSerializer(tree.photos.all(), many=True, context=context).data)
        serializer = TreePhotoSerializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        serializer.save(tree=tree)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # DELETE /api/trees/{id}/photos/{photo_id}/ — the owner or staff; the file is removed too
    @action(detail=True, methods=["delete"], url_path=r"photos/(?P<photo_id>\d+)")
    def delete_photo(self, request, pk=None, photo_id=None):
        photo = get_object_or_404(self.get_object().photos, pk=photo_id)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
