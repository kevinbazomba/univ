from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response

from apps.etudiants.models import AnneeAcademique
from .models import JetonJury
from .serializers import JetonJurySerializer, VerifierJetonJurySerializer


class IsAdministrativeUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and not hasattr(request.user, 'professeur')
        )


class JetonJuryViewSet(viewsets.ModelViewSet):
    queryset = JetonJury.objects.select_related(
        'annee_academique', 'faculte', 'departement', 'promotion',
    )
    serializer_class = JetonJurySerializer
    permission_classes = [IsAdministrativeUser]

    def perform_create(self, serializer):
        annee = serializer.validated_data.get('annee_academique') or AnneeAcademique.get_annee_active()
        serializer.save(annee_academique=annee)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def verifier(self, request):
        serializer = VerifierJetonJurySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code'].strip().upper()
        try:
            jeton = self.get_queryset().get(code=code, est_actif=True)
        except JetonJury.DoesNotExist:
            return Response(
                {'error': 'Code jeton invalide ou désactivé.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({
            'message': 'Jeton valide.',
            'token': jeton.code,
            'scope': JetonJurySerializer(jeton).data,
        })
