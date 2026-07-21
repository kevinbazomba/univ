from django.contrib import admin

from .models import JetonJury


@admin.register(JetonJury)
class JetonJuryAdmin(admin.ModelAdmin):
    list_display = (
        'libelle', 'code', 'annee_academique', 'faculte',
        'departement', 'promotion', 'est_actif', 'date_creation',
    )
    list_filter = ('est_actif', 'annee_academique', 'faculte', 'departement', 'promotion')
    search_fields = ('code', 'libelle', 'faculte__nom', 'departement__nom', 'promotion__nom')
    readonly_fields = ('code', 'date_creation', 'date_desactivation')

    fieldsets = (
        ('Jeton', {'fields': ('code', 'libelle', 'est_actif')}),
        ('Périmètre autorisé', {'fields': ('annee_academique', 'faculte', 'departement', 'promotion')}),
        ('Dates', {'fields': ('date_creation', 'date_desactivation')}),
    )

