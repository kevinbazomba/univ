from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import (
    Grade, 
    Professeur, 
    Cours, 
    GestionApplicationCours, 
    AppliquerCours, SessionEvaluation, CotationSession, DecisionJury
)
from apps.etudiants.models import Faculte, Etudiant, Promotion, AnneeAcademique, InscriptionAcademique


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'code', 'libelle', 'ordre', 'est_actif', 'date_creation']
        read_only_fields = ['code', 'date_creation']


class FaculteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculte
        fields = ['id', 'nom', 'code', 'description']


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'nom', 'code', 'description', 'ordre']


class AnneeAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeAcademique
        fields = ['id', 'nom', 'date_debut', 'date_fin', 'est_active']


class ProfesseurSerializer(serializers.ModelSerializer):
    grade_libelle = serializers.CharField(source='grade.libelle', read_only=True)
    grade_code = serializers.CharField(source='grade.code', read_only=True)
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True)
    
    class Meta:
        model = Professeur
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'email', 'telephone',
            'est_actif', 'date_embauche', 'grade', 'grade_libelle', 'grade_code',
            'faculte', 'faculte_nom', 'specialite',
            'tentative_connexion', 'bloque_jusqua', 'date_derniere_connexion',
            'date_creation', 'date_modification', 'mot_de_passe'
        ]
        read_only_fields = ['matricule', 'date_creation', 'date_modification']
        extra_kwargs = {
            'mot_de_passe': {'write_only': True, 'required': False},
        }
    
    def create(self, validated_data):
        # Hasher le mot de passe
        if 'mot_de_passe' in validated_data:
            validated_data['mot_de_passe'] = make_password(validated_data['mot_de_passe'])
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'mot_de_passe' in validated_data:
            mot_de_passe = validated_data.get('mot_de_passe')
            if mot_de_passe:
                validated_data['mot_de_passe'] = make_password(mot_de_passe)
            else:
                validated_data.pop('mot_de_passe')
        return super().update(instance, validated_data)


class ProfesseurProfileUpdateSerializer(serializers.ModelSerializer):
    """Informations qu'un professeur peut modifier sur son propre compte."""

    class Meta:
        model = Professeur
        fields = ['nom', 'prenom', 'email', 'telephone', 'specialite']


class ProfesseurLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)


class CoursSerializer(serializers.ModelSerializer):
    responsable_nom = serializers.CharField(source='responsable.nom', read_only=True)
    responsable_prenom = serializers.CharField(source='responsable.prenom', read_only=True)
    
    class Meta:
        model = Cours
        fields = [
            'id', 'code_cours', 'nom_cours', 'ponderation', 'points',
            'credit', 'volume_horaire', 'description',
            'responsable', 'responsable_nom', 'responsable_prenom',
            'date_creation'
        ]
        read_only_fields = ['code_cours', 'date_creation']


class SessionEvaluationSerializer(serializers.ModelSerializer):
    annee_academique_nom = serializers.CharField(source='annee_academique.nom', read_only=True)
    annee_academique_est_active = serializers.BooleanField(source='annee_academique.est_active', read_only=True)
    session_origine_nom = serializers.CharField(source='session_origine.nom', read_only=True, allow_null=True)

    class Meta:
        model = SessionEvaluation
        fields = [
            'id', 'nom', 'annee_academique', 'annee_academique_nom', 'annee_academique_est_active',
            'date_debut', 'date_fin', 'description', 'est_active',
            'est_rattrapage', 'est_cloture', 'session_origine', 'session_origine_nom', 'sessions_incluses',
        ]


class CotationSessionSerializer(serializers.ModelSerializer):
    session_nom = serializers.CharField(source='session.nom', read_only=True)

    class Meta:
        model = CotationSession
        fields = ['id', 'session', 'session_nom', 'points_tp', 'points_interro', 'points_examen', 'total', 'observation', 'date_evaluation']

class DecisionJurySerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.nom_complet', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.matricule', read_only=True)
    session_nom = serializers.CharField(source='session.nom', read_only=True)
    class Meta:
        model = DecisionJury
        fields = '__all__'


class AppliquerCoursSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.nom', read_only=True)
    etudiant_prenom = serializers.CharField(source='etudiant.prenom', read_only=True)
    etudiant_post_nom = serializers.CharField(source='etudiant.post_nom', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.matricule', read_only=True)
    faculte_nom = serializers.CharField(source='etudiant.faculte.nom', read_only=True)
    promotion_nom = serializers.CharField(source='etudiant.promotion.nom', read_only=True)
    cours_nom = serializers.CharField(source='cours.nom_cours', read_only=True)
    cours_points = serializers.IntegerField(source='cours.points', read_only=True)
    gestion_titre = serializers.CharField(source='gestion.titre', read_only=True)
    cotations = CotationSessionSerializer(many=True, read_only=True)
    
    class Meta:
        model = AppliquerCours
        fields = [
            'id', 'gestion', 'gestion_titre', 'etudiant', 'etudiant_nom',
            'etudiant_post_nom', 'etudiant_prenom', 'etudiant_matricule',
            'faculte_nom', 'promotion_nom', 'cours', 'cours_nom', 'cours_points',
            'date_application', 'est_actif', 'points_tp', 'points_interro',
            'points_examen', 'points_obtenus', 'observation',
            'date_evaluation', 'cotations'
        ]
        read_only_fields = ['date_application', 'date_evaluation']

    def validate(self, data):
        gestion = data.get('gestion') or getattr(self.instance, 'gestion', None)
        etudiant = data.get('etudiant') or getattr(self.instance, 'etudiant', None)
        cours = data.get('cours') or getattr(self.instance, 'cours', None)
        if gestion and cours and cours.pk != gestion.cours_id:
            raise serializers.ValidationError({'cours': "Le cours doit correspondre au plan d'application."})
        if gestion and gestion.annee_academique and etudiant:
            annee = gestion.annee_academique
            inscription = InscriptionAcademique.objects.filter(
                etudiant=etudiant,
                annee_academique=annee,
            ).first()
            if not inscription:
                raise serializers.ValidationError({'etudiant': "L'étudiant n'appartient pas à cette année académique."})
            if gestion.faculte_id and inscription.faculte_id != gestion.faculte_id:
                raise serializers.ValidationError({'etudiant': "L'étudiant n'appartient pas à la faculté ciblée."})
            if gestion.promotion_id and inscription.promotion_id != gestion.promotion_id:
                raise serializers.ValidationError({'etudiant': "L'étudiant n'appartient pas à la promotion ciblée."})
        if False and gestion and gestion.annee_academique and etudiant:
            annee = gestion.annee_academique
            if etudiant.annee_academique_id != annee.id:
                raise serializers.ValidationError({'etudiant': "L'étudiant n'appartient pas à cette année académique."})
            if not annee.date_debut <= etudiant.date_inscription <= annee.date_fin:
                raise serializers.ValidationError({'etudiant': "La date d'inscription est hors de la période académique."})
        return data


class GestionApplicationCoursSerializer(serializers.ModelSerializer):
    createur_nom = serializers.CharField(source='createur.nom', read_only=True)
    createur_prenom = serializers.CharField(source='createur.prenom', read_only=True)
    cours_nom = serializers.CharField(source='cours.nom_cours', read_only=True)
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True, allow_null=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True, allow_null=True)
    promotion_nom = serializers.CharField(source='promotion.nom', read_only=True, allow_null=True)
    annee_academique_nom = serializers.CharField(source='annee_academique.nom', read_only=True, allow_null=True)
    nombre_etudiants = serializers.SerializerMethodField()
    applications = AppliquerCoursSerializer(many=True, read_only=True)
    
    class Meta:
        model = GestionApplicationCours
        fields = [
            'id', 'titre', 'description', 'createur', 'createur_nom',
            'createur_prenom', 'faculte', 'faculte_nom', 'departement',
            'departement_nom', 'promotion', 'promotion_nom', 'annee_academique', 'annee_academique_nom',
            'cours', 'cours_nom', 'date_creation', 'nombre_etudiants',
            'applications'
        ]
        read_only_fields = ['date_creation']
    
    def get_nombre_etudiants(self, obj):
        return obj.applications_individuelles.count()
    
    def create(self, validated_data):
        instance = super().create(validated_data)
        # Appliquer automatiquement aux étudiants
        instance.appliquer_aux_etudiants()
        return instance


class GestionApplicationCoursSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la création/mise à jour"""
    createur_nom = serializers.CharField(source='createur.nom', read_only=True)
    cours_nom = serializers.CharField(source='cours.nom_cours', read_only=True)
    
    class Meta:
        model = GestionApplicationCours
        fields = [
            'id', 'titre', 'description', 'createur', 'createur_nom',
            'faculte', 'departement', 'promotion', 'annee_academique',
            'cours', 'cours_nom', 'date_creation'
        ]
        read_only_fields = ['date_creation']
    
    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.appliquer_aux_etudiants()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True)
    confirmer_mot_de_passe = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['nouveau_mot_de_passe'] != data['confirmer_mot_de_passe']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        if len(data['nouveau_mot_de_passe']) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères")
        return data
