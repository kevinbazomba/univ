from django.contrib import admin
from django.urls import path, include
from django.conf import settings

from django.conf.urls.static import static
from django.db.utils import OperationalError, ProgrammingError
from apps.accounts import views
from apps.accounts.models import IdentiteUniversite


# Identité institutionnelle utilisée par l'interface d'administration.
nom_universite = 'Gestion universitaire'
sigle_universite = ''
try:
    identite_universite = IdentiteUniversite.objects.only('nom', 'sigle').first()
    if identite_universite:
        nom_universite = identite_universite.nom
        sigle_universite = identite_universite.sigle
except (OperationalError, ProgrammingError):
    # La table peut ne pas encore exister pendant les premières migrations.
    pass

admin.site.site_header = f'Administration — {nom_universite}'
admin.site.site_title = sigle_universite or nom_universite
admin.site.index_title = f'Tableau de bord — {nom_universite}'

urlpatterns = [
    path('admin/', admin.site.urls),
   
    path('', views.react_app),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.etudiants.urls')),  # ← Important pour /api/etudiants  /
    path('api/frais/', include('apps.frais_academique.urls')),
    path('api/', include('apps.enseignements.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

#if settings.DEBUG:
    #urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)






    