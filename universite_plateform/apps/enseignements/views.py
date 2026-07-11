from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
from decimal import Decimal, InvalidOperation
from datetime import timedelta
import secrets
import re

from .models import (
    Grade, Professeur, Cours, 
    GestionApplicationCours, AppliquerCours, SessionEvaluation, CotationSession, DecisionJury, PromotionEnAttente
)
from .serializers import (
    GradeSerializer, ProfesseurSerializer, ProfesseurLoginSerializer,
    CoursSerializer, 
    GestionApplicationCoursSerializer, GestionApplicationCoursSimpleSerializer,
    AppliquerCoursSerializer, ChangePasswordSerializer,
    FaculteSerializer, PromotionSerializer, AnneeAcademiqueSerializer,
    ProfesseurProfileUpdateSerializer, SessionEvaluationSerializer, DecisionJurySerializer
)
from apps.etudiants.models import Faculte, Departement, Promotion, AnneeAcademique, Etudiant, InscriptionAcademique
from apps.etudiants.serializers import DepartementSerializer, EtudiantSerializer


class IsAdministrativeUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and not hasattr(request.user, 'professeur')
        )


# ==================== GRADE ====================
class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    #permission_classes = [IsAuthenticated]
    permission_classes = [IsAdministrativeUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        est_actif = self.request.query_params.get('est_actif')
        if est_actif is not None:
            queryset = queryset.filter(est_actif=est_actif.lower() == 'true')
        return queryset


# ==================== FACULTE ====================
class FaculteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Faculte.objects.all()
    serializer_class = FaculteSerializer
   #permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]

# ==================== PROMOTION ====================
class PromotionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    #permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]

# ==================== ANNEE ACADEMIQUE ====================
class AnneeAcademiqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AnneeAcademique.objects.all()
    serializer_class = AnneeAcademiqueSerializer
    #permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def active(self, request):
        """Récupérer l'année académique active"""
        try:
            annee = AnneeAcademique.objects.get(est_active=True)
            serializer = self.get_serializer(annee)
            return Response(serializer.data)
        except AnneeAcademique.DoesNotExist:
            return Response(
                {'error': 'Aucune année académique active'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==================== PROFESSEUR ====================
class ProfesseurViewSet(viewsets.ModelViewSet):
    queryset = Professeur.objects.all()
    serializer_class = ProfesseurSerializer
    #permission_classes = [IsAuthenticated]
    permission_classes = [IsAdministrativeUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        est_actif = self.request.query_params.get('est_actif')
        faculte = self.request.query_params.get('faculte')
        grade = self.request.query_params.get('grade')
        
        if est_actif is not None:
            queryset = queryset.filter(est_actif=est_actif.lower() == 'true')
        if faculte:
            queryset = queryset.filter(faculte_id=faculte)
        if grade:
            queryset = queryset.filter(grade_id=grade)
        
        return queryset

    def get_connected_professeur(self, request):
        user = request.user
        if not user or not user.is_authenticated or not hasattr(user, 'professeur'):
            return None
        professeur = user.professeur
        return professeur if professeur.est_actif else None

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[AllowAny],
        authentication_classes=[],
        url_path='options-inscription',
    )
    def options_inscription(self, request):
        return Response({
            'grades': GradeSerializer(Grade.objects.filter(est_actif=True), many=True).data,
            'facultes': FaculteSerializer(Faculte.objects.all(), many=True).data,
        })

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        authentication_classes=[],
        url_path='inscription',
    )
    def inscription(self, request):
        mot_de_passe = request.data.get('mot_de_passe', '')
        confirmation = request.data.get('confirmer_mot_de_passe', '')
        if len(mot_de_passe) < 8:
            return Response(
                {'mot_de_passe': ['Le mot de passe doit contenir au moins 8 caractères.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if mot_de_passe != confirmation:
            return Response(
                {'confirmer_mot_de_passe': ['Les mots de passe ne correspondent pas.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProfesseurSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        professeur = serializer.save(est_actif=False)
        return Response(
            {
                'message': 'Inscription enregistrée. Le compte doit être activé par l’administration.',
                'professeur': ProfesseurSerializer(professeur).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated], url_path='mon-espace')
    def mon_espace(self, request):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response(
                {'error': 'Ce compte n’est pas lié à un professeur actif'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.method == 'PATCH':
            serializer = ProfesseurProfileUpdateSerializer(
                professeur, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            if professeur.user:
                professeur.user.first_name = professeur.prenom
                professeur.user.last_name = professeur.nom
                professeur.user.email = professeur.email
                professeur.user.save(update_fields=['first_name', 'last_name', 'email'])

        annee_id = request.query_params.get('annee_academique')
        annee = AnneeAcademique.objects.filter(pk=annee_id).first() if annee_id else AnneeAcademique.get_annee_active()
        if annee_id and not annee:
            return Response({'annee_academique': ['Année académique invalide.']}, status=status.HTTP_400_BAD_REQUEST)

        cours = Cours.objects.filter(responsable=professeur).order_by('nom_cours')
        gestions = GestionApplicationCours.objects.filter(createur=professeur).select_related(
            'cours', 'faculte', 'promotion', 'annee_academique', 'createur'
        ).prefetch_related('applications_individuelles').order_by('-date_creation')
        applications = AppliquerCours.objects.filter(
            gestion__createur=professeur
        ).select_related(
            'gestion', 'cours', 'etudiant', 'etudiant__faculte', 'etudiant__promotion'
        ).prefetch_related('cotations__session').order_by('cours__nom_cours', 'etudiant__nom', 'etudiant__prenom')

        if annee:
            gestions = gestions.filter(
                annee_academique=annee,
                date_creation__date__gte=annee.date_debut,
                date_creation__date__lte=annee.date_fin,
            )
            applications = applications.filter(
                gestion__annee_academique=annee,
                etudiant__inscriptions_academiques__annee_academique=annee,
                date_application__date__gte=annee.date_debut,
                date_application__date__lte=annee.date_fin,
            ).distinct()

        return Response({
            'professeur': ProfesseurSerializer(professeur).data,
            'annee_selectionnee': AnneeAcademiqueSerializer(annee).data if annee else None,
            'cours': CoursSerializer(cours, many=True).data,
            'gestions': GestionApplicationCoursSerializer(gestions, many=True).data,
            'etudiants_appliques': AppliquerCoursSerializer(applications, many=True).data,
            'options': {
                'facultes': FaculteSerializer(Faculte.objects.all(), many=True).data,
                'departements': DepartementSerializer(Departement.objects.filter(est_actif=True), many=True).data,
                'promotions': PromotionSerializer(Promotion.objects.all(), many=True).data,
                'annees': AnneeAcademiqueSerializer(AnneeAcademique.objects.all(), many=True).data,
                'sessions': SessionEvaluationSerializer(
                    SessionEvaluation.objects.filter(annee_academique=annee, est_active=True, est_cloture=False).select_related('annee_academique') if annee else SessionEvaluation.objects.none(),
                    many=True,
                ).data,
            },
            'statistiques': {
                'nombre_cours': cours.count(),
                'nombre_gestions': gestions.count(),
                'nombre_etudiants': applications.filter(est_actif=True).values('etudiant_id').distinct().count(),
            },
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='creer-mon-cours')
    def creer_mon_cours(self, request):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response({'error': 'Compte professeur requis'}, status=status.HTTP_403_FORBIDDEN)

        donnees = request.data.copy()
        donnees['responsable'] = professeur.pk
        serializer = CoursSerializer(data=donnees)
        serializer.is_valid(raise_exception=True)
        cours = serializer.save(responsable=professeur)
        return Response(CoursSerializer(cours).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='creer-mon-application')
    def creer_mon_application(self, request):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response({'error': 'Compte professeur requis'}, status=status.HTTP_403_FORBIDDEN)

        try:
            cours = Cours.objects.get(pk=request.data.get('cours'), responsable=professeur)
        except Cours.DoesNotExist:
            return Response(
                {'cours': ['Vous ne pouvez appliquer que vos propres cours.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        donnees = request.data.copy()
        donnees['cours'] = cours.pk
        donnees['createur'] = professeur.pk
        if not donnees.get('annee_academique'):
            annee_active = AnneeAcademique.get_annee_active()
            if not annee_active:
                return Response(
                    {'annee_academique': ['Aucune année académique active.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            donnees['annee_academique'] = annee_active.pk

        annee = AnneeAcademique.objects.filter(pk=donnees.get('annee_academique')).first()
        if not annee or not annee.est_active or not annee.date_debut <= timezone.localdate() <= annee.date_fin:
            return Response(
                {'annee_academique': ['Les applications sont autorisées uniquement dans la période de l’année active.']},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GestionApplicationCoursSimpleSerializer(data=donnees)
        serializer.is_valid(raise_exception=True)
        gestion = serializer.save(createur=professeur, cours=cours)
        return Response(
            GestionApplicationCoursSerializer(gestion).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated], url_path='supprimer-mon-application/(?P<application_id>[^/.]+)')
    def supprimer_mon_application(self, request, application_id=None):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response({'error': 'Compte professeur requis'}, status=status.HTTP_403_FORBIDDEN)

        try:
            gestion = GestionApplicationCours.objects.get(pk=application_id, createur=professeur)
        except GestionApplicationCours.DoesNotExist:
            return Response(
                {'error': "Application introuvable ou non autorisée."},
                status=status.HTTP_404_NOT_FOUND,
            )

        annee = gestion.annee_academique
        if annee and not annee.est_active:
            return Response(
                {'error': 'Cette année académique est clôturée : suppression impossible.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        titre = gestion.titre
        nombre = gestion.applications_individuelles.count()
        gestion.delete()
        return Response({
            'message': f'Application « {titre} » supprimée avec {nombre} affectation(s) étudiant(s).'
        })

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        annee = getattr(obj, 'annee_academique', None)
        if not annee and getattr(obj, 'session', None):
            annee = obj.session.annee_academique
        if not annee and getattr(obj, 'gestion', None):
            annee = obj.gestion.annee_academique
        return not annee or annee.est_active
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='mes-etudiants')
    def mes_etudiants(self, request):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response({'error': 'Compte professeur requis'}, status=status.HTTP_403_FORBIDDEN)

        queryset = AppliquerCours.objects.filter(
            gestion__createur=professeur
        ).select_related(
            'gestion', 'cours', 'etudiant', 'etudiant__faculte', 'etudiant__promotion'
        )
        recherche = request.query_params.get('search')
        if recherche:
            queryset = queryset.filter(
                Q(etudiant__matricule__icontains=recherche)
                | Q(etudiant__nom__icontains=recherche)
                | Q(etudiant__post_nom__icontains=recherche)
                | Q(etudiant__prenom__icontains=recherche)
            )
        if request.query_params.get('cours'):
            queryset = queryset.filter(cours_id=request.query_params['cours'])
        if request.query_params.get('gestion'):
            queryset = queryset.filter(gestion_id=request.query_params['gestion'])
        if request.query_params.get('faculte'):
            queryset = queryset.filter(etudiant__faculte_id=request.query_params['faculte'])
        if request.query_params.get('promotion'):
            queryset = queryset.filter(etudiant__promotion_id=request.query_params['promotion'])
        if request.query_params.get('evaluation') == 'note':
            queryset = queryset.filter(points_obtenus__isnull=False)
        elif request.query_params.get('evaluation') == 'non_note':
            queryset = queryset.filter(points_obtenus__isnull=True)

        return Response(AppliquerCoursSerializer(queryset, many=True).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='noter-etudiant')
    def noter_etudiant(self, request):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response({'error': 'Compte professeur requis'}, status=status.HTTP_403_FORBIDDEN)

        try:
            application = AppliquerCours.objects.select_related('cours').get(
                pk=request.data.get('application_id'),
                gestion__createur=professeur,
            )
        except AppliquerCours.DoesNotExist:
            return Response({'error': 'Application introuvable'}, status=status.HTTP_404_NOT_FOUND)

        try:
            session = SessionEvaluation.objects.get(
                pk=request.data.get('session_id'),
                est_active=True,
            )
        except SessionEvaluation.DoesNotExist:
            return Response(
                {'session_id': ['Sélectionnez une session active valide.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not session.annee_academique.est_active:
            return Response(
                {'error': 'Cette année académique est clôturée : consultation uniquement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        annee_application = application.gestion.annee_academique_id or application.etudiant.annee_academique_id
        if annee_application and session.annee_academique_id != annee_application:
            return Response(
                {'session_id': ["Cette session ne correspond pas à l'année académique de l'étudiant."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def valeur_optionnelle(nom):
            valeur = request.data.get(nom)
            if valeur in (None, ''):
                return None
            try:
                return Decimal(str(valeur))
            except (InvalidOperation, TypeError):
                raise ValueError(nom)

        try:
            tp = valeur_optionnelle('points_tp')
            interro = valeur_optionnelle('points_interro')
            examen = valeur_optionnelle('points_examen')
        except ValueError as erreur:
            return Response(
                {str(erreur): ['Valeur invalide.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if tp is not None and not 0 <= tp <= 5:
            return Response({'points_tp': ['Le TP doit être compris entre 0 et 5.']}, status=status.HTTP_400_BAD_REQUEST)
        if interro is not None and not 0 <= interro <= 5:
            return Response({'points_interro': ["L'interrogation doit être comprise entre 0 et 5."]}, status=status.HTTP_400_BAD_REQUEST)

        maximum_examen = Decimal(str(application.cours.points))
        if tp is not None:
            maximum_examen -= Decimal('5')
        if interro is not None:
            maximum_examen -= Decimal('5')
        maximum_examen = max(maximum_examen, Decimal('0'))

        if examen is not None and not 0 <= examen <= maximum_examen:
            return Response(
                {'points_examen': [f"L'examen doit être compris entre 0 et {maximum_examen}."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if tp is None and interro is None and examen is None:
            return Response({'error': 'Saisissez au moins une cote.'}, status=status.HTTP_400_BAD_REQUEST)

        total = sum((note for note in (tp, interro, examen) if note is not None), Decimal('0'))
        cotation, _ = CotationSession.objects.get_or_create(
            application=application,
            session=session,
        )
        cotation.points_tp = tp
        cotation.points_interro = interro
        cotation.points_examen = examen
        cotation.observation = request.data.get('observation', '')
        cotation.save()

        application.points_tp = tp
        application.points_interro = interro
        application.points_examen = examen
        application.points_obtenus = total
        application.observation = request.data.get('observation', '')
        application.date_evaluation = timezone.now()
        application.save(update_fields=[
            'points_tp', 'points_interro', 'points_examen',
            'points_obtenus', 'observation', 'date_evaluation',
        ])
        return Response(AppliquerCoursSerializer(application).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='changer-mon-mot-de-passe')
    def changer_mon_mot_de_passe(self, request):
        professeur = self.get_connected_professeur(request)
        if not professeur:
            return Response(
                {'error': 'Ce compte n’est pas lié à un professeur actif'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ancien = serializer.validated_data['ancien_mot_de_passe']
        nouveau = serializer.validated_data['nouveau_mot_de_passe']

        if not check_password(ancien, professeur.mot_de_passe):
            return Response(
                {'error': 'Ancien mot de passe incorrect'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        professeur.mot_de_passe = make_password(nouveau)
        professeur.save()
        return Response({'message': 'Mot de passe modifié avec succès'})
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        serializer = ProfesseurLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            mot_de_passe = serializer.validated_data['mot_de_passe']
            
            try:
                professeur = Professeur.objects.get(email=email, est_actif=True)
            except Professeur.DoesNotExist:
                return Response(
                    {'error': 'Email ou mot de passe incorrect'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Vérifier si le compte est bloqué
            if professeur.bloque_jusqua and professeur.bloque_jusqua > timezone.now():
                return Response(
                    {'error': f'Compte bloqué jusqu\'à {professeur.bloque_jusqua}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Vérifier le mot de passe via le hash stocké
            if not check_password(mot_de_passe, professeur.mot_de_passe):
                professeur.tentative_connexion += 1
                if professeur.tentative_connexion >= 5:
                    professeur.bloque_jusqua = timezone.now() + timedelta(minutes=30)
                professeur.save()
                return Response(
                    {'error': 'Email ou mot de passe incorrect'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Réinitialiser les tentatives
            professeur.tentative_connexion = 0
            professeur.bloque_jusqua = None
            professeur.date_derniere_connexion = timezone.now()
            professeur.save()

            # Associer / créer un User Django si nécessaire, puis authentifier et créer une session
            try:
                user = professeur.user
                if user:
                    # Essayer d'authentifier via le backend Django (username)
                    user_auth = authenticate(request, username=user.username, password=mot_de_passe)
                    if user_auth:
                        django_login(request, user_auth)
                    else:
                        # Si authenticate échoue mais le hash correspond, forcer la connexion
                        if check_password(mot_de_passe, professeur.mot_de_passe):
                            django_login(request, user)
                        else:
                            return Response({'error': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    # Créer un User minimal et lier (le mot_de_passe de Professeur est déjà hashé)
                    from django.contrib.auth.models import User as DjangoUser
                    username = professeur.matricule or (professeur.email or '').split('@')[0]
                    user = DjangoUser.objects.create(username=username, email=professeur.email or '')
                    if professeur.mot_de_passe:
                        user.password = professeur.mot_de_passe
                    else:
                        user.set_unusable_password()
                    user.save()
                    professeur.user = user
                    professeur.save()
                    django_login(request, user)
            except Exception:
                # Ne pas exposer l'erreur interne, mais signaler un problème d'auth
                return Response({'error': 'Erreur lors de l\'authentification'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'professeur': ProfesseurSerializer(professeur).data,
                'session_key': request.session.session_key
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        try:
            django_logout(request)
            return Response({'message': 'Déconnecté avec succès'})
        except Exception:
            return Response({'error': 'Erreur lors de la déconnexion'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdministrativeUser])
    def change_password(self, request, pk=None):
        professeur = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            ancien = serializer.validated_data['ancien_mot_de_passe']
            nouveau = serializer.validated_data['nouveau_mot_de_passe']
            
            if not check_password(ancien, professeur.mot_de_passe):
                return Response(
                    {'error': 'Ancien mot de passe incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            professeur.mot_de_passe = make_password(nouveau)
            professeur.save()
            
            return Response({'message': 'Mot de passe changé avec succès'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        if user and user.is_authenticated and hasattr(user, 'professeur'):
            professeur = user.professeur
            serializer = ProfesseurSerializer(professeur)
            return Response(serializer.data)
        return Response({'error': 'Non authentifié'}, status=status.HTTP_401_UNAUTHORIZED)
    



class JuryViewSet(viewsets.ModelViewSet):
    queryset = DecisionJury.objects.select_related('session', 'etudiant', 'approuve_par')
    serializer_class = DecisionJurySerializer
    permission_classes = [IsAdministrativeUser]

    def _promotion_suivante(self, promotion):
        suivante = Promotion.objects.filter(ordre__gt=promotion.ordre).order_by('ordre', 'id').first()
        if suivante:
            return suivante
        correspondance = re.match(r'^([A-Z]+)\s*(\d+)$', (promotion.code or promotion.nom or '').upper())
        if correspondance:
            prefixe, niveau = correspondance.groups()
            suivante = Promotion.objects.filter(
                Q(code__iexact=f'{prefixe}{int(niveau) + 1}')
                | Q(nom__iexact=f'{prefixe}{int(niveau) + 1}')
            ).first()
        return suivante

    def _sessions_consolidees(self, session):
        if not session.est_cloture:
            return SessionEvaluation.objects.filter(pk=session.pk)
        explicites = session.sessions_incluses.all()
        if explicites.exists():
            return explicites.filter(annee_academique=session.annee_academique)
        return SessionEvaluation.objects.filter(
            annee_academique=session.annee_academique,
            date_debut__lte=session.date_fin,
            est_cloture=False,
        ).exclude(pk=session.pk)

    def _consolidation(self, etudiant, session):
        cotations = CotationSession.objects.filter(
            application__etudiant=etudiant,
            session__in=self._sessions_consolidees(session),
        ).select_related('application__cours', 'session').order_by('application__cours_id', '-total')
        meilleures = {}
        for cotation in cotations:
            cours = cotation.application.cours
            precedente = meilleures.get(cours.pk)
            if precedente is None or cotation.total > precedente.total:
                meilleures[cours.pk] = cotation
        resultats = []
        for cotation in meilleures.values():
            cours = cotation.application.cours
            maximum = float(cours.points or 0)
            total = float(cotation.total)
            resultats.append({
                'cours_id': cours.pk,
                'cours_nom': cours.nom_cours,
                'maximum': maximum,
                'credit': float(cours.credit or 0),
                'ponderation': float(cours.ponderation or 0),
                'total': total,
                'points_tp': float(cotation.points_tp) if cotation.points_tp is not None else None,
                'points_interro': float(cotation.points_interro) if cotation.points_interro is not None else None,
                'points_examen': float(cotation.points_examen) if cotation.points_examen is not None else None,
                'observation': cotation.observation,
                'reussi': total >= maximum / 2 if maximum else False,
                'session_id': cotation.session_id,
                'session_nom': cotation.session.nom,
                'cotation_id': cotation.pk,
            })
        resultats.sort(key=lambda item: item['cours_nom'])
        return resultats

    def _etudiants(self, request, session):
        annee = session.annee_academique
        queryset = Etudiant.objects.filter(
            est_actif=True,
            inscriptions_academiques__annee_academique=annee,
            inscriptions_academiques__date_inscription__gte=annee.date_debut,
            inscriptions_academiques__date_inscription__lte=annee.date_fin,
        ).select_related('faculte', 'departement', 'promotion').distinct()
        for champ in ('faculte', 'departement', 'promotion'):
            valeur = request.data.get(champ) or request.query_params.get(champ)
            if valeur:
                queryset = queryset.filter(**{f'inscriptions_academiques__{champ}_id': valeur})
        return queryset

    @action(detail=False, methods=['get'])
    def contexte(self, request):
        sessions = SessionEvaluation.objects.select_related('annee_academique').all()
        etudiants = []
        if request.query_params.get('session'):
            try:
                session = sessions.get(pk=request.query_params['session'])
                queryset = self._etudiants(request, session)
                decisions = {item.etudiant_id: item for item in DecisionJury.objects.filter(session=session, etudiant__in=queryset)}
                etudiants = []
                for item in queryset:
                    consolidation = self._consolidation(item, session)
                    etudiants.append({
                        **EtudiantSerializer(item).data,
                        'jury': DecisionJurySerializer(decisions[item.id]).data if item.id in decisions else None,
                        'consolidation': consolidation,
                        'cours_reussis': sum(1 for note in consolidation if note['reussi']),
                        'cours_echoues': sum(1 for note in consolidation if not note['reussi']),
                    })
            except SessionEvaluation.DoesNotExist:
                pass
        return Response({
            'annees': AnneeAcademiqueSerializer(AnneeAcademique.objects.all(), many=True).data,
            'sessions': SessionEvaluationSerializer(sessions, many=True).data,
            'facultes': list(Faculte.objects.values('id', 'nom')),
            'departements': list(Departement.objects.filter(est_actif=True).values('id', 'nom', 'faculte_id')),
            'promotions': list(Promotion.objects.values('id', 'nom')),
            'promotions_en_attente': list(PromotionEnAttente.objects.filter(
                statut__in=['EN_ATTENTE', 'BLOQUE'],
            ).select_related(
                'inscription_origine__etudiant', 'inscription_origine__promotion',
                'inscription_origine__annee_academique', 'promotion_cible', 'annee_cible',
            ).values(
                'id', 'statut', 'message', 'inscription_origine__etudiant__matricule',
                'inscription_origine__etudiant__nom', 'inscription_origine__etudiant__prenom',
                'inscription_origine__promotion__nom', 'inscription_origine__annee_academique__nom',
                'promotion_cible__nom', 'annee_cible__nom',
            )),
            'etudiants': etudiants,
        })

    @action(detail=False, methods=['post'])
    def publier(self, request):
        try:
            session = SessionEvaluation.objects.get(pk=request.data.get('session_id'))
        except SessionEvaluation.DoesNotExist:
            return Response({'session_id': ['Session invalide.']}, status=status.HTTP_400_BAD_REQUEST)
        if not session.annee_academique.est_active:
            return Response({'error': 'Cette année académique est clôturée : consultation uniquement.'}, status=status.HTTP_403_FORBIDDEN)
        queryset = self._etudiants(request, session)
        if request.data.get('etudiant_ids'):
            queryset = queryset.filter(pk__in=request.data['etudiant_ids'])
        nombre = queryset.count()
        mode = 'INDIVIDUEL' if nombre == 1 else 'COLLECTIF'
        decision_choisie = request.data.get('decision', 'EN_ATTENTE')
        with transaction.atomic():
            for etudiant in queryset:
                decision_jury, _ = DecisionJury.objects.update_or_create(session=session, etudiant=etudiant, defaults={
                    'decision': decision_choisie, 'resultats_publies': True,
                    'mode_approbation': mode, 'approuve_par': request.user,
                    'date_approbation': timezone.now(), 'observation': request.data.get('observation', ''),
                })
                if session.est_cloture:
                    inscription = InscriptionAcademique.objects.filter(
                        etudiant=etudiant, annee_academique=session.annee_academique,
                    ).first()
                    if not inscription:
                        continue
                    if decision_choisie == 'ADMIS':
                        inscription.statut = 'ADMIS'
                        inscription.save(update_fields=['statut', 'date_modification'])
                        promotion_suivante = self._promotion_suivante(inscription.promotion)
                        annee_cible = AnneeAcademique.objects.filter(est_active=True).exclude(pk=session.annee_academique_id).first()
                        PromotionEnAttente.objects.update_or_create(
                            inscription_origine=inscription,
                            defaults={
                                'decision': decision_jury,
                                'inscription_origine': inscription,
                                'promotion_cible': promotion_suivante,
                                'annee_cible': annee_cible,
                                'statut': 'EN_ATTENTE' if promotion_suivante else 'BLOQUE',
                                'message': '' if promotion_suivante else 'Aucun niveau supérieur configuré.',
                            },
                        )
                    elif decision_choisie in ('AJOURNE', 'NON_ADMIS'):
                        inscription.statut = 'AJOURNE'
                        inscription.save(update_fields=['statut', 'date_modification'])
                        PromotionEnAttente.objects.filter(inscription_origine=inscription, statut__in=['EN_ATTENTE', 'BLOQUE']).delete()
        return Response({'message': f'{nombre} résultat(s) publié(s).', 'nombre': nombre})

    @action(detail=False, methods=['post'], url_path='creer-cloture')
    def creer_cloture(self, request):
        try:
            annee = AnneeAcademique.objects.get(pk=request.data.get('annee_academique_id'), est_active=True)
        except AnneeAcademique.DoesNotExist:
            return Response({'annee_academique_id': ['Année active invalide.']}, status=status.HTTP_400_BAD_REQUEST)
        nom = str(request.data.get('nom') or '').strip()
        if not nom:
            return Response({'nom': ['Le nom de la session de clôture est requis.']}, status=status.HTTP_400_BAD_REQUEST)
        session = SessionEvaluation.objects.create(
            nom=nom, annee_academique=annee,
            date_debut=request.data.get('date_debut') or timezone.localdate(),
            date_fin=request.data.get('date_fin') or timezone.localdate(),
            description=request.data.get('description', ''), est_active=True, est_cloture=True,
        )
        sources = SessionEvaluation.objects.filter(
            pk__in=request.data.get('session_ids') or [], annee_academique=annee, est_cloture=False,
        )
        if sources.exists():
            session.sessions_incluses.set(sources)
        return Response(SessionEvaluationSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def promouvoir(self, request):
        queryset = PromotionEnAttente.objects.filter(statut__in=['EN_ATTENTE', 'BLOQUE']).select_related(
            'inscription_origine__etudiant', 'inscription_origine__faculte',
            'inscription_origine__departement', 'promotion_cible',
        )
        ids = request.data.get('promotion_ids') or []
        if ids:
            queryset = queryset.filter(pk__in=ids)
        annee_id = request.data.get('annee_cible_id')
        try:
            annee_cible = AnneeAcademique.objects.get(pk=annee_id) if annee_id else AnneeAcademique.get_annee_active()
        except AnneeAcademique.DoesNotExist:
            annee_cible = None
        if not annee_cible:
            return Response({'error': "Créez et activez d'abord la nouvelle année académique."}, status=status.HTTP_400_BAD_REQUEST)
        if not annee_cible.est_active:
            if request.data.get('activer_annee') is True:
                annee_cible.est_active = True
                annee_cible.save(update_fields=['est_active'])
            else:
                return Response(
                    {'error': "L'année cible doit être active avant la promotion."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if not queryset.exclude(inscription_origine__annee_academique=annee_cible).exists():
            return Response({'error': "L'année active est encore l'année d'origine. Activez d'abord la nouvelle année académique."}, status=status.HTTP_400_BAD_REQUEST)
        promus, bloques = 0, 0
        with transaction.atomic():
            for attente in queryset:
                origine = attente.inscription_origine
                promotion_cible = attente.promotion_cible or self._promotion_suivante(origine.promotion)
                if annee_cible.pk == origine.annee_academique_id or not promotion_cible:
                    attente.statut = 'BLOQUE'
                    attente.message = 'Nouvelle année distincte ou niveau supérieur indisponible.'
                    attente.save(update_fields=['statut', 'message'])
                    bloques += 1
                    continue
                etudiant = origine.etudiant
                origine.est_courante = False
                origine.save(update_fields=['est_courante', 'date_modification'])
                etudiant.annee_academique = annee_cible
                etudiant.faculte = origine.faculte
                etudiant.departement = origine.departement
                etudiant.promotion = promotion_cible
                etudiant.save()
                nouvelle = InscriptionAcademique.objects.get(etudiant=etudiant, annee_academique=annee_cible)
                attente.annee_cible = annee_cible
                attente.promotion_cible = promotion_cible
                attente.inscription_creee = nouvelle
                attente.statut = 'PROMU'
                attente.message = 'Réinscription créée automatiquement.'
                attente.date_traitement = timezone.now()
                attente.save()
                promus += 1
        return Response({'message': f'{promus} étudiant(s) promu(s), {bloques} bloqué(s).', 'promus': promus, 'bloques': bloques})

    @action(detail=True, methods=['post'])
    def retirer(self, request, pk=None):
        decision = self.get_object()
        decision.resultats_publies = False
        decision.save(update_fields=['resultats_publies'])
        return Response({'message': 'Publication retirée.'})

    @action(detail=False, methods=['post'])
    def visibilite(self, request):
        try:
            session = SessionEvaluation.objects.get(pk=request.data.get('session_id'))
        except SessionEvaluation.DoesNotExist:
            return Response({'session_id': ['Session invalide.']}, status=status.HTTP_400_BAD_REQUEST)
        if not session.annee_academique.est_active:
            return Response({'error': 'Cette année académique est clôturée : consultation uniquement.'}, status=status.HTTP_403_FORBIDDEN)

        etudiant_ids = request.data.get('etudiant_ids') or []
        if not etudiant_ids:
            return Response(
                {'etudiant_ids': ['Sélectionnez au moins un étudiant.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        publier = request.data.get('resultats_publies')
        if not isinstance(publier, bool):
            return Response(
                {'resultats_publies': ['Cette valeur doit être un booléen.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        etudiants = self._etudiants(request, session).filter(pk__in=etudiant_ids)
        decisions = DecisionJury.objects.filter(session=session, etudiant__in=etudiants)
        nombre = decisions.update(resultats_publies=publier)
        action_message = 'démasqué(s)' if publier else 'masqué(s)'
        return Response({
            'message': f'{nombre} résultat(s) {action_message}.',
            'nombre': nombre,
        })


# ==================== COURS ====================
class CoursViewSet(viewsets.ModelViewSet):
    queryset = Cours.objects.all()
    serializer_class = CoursSerializer
    #permission_classes = [IsAuthenticated]
    permission_classes = [IsAdministrativeUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        responsable = self.request.query_params.get('responsable')
        search = self.request.query_params.get('search')
        
        if responsable:
            queryset = queryset.filter(responsable_id=responsable)
        if search:
            queryset = queryset.filter(nom_cours__icontains=search)
        
        return queryset


# ==================== GESTION APPLICATION COURS ====================
class GestionApplicationCoursViewSet(viewsets.ModelViewSet):
    queryset = GestionApplicationCours.objects.all()
    #permission_classes = [IsAuthenticated]
    permission_classes = [IsAdministrativeUser]
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return GestionApplicationCoursSimpleSerializer
        return GestionApplicationCoursSerializer

    def perform_create(self, serializer):
        annee = serializer.validated_data.get('annee_academique') or AnneeAcademique.get_annee_active()
        if not annee or not annee.est_active:
            raise PermissionDenied('Cette année académique est clôturée : consultation uniquement.')
        if not annee.date_debut <= timezone.localdate() <= annee.date_fin:
            raise PermissionDenied("La date actuelle est hors de la période de l'année active.")
        serializer.save(annee_academique=annee)

    def perform_update(self, serializer):
        annee = serializer.validated_data.get('annee_academique', serializer.instance.annee_academique)
        if not annee or not annee.est_active:
            raise PermissionDenied('Cette année académique est clôturée : consultation uniquement.')
        serializer.save()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        createur = self.request.query_params.get('createur')
        cours = self.request.query_params.get('cours')
        faculte = self.request.query_params.get('faculte')
        promotion = self.request.query_params.get('promotion')
        annee_academique = self.request.query_params.get('annee_academique')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        
        annee = AnneeAcademique.objects.filter(pk=annee_academique).first() if annee_academique else AnneeAcademique.get_annee_active()
        if annee_academique and not annee:
            return queryset.none()
        if annee:
            queryset = queryset.filter(
                annee_academique=annee,
                date_creation__date__gte=annee.date_debut,
                date_creation__date__lte=annee.date_fin,
            )
        
        if createur:
            queryset = queryset.filter(createur_id=createur)
        if cours:
            queryset = queryset.filter(cours_id=cours)
        if faculte:
            queryset = queryset.filter(faculte_id=faculte)
        if promotion:
            queryset = queryset.filter(promotion_id=promotion)
        # Filtrage par date de création
        if date_debut:
            queryset = queryset.filter(date_creation__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_creation__lte=date_fin)
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdministrativeUser])
    def reapply(self, request, pk=None):
        """Réappliquer le cours aux étudiants (utile si des étudiants ont été ajoutés)"""
        gestion = self.get_object()
        gestion.appliquer_aux_etudiants()
        return Response({'message': 'Cours réappliqué avec succès'})
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAdministrativeUser])
    def delete_all_applications(self, request, pk=None):
        """Supprimer toutes les applications individuelles de cette gestion"""
        gestion = self.get_object()
        nombre = gestion.applications_individuelles.count()
        gestion.applications_individuelles.all().delete()
        return Response({
            'message': f'{nombre} applications supprimées avec succès'
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdministrativeUser])
    def by_period(self, request):
        """Récupérer les gestions par période (date_debut, date_fin)"""
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        
        queryset = self.get_queryset()
        
        if date_debut:
            queryset = queryset.filter(date_creation__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_creation__lte=date_fin)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ==================== APPLIQUER COURS ====================
class AppliquerCoursViewSet(viewsets.ModelViewSet):
    queryset = AppliquerCours.objects.all()
    serializer_class = AppliquerCoursSerializer
    #permission_classes = [IsAuthenticated]
    permission_classes = [IsAdministrativeUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        etudiant = self.request.query_params.get('etudiant')
        gestion = self.request.query_params.get('gestion')
        cours = self.request.query_params.get('cours')
        est_actif = self.request.query_params.get('est_actif')
        annee_academique = self.request.query_params.get('annee_academique')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        
        if etudiant:
            queryset = queryset.filter(etudiant_id=etudiant)
        if gestion:
            queryset = queryset.filter(gestion_id=gestion)
        if cours:
            queryset = queryset.filter(cours_id=cours)
        if est_actif is not None:
            queryset = queryset.filter(est_actif=est_actif.lower() == 'true')

        annee = AnneeAcademique.objects.filter(pk=annee_academique).first() if annee_academique else AnneeAcademique.get_annee_active()
        if annee_academique and not annee:
            return queryset.none()
        if annee:
            queryset = queryset.filter(
                gestion__annee_academique=annee,
                date_application__date__gte=annee.date_debut,
                date_application__date__lte=annee.date_fin,
            )
        
        # Filtrage par date d'application
        if date_debut:
            queryset = queryset.filter(date_application__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_application__lte=date_fin)
        
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdministrativeUser])
    def by_etudiant(self, request):
        """Récupérer les cours d'un étudiant pour l'année demandée ou active."""
        etudiant_id = request.query_params.get('etudiant_id')
        if not etudiant_id:
            return Response(
                {'error': 'etudiant_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(etudiant_id=etudiant_id, est_actif=True)
        
        annee_id = request.query_params.get('annee_academique')
        annee = AnneeAcademique.objects.filter(pk=annee_id).first() if annee_id else AnneeAcademique.get_annee_active()
        if annee:
            queryset = queryset.filter(
                date_application__date__gte=annee.date_debut,
                date_application__date__lte=annee.date_fin,
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdministrativeUser])
    def apply_to_etudiant(self, request):
        """Appliquer un cours à un étudiant individuellement"""
        gestion_id = request.data.get('gestion_id')
        etudiant_id = request.data.get('etudiant_id')
        
        if not gestion_id or not etudiant_id:
            return Response(
                {'error': 'gestion_id et etudiant_id sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            gestion = GestionApplicationCours.objects.get(id=gestion_id)
            etudiant = Etudiant.objects.get(id=etudiant_id)

            annee = gestion.annee_academique
            if not annee or not annee.est_active:
                return Response({'error': 'Cette année académique est clôturée : consultation uniquement.'}, status=status.HTTP_403_FORBIDDEN)
            inscription = InscriptionAcademique.objects.filter(etudiant=etudiant, annee_academique=annee).first()
            if not inscription:
                return Response({'error': "Cet étudiant n'appartient pas à l'année du plan d'application."}, status=status.HTTP_400_BAD_REQUEST)
            if gestion.faculte_id and inscription.faculte_id != gestion.faculte_id:
                return Response({'error': "Cet étudiant n'appartient pas à la faculté ciblée."}, status=status.HTTP_400_BAD_REQUEST)
            if gestion.promotion_id and inscription.promotion_id != gestion.promotion_id:
                return Response({'error': "Cet étudiant n'appartient pas à la promotion ciblée."}, status=status.HTTP_400_BAD_REQUEST)
            if False and (etudiant.annee_academique_id != annee.id or not annee.date_debut <= etudiant.date_inscription <= annee.date_fin):
                return Response({'error': "Cet étudiant n'appartient pas à l'année et à la période du plan d'application."}, status=status.HTTP_400_BAD_REQUEST)
            
            application, created = AppliquerCours.objects.get_or_create(
                gestion=gestion,
                etudiant=etudiant,
                cours=gestion.cours
            )
            
            if created:
                return Response(
                    {'message': 'Cours appliqué avec succès'},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'message': 'Cours déjà appliqué'},
                    status=status.HTTP_200_OK
                )
        except GestionApplicationCours.DoesNotExist:
            return Response(
                {'error': 'Gestion non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Etudiant.DoesNotExist:
            return Response(
                {'error': 'Étudiant non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdministrativeUser])
    def toggle_active(self, request, pk=None):
        """Activer/désactiver une application de cours"""
        application = self.get_object()
        application.est_actif = not application.est_actif
        application.save()
        return Response({
            'message': f'Application {"activée" if application.est_actif else "désactivée"}',
            'est_actif': application.est_actif
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdministrativeUser])
    def by_period(self, request):
        """Récupérer les applications par période"""
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        etudiant = request.query_params.get('etudiant')
        
        queryset = self.get_queryset()
        
        if etudiant:
            queryset = queryset.filter(etudiant_id=etudiant)
        if date_debut:
            queryset = queryset.filter(date_application__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_application__lte=date_fin)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
