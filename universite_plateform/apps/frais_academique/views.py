from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone

from .models import TypeFrais, TarifFrais, FraisAcademique, Paiement
from .serializers import (
    TypeFraisSerializer,
    TarifFraisSerializer,
    FraisAcademiqueSerializer,
    PaiementSerializer,
)
from apps.etudiants.models import Etudiant, AnneeAcademique


LECTURE_SEULE_MESSAGE = "Cette année académique est clôturée : consultation uniquement."


def verifier_annee_active(annee):
    if not annee or not annee.est_active:
        raise ValidationError({'annee_academique': [LECTURE_SEULE_MESSAGE]})
    aujourd_hui = timezone.localdate()
    if not annee.date_debut <= aujourd_hui <= annee.date_fin:
        raise ValidationError({'annee_academique': ["La date actuelle est hors de la période de l'année active."]})


class TypeFraisListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = TypeFrais.objects.all()
    serializer_class = TypeFraisSerializer


class TarifFraisListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = TarifFrais.objects.all()
    serializer_class = TarifFraisSerializer

    def get_queryset(self):
        """Filtrer par l'année demandée, ou par l'année active par défaut."""
        queryset = TarifFrais.objects.all()
        annee_id = self.request.query_params.get('annee_academique')
        if annee_id:
            queryset = queryset.filter(annee_academique_id=annee_id)
        else:
            annee_active = AnneeAcademique.get_annee_active()
            if annee_active:
                queryset = queryset.filter(annee_academique=annee_active)
        return queryset

    def perform_create(self, serializer):
        """Assigner l'année active par défaut si non spécifiée"""
        annee_id = self.request.data.get('annee_academique_id')
        annee = AnneeAcademique.objects.filter(pk=annee_id).first() if annee_id else AnneeAcademique.get_annee_active()
        verifier_annee_active(annee)
        serializer.save(annee_academique=annee)


class FraisAcademiqueListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = FraisAcademique.objects.all()
    serializer_class = FraisAcademiqueSerializer

    def get_queryset(self):
        """Filtrer par l'année demandée, ou par l'année active par défaut."""
        queryset = FraisAcademique.objects.all()
        etudiant_id = self.request.query_params.get('etudiant')
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        annee_id = self.request.query_params.get('annee_academique')
        annee = AnneeAcademique.objects.filter(pk=annee_id).first() if annee_id else (None if etudiant_id else AnneeAcademique.get_annee_active())
        if annee_id and not annee:
            return queryset.none()
        if annee:
            queryset = queryset.filter(
                annee_academique=annee,
                date_creation__date__gte=annee.date_debut,
                date_creation__date__lte=annee.date_fin,
            )
        return queryset

    def perform_create(self, serializer):
        """Assigner l'année active par défaut si non spécifiée"""
        annee_id = self.request.data.get('annee_academique_id')
        annee = AnneeAcademique.objects.filter(pk=annee_id).first() if annee_id else AnneeAcademique.get_annee_active()
        verifier_annee_active(annee)
        serializer.save(annee_academique=annee)


class FraisAcademiqueDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = FraisAcademique.objects.all()
    serializer_class = FraisAcademiqueSerializer

    def _verifier(self, instance):
        verifier_annee_active(instance.annee_academique)

    def perform_update(self, serializer):
        self._verifier(serializer.instance)
        serializer.save(annee_academique=serializer.instance.annee_academique)

    def perform_destroy(self, instance):
        self._verifier(instance)
        instance.delete()


class PaiementListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer

    def get_queryset(self):
        """Filtrer par l'année demandée, ou par l'année active par défaut."""
        queryset = Paiement.objects.all()
        etudiant_id = self.request.query_params.get('etudiant')
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        annee_id = self.request.query_params.get('annee_academique')
        annee = AnneeAcademique.objects.filter(pk=annee_id).first() if annee_id else (None if etudiant_id else AnneeAcademique.get_annee_active())
        if annee_id and not annee:
            return queryset.none()
        if annee:
            queryset = queryset.filter(
                frais__annee_academique=annee,
                date_paiement__gte=annee.date_debut,
                date_paiement__lte=annee.date_fin,
            )
        return queryset

    def perform_create(self, serializer):
        """Enregistrer automatiquement l'utilisateur comme agent"""
        frais = serializer.validated_data.get('frais')
        verifier_annee_active(frais.annee_academique if frais else None)
        date_paiement = serializer.validated_data.get('date_paiement') or timezone.localdate()
        if not frais.annee_academique.date_debut <= date_paiement <= frais.annee_academique.date_fin:
            raise ValidationError({'date_paiement': ["La date du paiement doit appartenir à l'année académique active."]})
        serializer.save(agent=self.request.user)


class ApplyTarifView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            tarif = TarifFrais.objects.get(pk=pk)
        except TarifFrais.DoesNotExist:
            return Response({'detail': 'Tarif non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        try:
            verifier_annee_active(tarif.annee_academique)
        except ValidationError as erreur:
            return Response(erreur.detail, status=status.HTTP_403_FORBIDDEN)

        students = Etudiant.objects.filter(
            est_actif=True,
            annee_academique=tarif.annee_academique,
            date_inscription__gte=tarif.annee_academique.date_debut,
            date_inscription__lte=tarif.annee_academique.date_fin,
        )
        if tarif.faculte:
            students = students.filter(faculte=tarif.faculte)
        if tarif.departement:
            students = students.filter(departement=tarif.departement)
        if tarif.promotion:
            students = students.filter(promotion=tarif.promotion)

        created = 0
        skipped = 0
        for s in students:
            obj, created_flag = FraisAcademique.objects.get_or_create(
                etudiant=s,
                annee_academique=tarif.annee_academique,
                semestre=tarif.semestre,
                type_frais=tarif.type_frais,
                defaults={
                    'faculte': tarif.faculte,
                    'departement': tarif.departement,
                    'promotion': tarif.promotion,
                    'option_specialisation': tarif.option_specialisation,
                    'montant_total': tarif.montant,
                    'description': f'Assigné automatiquement depuis le tarif #{tarif.pk}',
                },
            )
            if created_flag:
                created += 1
            else:
                skipped += 1

        return Response({'created': created, 'skipped': skipped}, status=status.HTTP_200_OK)
