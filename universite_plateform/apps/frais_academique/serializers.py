from rest_framework import serializers
from django.contrib.auth.models import User

from .models import TypeFrais, TarifFrais, FraisAcademique, Paiement
from apps.etudiants.models import AnneeAcademique


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class TypeFraisSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeFrais
        fields = '__all__'


class TarifFraisSerializer(serializers.ModelSerializer):
    faculte = serializers.StringRelatedField()
    faculte_id = serializers.PrimaryKeyRelatedField(
        queryset=TarifFrais._meta.get_field('faculte').remote_field.model.objects.all(),
        source='faculte',
        write_only=True,
        required=False,
        allow_null=True,
    )
    promotion = serializers.StringRelatedField()
    promotion_id = serializers.PrimaryKeyRelatedField(
        queryset=TarifFrais._meta.get_field('promotion').remote_field.model.objects.all(),
        source='promotion',
        write_only=True,
        required=False,
        allow_null=True,
    )
    departement = serializers.StringRelatedField()
    departement_id = serializers.PrimaryKeyRelatedField(
        queryset=TarifFrais._meta.get_field('departement').remote_field.model.objects.all(),
        source='departement', write_only=True, required=False, allow_null=True,
    )
    type_frais = TypeFraisSerializer(read_only=True)
    type_frais_id = serializers.PrimaryKeyRelatedField(
        queryset=TypeFrais.objects.all(),
        source='type_frais',
        write_only=True,
    )
    annee_academique = serializers.StringRelatedField()
    annee_academique_id = serializers.PrimaryKeyRelatedField(
        queryset=AnneeAcademique.objects.all(),
        source='annee_academique',
        write_only=True,
    )

    class Meta:
        model = TarifFrais
        fields = '__all__'

    def validate(self, data):
        faculte = data.get('faculte') or getattr(self.instance, 'faculte', None)
        departement = data.get('departement') or getattr(self.instance, 'departement', None)
        if departement and (not faculte or departement.faculte_id != faculte.id):
            raise serializers.ValidationError({'departement_id': "Ce département n'appartient pas à la faculté sélectionnée."})
        return data


class FraisAcademiqueSerializer(serializers.ModelSerializer):
    etudiant = serializers.StringRelatedField()
    etudiant_id = serializers.IntegerField(read_only=True)
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True, allow_null=True)
    promotion_nom = serializers.CharField(source='promotion.nom', read_only=True, allow_null=True)
    type_frais = TypeFraisSerializer(read_only=True)
    total_paye = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    solde_restant = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    statut_paiement = serializers.CharField(read_only=True)

    class Meta:
        model = FraisAcademique
        fields = '__all__'


class PaiementSerializer(serializers.ModelSerializer):
    etudiant = serializers.StringRelatedField(read_only=True)
    etudiant_id = serializers.IntegerField(read_only=True)
    frais = FraisAcademiqueSerializer(read_only=True)
    frais_id = serializers.PrimaryKeyRelatedField(
        queryset=FraisAcademique.objects.all(),
        source='frais',
        write_only=True,
    )
    agent = UserSerializer(read_only=True)

    class Meta:
        model = Paiement
        fields = '__all__'

    def create(self, validated_data):
        # Récupérer les frais et en extraire l'étudiant
        frais = validated_data.get('frais')
        validated_data['etudiant'] = frais.etudiant
        return super().create(validated_data)
