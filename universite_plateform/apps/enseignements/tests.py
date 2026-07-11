from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.etudiants.models import Faculte
from .models import Cours, Grade, Professeur


class EspaceProfesseurTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='PROF-TEST',
            password='motdepasse123',
            email='prof@example.com',
        )
        self.faculte = Faculte.objects.create(nom='Sciences', code='SCI-P')
        self.grade = Grade.objects.create(libelle='Professeur associé', ordre=1)
        self.professeur = Professeur.objects.create(
            nom='Kabeya',
            prenom='Paul',
            email='prof@example.com',
            mot_de_passe=self.user.password,
            date_embauche=date(2020, 1, 10),
            grade=self.grade,
            faculte=self.faculte,
            specialite='Informatique',
            user=self.user,
        )
        Cours.objects.create(
            nom_cours='Algorithmique',
            ponderation=1,
            points=20,
            credit=4,
            volume_horaire=45,
            responsable=self.professeur,
        )

    def authenticate(self):
        token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_academic_login_identifies_professor(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'PROF-TEST', 'password': 'motdepasse123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['account_type'], 'professeur')

    def test_login_links_an_old_professor_without_django_user(self):
        professeur = Professeur.objects.create(
            nom='Ancien',
            prenom='Compte',
            email='ancien@example.com',
            mot_de_passe='ancienmotdepasse',
            date_embauche=date(2019, 2, 1),
            grade=self.grade,
            faculte=self.faculte,
        )
        # Reproduire un ancien dossier dont le lien User n'avait pas été créé.
        Professeur.objects.filter(pk=professeur.pk).update(user=None)
        professeur.refresh_from_db()

        response = self.client.post(
            '/api/auth/login/',
            {'username': professeur.email, 'password': 'ancienmotdepasse'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        professeur.refresh_from_db()
        self.assertIsNotNone(professeur.user_id)
        self.assertEqual(response.data['user']['account_type'], 'professeur')

    def test_professor_only_sees_personal_teaching_data(self):
        self.authenticate()
        response = self.client.get('/api/professeurs/mon-espace/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['professeur']['id'], self.professeur.id)
        self.assertEqual(len(response.data['cours']), 1)
        self.assertEqual(response.data['cours'][0]['nom_cours'], 'Algorithmique')

    def test_professor_can_update_own_profile(self):
        self.authenticate()
        response = self.client.patch(
            '/api/professeurs/mon-espace/',
            {'telephone': '0991111111', 'specialite': 'Systèmes'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.professeur.refresh_from_db()
        self.assertEqual(self.professeur.telephone, '0991111111')
        self.assertEqual(self.professeur.specialite, 'Systèmes')
