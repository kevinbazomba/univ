from datetime import date

from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AnneeAcademique, Etudiant, Faculte, Promotion


class EtudiantAccountTests(APITestCase):
    def setUp(self):
        faculte = Faculte.objects.create(nom='Sciences', code='SCI')
        promotion = Promotion.objects.create(nom='L1', code='L1')
        annee = AnneeAcademique.objects.create(
            nom='2025-2026',
            date_debut=date(2025, 9, 1),
            date_fin=date(2026, 8, 31),
            est_active=True,
        )
        self.etudiant = Etudiant.objects.create(
            nom='Kabeya',
            post_nom='Ilunga',
            prenom='Amina',
            sexe='F',
            date_naissance=date(2003, 5, 10),
            telephone='0990000000',
            adresse='Kinshasa',
            matricule='ETU-001',
            mot_de_passe=make_password('motdepasse123'),
            faculte=faculte,
            promotion=promotion,
            annee_academique=annee,
            parent_nom='Ilunga Parent',
            parent_telephone='0810000000',
        )

    def login(self, password='motdepasse123'):
        return self.client.post(
            '/api/etudiants/login/',
            {'matricule': self.etudiant.matricule, 'mot_de_passe': password},
            format='json',
        )

    def test_login_returns_student_tokens_and_profile(self):
        response = self.login()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['etudiant']['matricule'], 'ETU-001')

    def test_student_can_only_update_personal_profile_fields(self):
        login_response = self.login()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

        response = self.client.patch(
            '/api/etudiants/mon-profil/',
            {'telephone': '0971111111', 'matricule': 'MODIFIE'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.etudiant.refresh_from_db()
        self.assertEqual(self.etudiant.telephone, '0971111111')
        self.assertEqual(self.etudiant.matricule, 'ETU-001')

    def test_login_rejects_wrong_password(self):
        response = self.login('incorrect')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
