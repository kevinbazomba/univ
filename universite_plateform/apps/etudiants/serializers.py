from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.db.models import Sum
from .models import AnneeAcademique, Faculte, Departement, Promotion, Etudiant, InscriptionAcademique


class EtudiantLoginSerializer(serializers.Serializer):
    matricule = serializers.CharField()
    mot_de_passe = serializers.CharField(write_only=True)

class AnneeAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeAcademique
        fields = ['id', 'nom', 'date_debut', 'date_fin', 'est_active', 'description']
    
    def validate(self, data):
        if data.get('date_debut') and data.get('date_fin'):
            if data['date_debut'] > data['date_fin']:
                raise serializers.ValidationError("La date de début doit être antérieure à la date de fin")
        return data

class FaculteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculte
        fields = ['id', 'nom', 'code', 'description']

class DepartementSerializer(serializers.ModelSerializer):
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True)
    class Meta:
        model = Departement
        fields = ['id', 'nom', 'code', 'description', 'est_actif', 'faculte', 'faculte_nom']

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'nom', 'code', 'description', 'ordre']

class InscriptionAcademiqueSerializer(serializers.ModelSerializer):
    annee_academique_nom = serializers.CharField(source='annee_academique.nom', read_only=True)
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True, allow_null=True)
    promotion_nom = serializers.CharField(source='promotion.nom', read_only=True)

    class Meta:
        model = InscriptionAcademique
        fields = [
            'id', 'annee_academique', 'annee_academique_nom',
            'faculte', 'faculte_nom', 'departement', 'departement_nom',
            'promotion', 'promotion_nom', 'statut', 'date_inscription', 'est_courante',
        ]
        read_only_fields = fields


class EtudiantSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True, allow_null=True)
    promotion_nom = serializers.CharField(source='promotion.nom', read_only=True)
    annee_academique_nom = serializers.CharField(source='annee_academique.nom', read_only=True, allow_null=True)
    mot_de_passe = serializers.CharField(write_only=True, required=False)
    matricule = serializers.CharField(read_only=True)
    statut_frais = serializers.SerializerMethodField()
    parcours_academique = InscriptionAcademiqueSerializer(source='inscriptions_academiques', many=True, read_only=True)

    def get_statut_frais(self, instance):
        """Statut global calculé sur les frais de l'année affichée."""
        frais = instance.frais_academiques.all()
        annee_id = self.context.get('annee_academique_id') or instance.annee_academique_id
        if annee_id:
            frais = frais.filter(annee_academique_id=annee_id)

        montant_total = frais.aggregate(total=Sum('montant_total'))['total'] or 0
        if montant_total <= 0:
            return 'NON_APPLIQUE'

        from apps.frais_academique.models import Paiement
        montant_paye = Paiement.objects.filter(
            frais__in=frais,
            statut='valide',
        ).aggregate(total=Sum('montant_paye'))['total'] or 0

        if montant_paye <= 0:
            return 'IMPAYE'
        if montant_paye >= montant_total:
            return 'PAYE'
        return 'PARTIEL'
    
    class Meta:
        model = Etudiant
        fields = [
            'id', 'nom', 'post_nom', 'prenom', 'nom_complet', 'sexe', 
            'date_naissance', 'age', 'lieu_naissance', 'telephone', 'email', 'adresse',
            'matricule', 'faculte', 'faculte_nom', 'departement', 'departement_nom', 'promotion', 'promotion_nom',
            'annee_academique', 'annee_academique_nom', 'photo', 
            'parent_nom', 'parent_telephone', 'parent_email',
            'date_inscription', 'statut_frais', 'est_actif',
            'mot_de_passe', 'parcours_academique'
        ]

    def create(self, validated_data):
        mot = validated_data.get('mot_de_passe')
        if mot:
            validated_data['mot_de_passe'] = make_password(mot)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'mot_de_passe' in validated_data:
            mot = validated_data.get('mot_de_passe')
            if mot:
                validated_data['mot_de_passe'] = make_password(mot)
            else:
                validated_data.pop('mot_de_passe')
        return super().update(instance, validated_data)


class EtudiantProfileUpdateSerializer(serializers.ModelSerializer):
    """Champs qu'un étudiant est autorisé à modifier lui-même."""

    class Meta:
        model = Etudiant
        fields = [
            'date_naissance', 'lieu_naissance', 'telephone', 'email', 'adresse',
            'parent_nom', 'parent_telephone', 'parent_email',
        ]

    def validate(self, data):
        faculte = data.get('faculte') or getattr(self.instance, 'faculte', None)
        departement = data.get('departement') or getattr(self.instance, 'departement', None)
        if departement and faculte and departement.faculte_id != faculte.id:
            raise serializers.ValidationError({'departement': "Ce département n'appartient pas à la faculté sélectionnée."})
        return data
