from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django import forms
from django.contrib.auth.hashers import make_password
from .models import AnneeAcademique, Faculte, Departement, Promotion, Etudiant, InscriptionAcademique


# ============================================
# ADMIN RÉFÉRENTIELS ACADÉMIQUES
# ============================================
@admin.register(AnneeAcademique)
class AnneeAcademiqueAdmin(admin.ModelAdmin):
    list_display = ('nom', 'date_debut', 'date_fin', 'est_active')
    list_filter = ('est_active', 'date_debut', 'date_fin')
    search_fields = ('nom', 'description')
    ordering = ('-date_debut',)
    date_hierarchy = 'date_debut'
    list_per_page = 25
    fieldsets = (
        ('Année académique', {
            'fields': ('nom', 'date_debut', 'date_fin', 'est_active'),
        }),
        ('Informations complémentaires', {
            'fields': ('description',),
            'classes': ('collapse',),
        }),
    )


@admin.register(Faculte)
class FaculteAdmin(admin.ModelAdmin):
    list_display = ('code', 'nom', 'nombre_etudiants')
    search_fields = ('code', 'nom', 'description')
    ordering = ('nom',)
    list_per_page = 30
    fields = ('code', 'nom', 'description')

    @admin.display(description='Étudiants')
    def nombre_etudiants(self, obj):
        return obj.etudiant_set.count()


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('code', 'nom', 'ordre', 'nombre_etudiants')
    search_fields = ('code', 'nom', 'description')
    ordering = ('ordre', 'nom')
    list_editable = ('ordre',)
    list_per_page = 30
    fields = ('nom', 'code', 'ordre', 'description')

    @admin.display(description='Étudiants')
    def nombre_etudiants(self, obj):
        return obj.etudiant_set.count()

@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ('code', 'nom', 'faculte', 'est_actif', 'nombre_etudiants')
    list_filter = ('est_actif', 'faculte')
    search_fields = ('code', 'nom', 'faculte__nom')
    @admin.display(description='Étudiants')
    def nombre_etudiants(self, obj):
        return obj.etudiants.count()

# ============================================
# FORMULAIRE PERSONNALISÉ AVEC HACHAGE
# ============================================
class EtudiantForm(forms.ModelForm):
    mot_de_passe = forms.CharField(
        widget=forms.PasswordInput(render_value=True),
        required=False,
        label="Mot de passe",
        help_text="Laissez vide pour ne pas modifier le mot de passe actuel."
    )
    
    class Meta:
        model = Etudiant
        fields = '__all__'
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # ✅ Hacher le mot de passe s'il a été modifié
        mot_de_passe = self.cleaned_data.get('mot_de_passe')
        if mot_de_passe:
            instance.mot_de_passe = make_password(mot_de_passe)
        
        if commit:
            instance.save()
            self.save_m2m()
        return instance

# ============================================
# ADMIN ÉTUDIANT
# ============================================
@admin.register(InscriptionAcademique)
class InscriptionAcademiqueAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'annee_academique', 'promotion', 'faculte', 'statut', 'est_courante')
    list_filter = ('annee_academique', 'promotion', 'faculte', 'statut', 'est_courante')
    search_fields = ('etudiant__matricule', 'etudiant__nom', 'etudiant__post_nom', 'etudiant__prenom')
    readonly_fields = ('date_creation', 'date_modification')


@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    form = EtudiantForm  # ✅ Utilisation du formulaire avec hachage
    
    list_display = [
        'matricule', 'nom_complet', 'faculte', 'promotion', 
        'annee_academique', 'statut_frais', 'date_inscription'
    ]
    list_filter = [
        'sexe', 'faculte', 'promotion', 'annee_academique', 
        'statut_frais', 'est_actif'
    ]
    search_fields = [
        'matricule', 'nom', 'post_nom', 'prenom', 'telephone', 'email'
    ]
    list_editable = ['statut_frais']
    list_per_page = 50
    readonly_fields = ('matricule', 'date_inscription', 'date_creation', 'date_modification')
    
    fieldsets = (
        ('Identité', {
            'fields': ('nom', 'post_nom', 'prenom', 'sexe', 'date_naissance', 'lieu_naissance')
        }),
        ('Contact', {
            'fields': ('telephone', 'email', 'adresse')
        }),
        ('Académique', {
            'fields': ('matricule', 'faculte', 'departement', 'promotion', 'annee_academique', 'photo')
        }),
        ('Parent/Tuteur', {
            'fields': ('parent_nom', 'parent_telephone', 'parent_email')
        }),
        ('Frais', {
            'fields': ('statut_frais',)
        }),
        # ✅ Section Sécurité avec mot de passe
        ('Sécurité', {
            'fields': ('mot_de_passe',),
            'classes': ('collapse',),
        }),
        ('Statut', {
            'fields': ('est_actif', 'utilisateur'),
            'classes': ('collapse',)
        }),
    )
    
    def nom_complet(self, obj):
        return f"{obj.nom} {obj.post_nom} {obj.prenom}"
    nom_complet.short_description = "Nom complet"
    nom_complet.admin_order_field = 'nom'

# ... (le reste de votre code admin)
