from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('annees', views.AnneeAcademiqueViewSet)
router.register('facultes', views.FaculteViewSet)
router.register('departements', views.DepartementViewSet, basename='departement')
router.register('promotions', views.PromotionViewSet)
router.register('etudiants', views.EtudiantViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
