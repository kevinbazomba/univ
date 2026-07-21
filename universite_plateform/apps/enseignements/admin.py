from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Q
from .models import (
    Grade, Professeur, Cours, GestionApplicationCours, AppliquerCours,
    SessionEvaluation, CotationSession, DecisionJury, PromotionEnAttente,
    FusionCoursJury,
)


@admin.register(SessionEvaluation)
class SessionEvaluationAdmin(admin.ModelAdmin):
    list_display = ('nom', 'annee_academique', 'type_session', 'session_origine', 'date_debut', 'date_fin', 'est_active', 'nombre_cotations')
    list_filter = ('est_active', 'est_rattrapage', 'est_cloture', 'annee_academique', 'date_debut')
    search_fields = ('nom', 'description', 'annee_academique__nom')
    ordering = ('-date_debut',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        # Sans choix explicite dans le filtre Année académique, l'admin
        # présente uniquement les sessions de l'année active.
        annee_est_filtree = any(
            parametre.startswith('annee_academique')
            for parametre in request.GET
        )
        if not annee_est_filtree:
            queryset = queryset.filter(annee_academique__est_active=True)
        return queryset

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        annee_model = SessionEvaluation._meta.get_field('annee_academique').remote_field.model
        annee_active = annee_model.get_annee_active()
        if annee_active:
            initial.setdefault('annee_academique', annee_active.pk)
        return initial

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'session_origine':
            # Un nouveau rattrapage ne peut cibler qu'une session appartenant
            # à l'année active. En modification, on conserve aussi la valeur
            # historique déjà enregistrée afin que le dossier reste consultable.
            conditions = Q(annee_academique__est_active=True)
            object_id = request.resolver_match.kwargs.get('object_id') if request.resolver_match else None
            if object_id:
                session_origine_id = SessionEvaluation.objects.filter(pk=object_id).values_list(
                    'session_origine_id', flat=True,
                ).first()
                if session_origine_id:
                    conditions |= Q(pk=session_origine_id)
            kwargs['queryset'] = SessionEvaluation.objects.filter(conditions)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'sessions_incluses':
            # Une nouvelle clôture consolide seulement les sessions de l'année
            # active. Les sessions déjà liées restent disponibles en édition.
            conditions = Q(annee_academique__est_active=True)
            object_id = request.resolver_match.kwargs.get('object_id') if request.resolver_match else None
            if object_id:
                sessions_existantes = SessionEvaluation.objects.filter(
                    clotures_associees__pk=object_id,
                ).values_list('pk', flat=True)
                conditions |= Q(pk__in=sessions_existantes)
            kwargs['queryset'] = SessionEvaluation.objects.filter(conditions).distinct()
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    fieldsets = (
        ('Identification', {'fields': ('nom', 'annee_academique', 'description')}),
        ('Période', {'fields': ('date_debut', 'date_fin', 'est_active')}),
        ('Rattrapage', {
            'fields': ('est_rattrapage', 'session_origine'),
            'description': "Pour un rattrapage, sélectionnez la session d'origine à remplacer.",
        }),
        ('Clôture du jury', {'fields': ('est_cloture', 'sessions_incluses')}),
    )

    @admin.display(description='Type')
    def type_session(self, obj):
        return 'Clôture' if obj.est_cloture else ('Rattrapage' if obj.est_rattrapage else 'Ordinaire')

    @admin.display(description='Cotations')
    def nombre_cotations(self, obj):
        return obj.cotations.count()


@admin.register(CotationSession)
class CotationSessionAdmin(admin.ModelAdmin):
    list_display = ('application', 'session', 'points_tp', 'points_interro', 'points_examen', 'total', 'date_evaluation')
    list_filter = ('session', 'application__cours')
    search_fields = ('application__etudiant__matricule', 'application__etudiant__nom', 'application__cours__nom_cours')
    readonly_fields = ('total', 'date_evaluation')
    autocomplete_fields = ('application', 'session')

@admin.register(DecisionJury)
class DecisionJuryAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'session', 'decision', 'resultats_publies', 'mode_approbation', 'date_approbation')
    list_filter = ('resultats_publies', 'decision', 'mode_approbation', 'session')
    search_fields = ('etudiant__matricule', 'etudiant__nom', 'session__nom')
    readonly_fields = ('approuve_par', 'date_approbation')


@admin.register(PromotionEnAttente)
class PromotionEnAttenteAdmin(admin.ModelAdmin):
    list_display = ('inscription_origine', 'promotion_cible', 'annee_cible', 'statut', 'date_creation', 'date_traitement')
    list_filter = ('statut', 'annee_cible', 'promotion_cible')
    search_fields = ('inscription_origine__etudiant__matricule', 'inscription_origine__etudiant__nom')
    readonly_fields = ('decision', 'inscription_origine', 'inscription_creee', 'date_creation', 'date_traitement')


@admin.register(FusionCoursJury)
class FusionCoursJuryAdmin(admin.ModelAdmin):
    list_display = ('nom_cours_fusionne', 'faculte', 'departement', 'promotion', 'annee_academique', 'est_active', 'date_creation')
    list_filter = ('est_active', 'faculte', 'departement', 'promotion', 'annee_academique')
    search_fields = ('nom_cours_fusionne', 'cours__nom_cours', 'cours__code_cours')
    filter_horizontal = ('cours',)
    readonly_fields = ('cree_par', 'date_creation')

    def save_model(self, request, obj, form, change):
        if not obj.cree_par_id:
            obj.cree_par = request.user
        super().save_model(request, obj, form, change)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'ordre', 'est_actif', 'nb_professeurs', 'date_creation']
    list_filter = ['est_actif', 'date_creation']
    search_fields = ['code', 'libelle']
    readonly_fields = ['code', 'date_creation']
    ordering = ['ordre', 'code']
    fieldsets = (
        ('Informations', {
            'fields': ('code', 'libelle', 'ordre', 'est_actif')
        }),
        ('Métadonnées', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )
    
    def nb_professeurs(self, obj):
        return obj.professeurs.filter(est_actif=True).count()
    nb_professeurs.short_description = "Nombre de professeurs"


@admin.register(Professeur)
class ProfesseurAdmin(admin.ModelAdmin):
    list_display = ['matricule', 'nom', 'prenom', 'email', 'grade', 'faculte', 'est_actif', 'date_embauche']
    list_filter = ['est_actif', 'grade', 'faculte', 'date_embauche', 'date_creation']
    search_fields = ['matricule', 'nom', 'prenom', 'email', 'telephone']
    readonly_fields = ['matricule', 'tentative_connexion', 'date_derniere_connexion', 'date_creation', 'date_modification']
    ordering = ['nom', 'prenom']
    
    fieldsets = (
        ('Identité', {
            'fields': ('matricule', 'nom', 'prenom', 'email', 'telephone')
        }),
        ('Informations professionnelles', {
            'fields': ('grade', 'faculte', 'specialite', 'date_embauche')
        }),
        ('Sécurité et accès', {
            'fields': ('mot_de_passe', 'est_actif', 'tentative_connexion', 'bloque_jusqua', 'date_derniere_connexion')
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activer_professeurs', 'desactiver_professeurs', 'reinitialiser_mot_de_passe']
    
    def activer_professeurs(self, request, queryset):
        queryset.update(est_actif=True)
        self.message_user(request, f"{queryset.count()} professeur(s) activé(s) avec succès.")
    activer_professeurs.short_description = "Activer les professeurs sélectionnés"
    
    def desactiver_professeurs(self, request, queryset):
        queryset.update(est_actif=False)
        self.message_user(request, f"{queryset.count()} professeur(s) désactivé(s) avec succès.")
    desactiver_professeurs.short_description = "Désactiver les professeurs sélectionnés"
    
    def reinitialiser_mot_de_passe(self, request, queryset):
        for professeur in queryset:
            professeur.mot_de_passe = "default_password_123"
            professeur.tentative_connexion = 0
            professeur.bloque_jusqua = None
            professeur.save()
        self.message_user(request, f"Mot de passe réinitialisé pour {queryset.count()} professeur(s).")
    reinitialiser_mot_de_passe.short_description = "Réinitialiser les mots de passe"


# Suppression du bloc SessionAdmin mal placé
# Si vous avez un modèle Session, décommentez et corrigez le code ci-dessous
# @admin.register(Session)
# class SessionAdmin(admin.ModelAdmin):
#     list_display = ['professeur', 'token', 'est_active', 'date_connexion', 'date_expiration']
#     list_filter = ['est_active', 'date_connexion', 'date_expiration']
#     search_fields = ['professeur__nom', 'professeur__prenom', 'token', 'ip_address']
#     readonly_fields = ['token', 'date_connexion']
#     ordering = ['-date_connexion']
#     
#     fieldsets = (
#         ('Session', {
#             'fields': ('professeur', 'token', 'est_active')
#         }),
#         ('Informations de connexion', {
#             'fields': ('ip_address', 'user_agent')
#         }),
#         ('Dates', {
#             'fields': ('date_connexion', 'date_expiration')
#         }),
#     )


@admin.register(Cours)
class CoursAdmin(admin.ModelAdmin):
    list_display = ['code_cours', 'nom_cours', 'ponderation', 'points', 'credit', 'volume_horaire', 'responsable', 'nb_etudiants']
    list_filter = ['date_creation', 'responsable']
    search_fields = ['code_cours', 'nom_cours', 'description']
    readonly_fields = ['code_cours', 'date_creation']
    ordering = ['nom_cours']
    
    fieldsets = (
        ('Informations du cours', {
            'fields': ('code_cours', 'nom_cours', 'description')
        }),
        ('Pondération', {
            'fields': ('ponderation', 'points', 'credit', 'volume_horaire')
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )
    
    def nb_etudiants(self, obj):
        return obj.etudiants_assignes.filter(est_actif=True).count()
    nb_etudiants.short_description = "Nombre d'étudiants"


class AppliquerCoursInline(admin.TabularInline):
    model = AppliquerCours
    extra = 1
    autocomplete_fields = ['etudiant']
    fields = ['etudiant', 'cours', 'est_actif', 'date_application']
    readonly_fields = ['date_application']


@admin.register(GestionApplicationCours)
class GestionApplicationCoursAdmin(admin.ModelAdmin):
    list_display = ['titre', 'createur', 'cours', 'faculte', 'promotion', 'annee_academique', 'nb_applications', 'date_creation']
    list_filter = ['date_creation', 'faculte', 'promotion', 'annee_academique']
    search_fields = ['titre', 'description', 'createur__nom', 'createur__prenom', 'cours__nom_cours']
    readonly_fields = ['date_creation']
    ordering = ['-date_creation']
    inlines = [AppliquerCoursInline]
    
    fieldsets = (
        ('Informations', {
            'fields': ('titre', 'description', 'createur', 'cours')
        }),
        ('Critères de sélection', {
            'fields': ('faculte', 'promotion', 'annee_academique')
        }),
        ('Métadonnées', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['appliquer_aux_etudiants', 'supprimer_applications']
    
    def nb_applications(self, obj):
        return obj.applications_individuelles.filter(est_actif=True).count()
    nb_applications.short_description = "Applications actives"
    
    def appliquer_aux_etudiants(self, request, queryset):
        for gestion in queryset:
            gestion.appliquer_aux_etudiants()
        self.message_user(request, f"Les cours ont été appliqués aux étudiants pour {queryset.count()} gestion(s).")
    appliquer_aux_etudiants.short_description = "Appliquer les cours aux étudiants"
    
    def supprimer_applications(self, request, queryset):
        for gestion in queryset:
            gestion.applications_individuelles.all().delete()
        self.message_user(request, f"Toutes les applications ont été supprimées pour {queryset.count()} gestion(s).")
    supprimer_applications.short_description = "Supprimer toutes les applications"


@admin.register(AppliquerCours)
class AppliquerCoursAdmin(admin.ModelAdmin):
    list_display = ['etudiant', 'cours', 'gestion', 'est_actif', 'date_application']
    list_filter = ['est_actif', 'date_application', 'cours', 'gestion']
    search_fields = ['etudiant__nom', 'etudiant__prenom', 'cours__nom_cours']
    readonly_fields = ['date_application']
    ordering = ['-date_application']
    autocomplete_fields = ['etudiant', 'cours', 'gestion']
    
    fieldsets = (
        ('Lien', {
            'fields': ('gestion', 'etudiant', 'cours')
        }),
        ('Statut', {
            'fields': ('est_actif',)
        }),
        ('Métadonnées', {
            'fields': ('date_application',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activer_applications', 'desactiver_applications']
    
    def activer_applications(self, request, queryset):
        queryset.update(est_actif=True)
        self.message_user(request, f"{queryset.count()} application(s) activée(s).")
    activer_applications.short_description = "Activer les applications sélectionnées"
    
    def desactiver_applications(self, request, queryset):
        queryset.update(est_actif=False)
        self.message_user(request, f"{queryset.count()} application(s) désactivée(s).")
    desactiver_applications.short_description = "Désactiver les applications sélectionnées"
