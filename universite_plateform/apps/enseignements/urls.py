from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GradeViewSet, 
    ProfesseurViewSet, 
    CoursViewSet, 
    GestionApplicationCoursViewSet, 
    AppliquerCoursViewSet,
    FaculteViewSet,
    PromotionViewSet,
    AnneeAcademiqueViewSet, JuryViewSet
)

# Création du routeur
router = DefaultRouter()

# Enregistrement des ViewSets
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'professeurs', ProfesseurViewSet, basename='professeur')
router.register(r'cours', CoursViewSet, basename='cours')
router.register(r'gestion-applications', GestionApplicationCoursViewSet, basename='gestion-application')
router.register(r'appliquer-cours', AppliquerCoursViewSet, basename='appliquer-cours')
router.register(r'facultes', FaculteViewSet, basename='faculte')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'annees-academiques', AnneeAcademiqueViewSet, basename='annee-academique')
router.register(r'jury', JuryViewSet, basename='jury')

# Les URLs
urlpatterns = [
    # Routes automatiques du router (grades, professeurs, cours, etc.)
    path('', include(router.urls)),
    
    # Routes supplémentaires pour Professeur (login, logout, me, etc.)
    path('professeurs/login/', ProfesseurViewSet.as_view({'post': 'login'}), name='professeur-login'),
    path('professeurs/logout/', ProfesseurViewSet.as_view({'post': 'logout'}), name='professeur-logout'),
    path('professeurs/me/', ProfesseurViewSet.as_view({'get': 'me'}), name='professeur-me'),
    path('professeurs/verify-token/', ProfesseurViewSet.as_view({'post': 'verify_token'}), name='professeur-verify-token'),
    path('professeurs/<int:pk>/change-password/', ProfesseurViewSet.as_view({'post': 'change_password'}), name='professeur-change-password'),
    
    # Routes supplémentaires pour AnneeAcademique
    path('annees-academiques/active/', AnneeAcademiqueViewSet.as_view({'get': 'active'}), name='annee-active'),
    
    # Routes supplémentaires pour GestionApplicationCours
    path('gestion-applications/<int:pk>/reapply/', GestionApplicationCoursViewSet.as_view({'post': 'reapply'}), name='gestion-reapply'),
    path('gestion-applications/<int:pk>/delete-all-applications/', GestionApplicationCoursViewSet.as_view({'delete': 'delete_all_applications'}), name='gestion-delete-all'),
    path('gestion-applications/by-period/', GestionApplicationCoursViewSet.as_view({'get': 'by_period'}), name='gestion-by-period'),
    
    # Routes supplémentaires pour AppliquerCours
    path('appliquer-cours/by-etudiant/', AppliquerCoursViewSet.as_view({'get': 'by_etudiant'}), name='appliquer-by-etudiant'),
    path('appliquer-cours/apply-to-etudiant/', AppliquerCoursViewSet.as_view({'post': 'apply_to_etudiant'}), name='appliquer-apply-to-etudiant'),
    path('appliquer-cours/<int:pk>/toggle-active/', AppliquerCoursViewSet.as_view({'post': 'toggle_active'}), name='appliquer-toggle-active'),
    path('appliquer-cours/by-period/', AppliquerCoursViewSet.as_view({'get': 'by_period'}), name='appliquer-by-period'),
]
