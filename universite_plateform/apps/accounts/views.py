from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.db.models import Q
from django.utils import timezone
from .serializers import (
    RegisterSerializer, UserSerializer, LoginSerializer,
    IdentiteUniversiteSerializer,
)
from .models import IdentiteUniversite


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def identite_universite(request):
    identite = IdentiteUniversite.objects.first()
    if not identite:
        return Response({
            'nom': 'Gestion universitaire',
            'sigle': '',
            'devise': '',
            'adresse': '',
            'telephone': '',
            'email': '',
            'site_web': '',
            'logo_url': '',
        })
    return Response(IdentiteUniversiteSerializer(identite, context={'request': request}).data)

# IMPORTANT : Désactiver CSRF pour toutes les vues
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Inscription réussie'
        }
        print("Inscription réussie pour:", user.username)
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    print("Erreurs de validation:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password']

        django_user = User.objects.filter(username__iexact=username).first()
        user = authenticate(
            username=django_user.username if django_user else username,
            password=password,
        )

        professeur = None
        if user is None:
            from apps.enseignements.models import Professeur

            professeur = Professeur.objects.filter(
                Q(matricule__iexact=username) | Q(email__iexact=username)
            ).select_related('user').first()

            if professeur and professeur.est_actif:
                if professeur.bloque_jusqua and professeur.bloque_jusqua > timezone.now():
                    return Response(
                        {'error': f'Compte bloqué jusqu’à {professeur.bloque_jusqua}'},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                legacy_password_valid = False
                try:
                    identify_hasher(professeur.mot_de_passe)
                except ValueError:
                    # Conversion unique des anciens mots de passe saisis en clair.
                    legacy_password_valid = password == professeur.mot_de_passe
                    if legacy_password_valid:
                        professeur.mot_de_passe = make_password(password)

                if legacy_password_valid or check_password(password, professeur.mot_de_passe):
                    user = professeur.user
                    if user is None:
                        base_username = professeur.matricule
                        final_username = base_username
                        suffix = 1
                        while User.objects.filter(username=final_username).exists():
                            final_username = f'{base_username}-{suffix}'
                            suffix += 1
                        user = User(username=final_username)

                    user.email = professeur.email
                    user.first_name = professeur.prenom
                    user.last_name = professeur.nom
                    user.is_active = True
                    user.password = professeur.mot_de_passe
                    user.save()

                    professeur.user = user
                    professeur.tentative_connexion = 0
                    professeur.bloque_jusqua = None
                    professeur.date_derniere_connexion = timezone.now()
                    professeur.save()
                else:
                    professeur.tentative_connexion += 1
                    if professeur.tentative_connexion >= 5:
                        from datetime import timedelta
                        professeur.bloque_jusqua = timezone.now() + timedelta(minutes=30)
                    professeur.save()
        
        if user is not None:
            professeur = getattr(user, 'professeur', None)
            if professeur and not professeur.est_actif:
                return Response(
                    {'error': 'Ce compte professeur est désactivé'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if professeur and professeur.mot_de_passe != user.password:
                professeur.mot_de_passe = user.password
                professeur.tentative_connexion = 0
                professeur.bloque_jusqua = None
                professeur.date_derniere_connexion = timezone.now()
                professeur.save()

            refresh = RefreshToken.for_user(user)
            response_data = {
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Connexion réussie'
            }
            return Response(response_data)
        else:
            return Response(
                {'error': 'Nom d\'utilisateur ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    print("Erreurs de validation:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Déconnexion réussie'})
    except Exception:
        return Response({'message': 'Déconnexion réussie'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_token(request):
    refresh_token = request.data.get('refresh')
    try:
        refresh = RefreshToken(refresh_token)
        return Response({'access': str(refresh.access_token)})
    except Exception:
        return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)



from django.shortcuts import render

def react_app(request):
    return render(request, 'index.html')
