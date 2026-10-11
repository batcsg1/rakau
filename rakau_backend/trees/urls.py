from rest_framework.routers import DefaultRouter
from .views import TreeViewSet, SpeciesViewSet

router = DefaultRouter()
router.register("trees", TreeViewSet)
router.register("species", SpeciesViewSet)

urlpatterns = router.urls