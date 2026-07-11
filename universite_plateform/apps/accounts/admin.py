from django.contrib import admin
from .models import IdentiteUniversite


@admin.register(IdentiteUniversite)
class IdentiteUniversiteAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Identification', {'fields': ('nom', 'sigle', 'devise', 'logo', 'logo_url')}),
        ('Coordonnées', {
            'fields': (
                'adresse', 'ville', 'pays', 'boite_postale',
                'telephone', 'email', 'site_web',
            )
        }),
        ('Responsable', {'fields': ('responsable',)}),
    )

    def has_add_permission(self, request):
        return not IdentiteUniversite.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
