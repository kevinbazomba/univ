from rest_framework import serializers

from .models import JetonJury


class JetonJurySerializer(serializers.ModelSerializer):
    annee_academique_nom = serializers.CharField(source='annee_academique.nom', read_only=True)
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True, allow_null=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True, allow_null=True)
    promotion_nom = serializers.CharField(source='promotion.nom', read_only=True, allow_null=True)

    class Meta:
        model = JetonJury
        fields = [
            'id', 'code', 'libelle', 'annee_academique',
            'annee_academique_nom', 'faculte', 'faculte_nom',
            'departement', 'departement_nom', 'promotion', 'promotion_nom',
            'est_actif', 'date_creation', 'date_desactivation',
        ]
        read_only_fields = ['code', 'date_creation', 'date_desactivation']
        extra_kwargs = {
            'annee_academique': {'required': False},
        }


class VerifierJetonJurySerializer(serializers.Serializer):
    code = serializers.CharField()
