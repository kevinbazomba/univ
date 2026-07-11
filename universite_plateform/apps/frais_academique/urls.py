from django.urls import path

from .views import (
    TypeFraisListCreateView,
    TarifFraisListCreateView,
    FraisAcademiqueListCreateView,
    FraisAcademiqueDetailView,
    PaiementListCreateView,
    ApplyTarifView,
)

urlpatterns = [
    path('types/', TypeFraisListCreateView.as_view(), name='type-frais-list-create'),
    path('tarifs/', TarifFraisListCreateView.as_view(), name='tarif-frais-list-create'),
    path('tarifs/<int:pk>/apply/', ApplyTarifView.as_view(), name='tarif-apply'),
    path('frais/', FraisAcademiqueListCreateView.as_view(), name='frais-academique-list-create'),
    path('frais/<int:pk>/', FraisAcademiqueDetailView.as_view(), name='frais-academique-detail'),
    path('paiements/', PaiementListCreateView.as_view(), name='paiement-list-create'),
]
