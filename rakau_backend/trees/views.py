from django.shortcuts import render
from django.db.models import Count, F, Q
from rest_framework import viewsets
from .models import Tree, Species
from .serializers import TreeSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from .models import Tree, Species

# Create your views here.


class TreeViewSet(viewsets.ModelViewSet):

    queryset = Tree.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthenticated]

    def get_queryset(self):
        queryset = Tree.objects.all()
        species = self.request.query_params.get("species")
        if species:
            queryset = queryset.filter(species=species)
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
        queryset = Species.objects.select_related("tree").annotate(
            tree_count=Count("tree", filter=Q(tree__status="confirmed"))
        ) 
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