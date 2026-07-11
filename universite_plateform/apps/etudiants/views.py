from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from .models import AnneeAcademique, Faculte, Departement, Promotion, Etudiant, InscriptionAcademique
from .serializers import (
    AnneeAcademiqueSerializer, FaculteSerializer, DepartementSerializer,
    PromotionSerializer, EtudiantSerializer, EtudiantLoginSerializer,
    EtudiantProfileUpdateSerializer, InscriptionAcademiqueSerializer
)


def get_authenticated_etudiant(request):
    """Valider le JWT étudiant sans le mélanger avec les comptes Django."""
    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer '):
        return None

    try:
        token = AccessToken(authorization.split(' ', 1)[1])
        etudiant_id = token.get('student_id')
        if not etudiant_id or token.get('account_type') != 'etudiant':
            return None
        return Etudiant.objects.select_related(
            'faculte', 'departement', 'promotion', 'annee_academique'
        ).get(pk=etudiant_id, est_actif=True)
    except (TokenError, Etudiant.DoesNotExist):
        return None

class AnneeAcademiqueViewSet(viewsets.ModelViewSet):
    queryset = AnneeAcademique.objects.all()
    serializer_class = AnneeAcademiqueSerializer
    permission_classes = [AllowAny ]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Récupérer l'année académique active"""
        annee = AnneeAcademique.get_annee_active()
        if annee:
            serializer = self.get_serializer(annee)
            return Response(serializer.data)
        return Response({'message': 'Aucune année active'}, status=404)
    
    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Définir une année comme active"""
        annee = self.get_object()
        annee.est_active = True
        annee.save()
        return Response({'message': f'{annee.nom} est maintenant active'})

class FaculteViewSet(viewsets.ModelViewSet):
    queryset = Faculte.objects.all()
    serializer_class = FaculteSerializer
    permission_classes = [AllowAny]

class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [AllowAny]

class DepartementViewSet(viewsets.ModelViewSet):
    serializer_class = DepartementSerializer
    permission_classes = [AllowAny]
    def get_queryset(self):
        queryset = Departement.objects.filter(est_actif=True).select_related('faculte')
        if self.request.query_params.get('faculte'):
            queryset = queryset.filter(faculte_id=self.request.query_params['faculte'])
        return queryset

class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.all()
    serializer_class = EtudiantSerializer
    permission_classes = [AllowAny]

    def _annee_demandee(self, param_name='annee_academique'):
        annee_id = self.request.query_params.get(param_name)
        if not annee_id and param_name != 'annee_academique':
            annee_id = self.request.query_params.get('annee_academique')
        if annee_id:
            return AnneeAcademique.objects.filter(pk=annee_id).first()
        return AnneeAcademique.get_annee_active()

    def _inscriptions_pour_annee(self, annee):
        if not annee:
            return InscriptionAcademique.objects.none()
        return InscriptionAcademique.objects.filter(
            annee_academique=annee,
        ).select_related(
            'annee_academique', 'faculte', 'departement', 'promotion',
            'etudiant', 'etudiant__faculte', 'etudiant__departement',
            'etudiant__promotion', 'etudiant__annee_academique',
        ).order_by('etudiant__nom', 'etudiant__post_nom', 'etudiant__prenom')

    def _inscriptions_affichables(self, annee):
        inscriptions = list(self._inscriptions_pour_annee(annee))
        if not annee or not annee.est_active:
            return inscriptions

        etudiants_deja_presents = {inscription.etudiant_id for inscription in inscriptions}
        etudiants_sans_historique = Etudiant.objects.filter(
            annee_academique=annee,
        ).exclude(pk__in=etudiants_deja_presents).select_related(
            'faculte', 'departement', 'promotion', 'annee_academique',
        )
        for etudiant in etudiants_sans_historique:
            inscriptions.append(InscriptionAcademique(
                etudiant=etudiant,
                annee_academique=annee,
                faculte=etudiant.faculte,
                departement=etudiant.departement,
                promotion=etudiant.promotion,
                statut='INSCRIT',
                est_courante=True,
                date_inscription=etudiant.date_inscription,
            ))

        return sorted(
            inscriptions,
            key=lambda inscription: (
                inscription.etudiant.nom or '',
                inscription.etudiant.post_nom or '',
                inscription.etudiant.prenom or '',
            ),
        )

    def _reponse_inscriptions(self, inscriptions, annee):
        inscriptions = list(inscriptions)
        etudiants = [inscription.etudiant for inscription in inscriptions]
        serializer = self.get_serializer(
            etudiants,
            many=True,
            context={**self.get_serializer_context(), 'annee_academique_id': annee.pk if annee else None},
        )
        donnees = list(serializer.data)
        inscriptions_par_etudiant = {inscription.etudiant_id: inscription for inscription in inscriptions}
        for ligne in donnees:
            inscription = inscriptions_par_etudiant.get(ligne['id'])
            if not inscription:
                continue
            ligne['faculte'] = inscription.faculte_id
            ligne['faculte_nom'] = inscription.faculte.nom if inscription.faculte_id else None
            ligne['departement'] = inscription.departement_id
            ligne['departement_nom'] = inscription.departement.nom if inscription.departement_id else None
            ligne['promotion'] = inscription.promotion_id
            ligne['promotion_nom'] = inscription.promotion.nom if inscription.promotion_id else None
            ligne['annee_academique'] = inscription.annee_academique_id
            ligne['annee_academique_nom'] = inscription.annee_academique.nom
            ligne['inscription_academique_id'] = inscription.pk
            ligne['inscription_statut'] = inscription.statut
            ligne['inscription_est_courante'] = inscription.est_courante
        return Response(donnees)

    def _verifier_modification_autorisee(self, etudiant):
        if not etudiant.annee_academique or not etudiant.annee_academique.est_active:
            raise PermissionDenied("Cette année académique est clôturée : consultation uniquement.")

    def update(self, request, *args, **kwargs):
        self._verifier_modification_autorisee(self.get_object())
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._verifier_modification_autorisee(self.get_object())
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._verifier_modification_autorisee(self.get_object())
        return super().destroy(request, *args, **kwargs)

    @action(
        detail=False,
        methods=['post'],
        url_path='inscription',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def inscription(self, request):
        if len(request.data.get('mot_de_passe', '')) < 8:
            return Response(
                {'mot_de_passe': ['Le mot de passe doit contenir au moins 8 caractères.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        annee_active = AnneeAcademique.get_annee_active()
        if not annee_active:
            return Response(
                {'annee_academique': ['Aucune année académique active n’est configurée.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prochain_numero = (
            Etudiant.objects.order_by('-id').values_list('id', flat=True).first() or 0
        ) + 1
        matricule = f'ETU-{annee_active.date_debut.year}-{prochain_numero:06d}'
        while Etudiant.objects.filter(matricule=matricule).exists():
            prochain_numero += 1
            matricule = f'ETU-{annee_active.date_debut.year}-{prochain_numero:06d}'

        donnees = request.data.copy()
        donnees['matricule'] = matricule
        donnees['annee_academique'] = annee_active.pk

        serializer = EtudiantSerializer(data=donnees)
        serializer.is_valid(raise_exception=True)
        etudiant = serializer.save(
            utilisateur=None,
            matricule=matricule,
            annee_academique=annee_active,
            statut_frais='IMPAYE',
            est_actif=True,
        )
        return Response(
            {
                'message': 'Inscription étudiante enregistrée avec succès.',
                'etudiant': EtudiantSerializer(etudiant).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=['post'],
        url_path='login',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def login_etudiant(self, request):
        serializer = EtudiantLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        matricule = serializer.validated_data['matricule'].strip()
        mot_de_passe = serializer.validated_data['mot_de_passe']

        try:
            etudiant = Etudiant.objects.select_related(
                'faculte', 'promotion', 'annee_academique'
            ).get(matricule__iexact=matricule, est_actif=True)
        except Etudiant.DoesNotExist:
            return Response(
                {'error': 'Matricule ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not etudiant.mot_de_passe or not check_password(mot_de_passe, etudiant.mot_de_passe):
            return Response(
                {'error': 'Matricule ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken()
        refresh['student_id'] = etudiant.pk
        refresh['account_type'] = 'etudiant'

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'etudiant': EtudiantSerializer(etudiant, context={'request': request}).data,
        })

    @action(
        detail=False,
        methods=['get', 'patch'],
        url_path='mon-profil',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def mon_profil(self, request):
        etudiant = get_authenticated_etudiant(request)
        if not etudiant:
            return Response(
                {'error': 'Session étudiant invalide ou expirée'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if request.method == 'PATCH':
            serializer = EtudiantProfileUpdateSerializer(
                etudiant,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            etudiant.refresh_from_db()

        return Response(
            EtudiantSerializer(etudiant, context={'request': request}).data
        )

    @action(
        detail=False,
        methods=['post'],
        url_path='changer-mot-de-passe',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def changer_mot_de_passe(self, request):
        etudiant = get_authenticated_etudiant(request)
        if not etudiant:
            return Response({'error': 'Session étudiant invalide ou expirée'}, status=status.HTTP_401_UNAUTHORIZED)

        ancien = request.data.get('ancien_mot_de_passe', '')
        nouveau = request.data.get('nouveau_mot_de_passe', '')
        confirmation = request.data.get('confirmer_mot_de_passe', '')
        if not etudiant.mot_de_passe or not check_password(ancien, etudiant.mot_de_passe):
            return Response({'ancien_mot_de_passe': ['Le mot de passe actuel est incorrect.']}, status=status.HTTP_400_BAD_REQUEST)
        if len(nouveau) < 8:
            return Response({'nouveau_mot_de_passe': ['Le nouveau mot de passe doit contenir au moins 8 caractères.']}, status=status.HTTP_400_BAD_REQUEST)
        if nouveau != confirmation:
            return Response({'confirmer_mot_de_passe': ['Les mots de passe ne correspondent pas.']}, status=status.HTTP_400_BAD_REQUEST)
        if check_password(nouveau, etudiant.mot_de_passe):
            return Response({'nouveau_mot_de_passe': ["Le nouveau mot de passe doit être différent de l'ancien."]}, status=status.HTTP_400_BAD_REQUEST)

        etudiant.mot_de_passe = make_password(nouveau)
        etudiant.save(update_fields=['mot_de_passe', 'date_modification'])
        return Response({'message': 'Mot de passe modifié avec succès.'})

    @action(
        detail=False,
        methods=['get'],
        url_path='mon-espace',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def mon_espace(self, request):
        """Cours, notes et situation financière de l'étudiant connecté."""
        etudiant = get_authenticated_etudiant(request)
        if not etudiant:
            return Response(
                {'error': 'Session étudiant invalide ou expirée'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        from django.db.models import Prefetch, Sum
        from apps.enseignements.models import CotationSession, DecisionJury, SessionEvaluation
        from apps.enseignements.serializers import (
            AppliquerCoursSerializer,
            SessionEvaluationSerializer,
        )
        from apps.frais_academique.models import Paiement
        from apps.frais_academique.serializers import (
            FraisAcademiqueSerializer,
            PaiementSerializer,
        )

        annee_id = request.query_params.get('annee_academique')
        inscriptions = InscriptionAcademique.objects.filter(etudiant=etudiant).select_related(
            'annee_academique', 'faculte', 'departement', 'promotion'
        )
        if annee_id:
            inscription = inscriptions.filter(annee_academique_id=annee_id).first()
            if not inscription:
                return Response(
                    {'annee_academique': ["Vous n'avez aucune inscription pour cette année académique."]},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            inscription = inscriptions.filter(annee_academique__est_active=True).first()
            if not inscription:
                inscription = inscriptions.filter(est_courante=True).first() or inscriptions.first()
        annee = inscription.annee_academique if inscription else None
        sessions_publiees = set(DecisionJury.objects.filter(
            etudiant=etudiant,
            resultats_publies=True,
            session__annee_academique=annee,
        ).values_list('session_id', flat=True))
        cours = etudiant.cours_appliques.select_related(
            'cours', 'cours__responsable', 'gestion'
        ).prefetch_related(Prefetch(
            'cotations',
            queryset=CotationSession.objects.filter(session_id__in=sessions_publiees).select_related('session'),
        )).filter(est_actif=True).order_by('cours__nom_cours')
        frais = etudiant.frais_academiques.select_related(
            'type_frais', 'annee_academique', 'faculte', 'promotion'
        )
        if annee:
            cours = cours.filter(
                gestion__annee_academique=annee,
                date_application__date__gte=annee.date_debut,
                date_application__date__lte=annee.date_fin,
            )
            frais = frais.filter(
                annee_academique=annee,
                date_creation__date__gte=annee.date_debut,
                date_creation__date__lte=annee.date_fin,
            )
        paiements = Paiement.objects.select_related(
            'frais', 'etudiant', 'agent'
        ).filter(etudiant=etudiant).order_by('-date_paiement')
        if annee:
            paiements = paiements.filter(
                frais__annee_academique=annee,
                date_paiement__gte=annee.date_debut,
                date_paiement__lte=annee.date_fin,
            )

        total_du = frais.aggregate(total=Sum('montant_total'))['total'] or 0
        total_paye = paiements.filter(statut='valide').aggregate(
            total=Sum('montant_paye')
        )['total'] or 0

        sessions_queryset = SessionEvaluation.objects.filter(
            annee_academique=annee,
            date_debut__gte=annee.date_debut,
            date_fin__lte=annee.date_fin,
        ).prefetch_related('sessions_incluses').order_by('-est_active', '-date_debut') if annee else SessionEvaluation.objects.none()
        sessions_objets = list(sessions_queryset)
        sessions_etudiant = SessionEvaluationSerializer(sessions_objets, many=True).data
        sessions_par_id = {session.pk: session for session in sessions_objets}
        for session_data in sessions_etudiant:
            session_data['resultats_publies'] = session_data['id'] in sessions_publiees
            session = sessions_par_id[session_data['id']]
            session_data['resultats_consolides'] = []
            if session.est_cloture and session_data['resultats_publies']:
                sources = session.sessions_incluses.all()
                if not sources.exists():
                    sources = SessionEvaluation.objects.filter(
                        annee_academique=annee,
                        date_debut__lte=session.date_fin,
                        est_cloture=False,
                    )
                meilleures = {}
                cotations = CotationSession.objects.filter(
                    application__etudiant=etudiant,
                    session__in=sources,
                ).select_related('application__cours', 'session')
                for cotation in cotations:
                    cours_id = cotation.application.cours_id
                    if cours_id not in meilleures or cotation.total > meilleures[cours_id].total:
                        meilleures[cours_id] = cotation
                session_data['resultats_consolides'] = [{
                    'cours_id': note.application.cours_id,
                    'points_tp': note.points_tp,
                    'points_interro': note.points_interro,
                    'points_examen': note.points_examen,
                    'total': note.total,
                    'observation': note.observation,
                    'session_source_nom': note.session.nom,
                } for note in meilleures.values()]

        return Response({
            'annee_academique': AnneeAcademiqueSerializer(annee).data if annee else None,
            'inscription_academique': InscriptionAcademiqueSerializer(inscription).data if inscription else None,
            'etudiant': EtudiantSerializer(
                etudiant,
                context={'request': request},
            ).data,
            'cours': AppliquerCoursSerializer(cours, many=True).data,
            'sessions': sessions_etudiant,
            'frais': FraisAcademiqueSerializer(frais, many=True).data,
            'paiements': PaiementSerializer(paiements, many=True).data,
            'resume_financier': {
                'total_du': total_du,
                'total_paye': total_paye,
                'solde': max(total_du - total_paye, 0),
            },
        })
    
    def get_queryset(self):
        """Queryset courant, utilisé surtout pour consulter/modifier un dossier."""
        return Etudiant.objects.select_related(
            'faculte', 'departement', 'promotion', 'annee_academique'
        ).all()

    def list(self, request, *args, **kwargs):
        """Afficher les étudiants selon leur inscription dans l'année demandée."""
        annee = self._annee_demandee()
        if not annee:
            return Response([])
        return self._reponse_inscriptions(self._inscriptions_affichables(annee), annee)
    
    def perform_create(self, serializer):
        # Si pas d'année spécifiée, prendre l'année active
        if not self.request.data.get('annee_academique'):
            annee_active = AnneeAcademique.get_annee_active()
            serializer.save(
                utilisateur=self.request.user if self.request.user.is_authenticated else None,
                annee_academique=annee_active
            )
        else:
            serializer.save(utilisateur=self.request.user if self.request.user.is_authenticated else None)
    
    @action(detail=False, methods=['get'])
    def rechercher(self, request):
        """Rechercher des étudiants par matricule ou nom"""
        q = request.query_params.get('q', '')
        recherche = q.lower()
        annee = self._annee_demandee()
        inscriptions = [
            inscription for inscription in self._inscriptions_affichables(annee)
            if recherche in ' '.join([
                inscription.etudiant.matricule or '',
                inscription.etudiant.nom or '',
                inscription.etudiant.prenom or '',
                inscription.etudiant.post_nom or '',
                inscription.etudiant.email or '',
                inscription.etudiant.telephone or '',
            ]).lower()
        ]
        return self._reponse_inscriptions(inscriptions, annee)
    
    @action(detail=False, methods=['get'])
    def par_faculte(self, request):
        """Filtrer les étudiants par faculté"""
        faculte_id = request.query_params.get('faculte_id')
        if faculte_id:
            annee = self._annee_demandee()
            inscriptions = [
                inscription for inscription in self._inscriptions_affichables(annee)
                if str(inscription.faculte_id) == str(faculte_id)
            ]
            return self._reponse_inscriptions(inscriptions, annee)
        return Response([])
    
    @action(detail=False, methods=['get'])
    def par_statut(self, request):
        """Filtrer selon le statut financier calculé, jamais selon le champ historique."""
        statut = request.query_params.get('statut', '')
        if statut:
            annee = self._annee_demandee()
            inscriptions = self._inscriptions_affichables(annee)
            reponse = self._reponse_inscriptions(inscriptions, annee)
            return Response([
                etudiant for etudiant in reponse.data
                if etudiant['statut_frais'] == statut
            ])
        return Response([])
    
    @action(detail=False, methods=['get'])
    def par_annee(self, request):
        """Filtrer les étudiants par année académique"""
        annee = self._annee_demandee('annee_id')
        if annee:
            return self._reponse_inscriptions(self._inscriptions_affichables(annee), annee)
        return Response([])
    
    @action(detail=True, methods=['patch'])
    def modifier_statut_frais(self, request, pk=None):
        """Le statut dépend exclusivement des frais appliqués et paiements validés."""
        return Response(
            {'error': 'Le statut des frais est calculé automatiquement et ne peut pas être modifié.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
    
    @action(detail=True, methods=['patch'])
    def changer_annee(self, request, pk=None):
        """Changer l'année académique d'un étudiant"""
        etudiant = self.get_object()
        self._verifier_modification_autorisee(etudiant)
        annee_id = request.data.get('annee_academique_id')
        try:
            annee = AnneeAcademique.objects.get(id=annee_id)
            if not annee.est_active:
                raise PermissionDenied("Une année clôturée est disponible en consultation uniquement.")
            etudiant.annee_academique = annee
            etudiant.save()
            return Response({'message': f'Année changée pour {annee.nom}'})
        except AnneeAcademique.DoesNotExist:
            return Response({'error': 'Année non trouvée'}, status=404)
