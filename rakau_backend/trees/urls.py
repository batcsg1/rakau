from rest_framework.routers import DefaultRouter
from .views import TreeViewSet, TreeSpeciesViewSet

router = DefaultRouter()
router.register("trees", TreeViewSet)
router.register("species", TreeSpeciesViewSet)

urlpatterns = router.urls