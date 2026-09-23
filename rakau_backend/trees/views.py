from django.shortcuts import render
from django.db.models import Count, F, Q
from rest_framework import viewsets
from .models import Tree, Species
from .serializers import SpeciesSerializer, TreeSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from .models import Tree, Species

# Create your views here.


class TreeViewSet(viewsets.ModelViewSet):

    queryset = Tree.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Tree.objects.all()
        params = self.request.query_params

        if species := params.get("species_slug"):
            queryset = queryset.filter(species__slug=species)
        if condition := params.get("condition"):
            queryset = queryset.filter(condition=condition)
        if (present := params.get("is_present")) is not None:
            queryset = queryset.filter(is_present=present.lower() == "true")
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TreeSerializer
        return TreeSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class SpeciesViewSet(viewsets.ModelViewSet):

    queryset = Species.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthenticated]

    def get_queryset(self):
        queryset = Species.objects.annotate(tree_count=Count("trees"))
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SpeciesSerializer
        return SpeciesSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()