from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JetonJuryViewSet


router = DefaultRouter()
router.register(r'jetons-jury', JetonJuryViewSet, basename='jeton-jury')

urlpatterns = [
    path('', include(router.urls)),
]

