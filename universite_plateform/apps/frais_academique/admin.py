from django.contrib import admin

from .models import TypeFrais, TarifFrais, FraisAcademique, Paiement


@admin.register(TypeFrais)
class TypeFraisAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code')
    search_fields = ('nom', 'code')


@admin.register(TarifFrais)
class TarifFraisAdmin(admin.ModelAdmin):
    list_display = ('type_frais', 'faculte', 'promotion', 'option_specialisation', 'semestre', 'montant', 'annee_academique')
    list_filter = ('type_frais', 'semestre', 'annee_academique', 'faculte', 'promotion')
    search_fields = ('option_specialisation',)


@admin.register(FraisAcademique)
class FraisAcademiqueAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'type_frais', 'semestre', 'annee_academique', 'montant_total', 'statut_paiement')
    list_filter = ('type_frais', 'semestre', 'annee_academique', 'faculte', 'promotion')
    search_fields = ('etudiant__nom', 'etudiant__prenom', 'etudiant__matricule')


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('reference', 'etudiant', 'frais', 'montant_paye', 'mode_paiement', 'statut', 'date_paiement')
    list_filter = ('mode_paiement', 'statut', 'date_paiement')
    search_fields = ('reference', 'etudiant__nom', 'etudiant__prenom')
