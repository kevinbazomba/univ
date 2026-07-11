from django.db import models

# Create your models here.

from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from datetime import date
import re
from universite_plateform.image_utils import optimize_student_photo, validate_image_upload

class AnneeAcademique(models.Model):
    """Gestion des années académiques"""
    nom = models.CharField(max_length=20, unique=True)  # ex: "2024-2025"
    date_debut = models.DateField()
    date_fin = models.DateField()
    est_active = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.nom} ({'Active' if self.est_active else 'Inactive'})"
    
    def save(self, *args, **kwargs):
        """Si cette année est active, désactiver les autres"""
        if self.est_active:
            AnneeAcademique.objects.filter(est_active=True).update(est_active=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_annee_active(cls):
        """Récupérer l'année académique active"""
        try:
            return cls.objects.get(est_active=True)
        except cls.DoesNotExist:
            return None
    
    class Meta:
        verbose_name = "Année académique"
        verbose_name_plural = "Années académiques"
        ordering = ['-date_debut']

class Faculte(models.Model):
    """Faculté ou Département"""
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        verbose_name = "Faculté"
        verbose_name_plural = "Facultés"

class Departement(models.Model):
    faculte = models.ForeignKey(Faculte, on_delete=models.CASCADE, related_name='departements')
    nom = models.CharField(max_length=120)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    est_actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['faculte__nom', 'nom']
        unique_together = ['faculte', 'nom']
        verbose_name = 'Département'
        verbose_name_plural = 'Départements'

    def __str__(self):
        return f"{self.nom} — {self.faculte.nom}"

class Promotion(models.Model):
    """Promotion / Classe / Année d'étude"""
    nom = models.CharField(max_length=50)  # ex: L1, L2, L3, M1, M2
    code = models.CharField(max_length=10, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    ordre = models.IntegerField(default=0)  # Pour l'ordre: L1=1, L2=2, etc.
    
    def __str__(self):
        return self.nom
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.nom.upper()
        if not self.ordre:
            correspondance = re.match(r'^[A-Z]+\s*(\d+)$', (self.code or self.nom).upper())
            if correspondance:
                self.ordre = int(correspondance.group(1))
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Promotion"
        verbose_name_plural = "Promotions"
        ordering = ['ordre']

class Etudiant(models.Model):
    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    
    STATUT_FRAIS_CHOICES = [
        ('PAYE', 'Payé'),
        ('IMPAYE', 'Impayé'),
        ('PARTIEL', 'Partiel'),
        ('EXONERE', 'Exonéré'),
    ]
    
    # Identité
    nom = models.CharField(max_length=100, verbose_name="Nom")
    post_nom = models.CharField(max_length=100, verbose_name="Post-nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, verbose_name="Sexe")
    
    # Informations personnelles
    date_naissance = models.DateField(verbose_name="Date de naissance")
    lieu_naissance = models.CharField(max_length=100, blank=True, null=True)
    telephone = models.CharField(max_length=20, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True)
    adresse = models.TextField(verbose_name="Adresse")
    # Mot de passe interne (stocké comme hash si géré côté serializer)
    mot_de_passe = models.CharField(max_length=255, blank=True, null=True, verbose_name="Mot de passe")
    
    # Informations académiques
    matricule = models.CharField(max_length=50, unique=True, blank=True, editable=False, verbose_name="Matricule")
    faculte = models.ForeignKey(Faculte, on_delete=models.CASCADE, verbose_name="Faculté")
    departement = models.ForeignKey(Departement, on_delete=models.SET_NULL, null=True, blank=True, related_name='etudiants', verbose_name='Département')
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, verbose_name="Promotion")
    annee_academique = models.ForeignKey(
        AnneeAcademique, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Année académique"
    )
    
    # Photo
    photo = models.ImageField(
        upload_to='photos_etudiants/',
        default='photos_etudiants/default-student.svg',
        blank=True,
        validators=[validate_image_upload],
        verbose_name="Photo",
    )
    
    # Parent / Tuteur
    parent_nom = models.CharField(max_length=200, verbose_name="Nom du parent/tuteur")
    parent_telephone = models.CharField(max_length=20, verbose_name="Téléphone du parent")
    parent_email = models.EmailField(blank=True, null=True)
    
    # Date d'inscription
    date_inscription = models.DateField(auto_now_add=True, verbose_name="Date d'inscription")
    
    # Statut financier
    statut_frais = models.CharField(
        max_length=10, 
        choices=STATUT_FRAIS_CHOICES, 
        default='IMPAYE',
        verbose_name="Statut des frais"
    )
    
    # Champs système
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    est_actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.post_nom} {self.prenom}"

    def save(self, *args, **kwargs):
        if not self.matricule:
            annee = self.annee_academique or AnneeAcademique.get_annee_active()
            annee_reference = annee.date_debut.year if annee else date.today().year
            prochain_numero = (Etudiant.objects.order_by('-id').values_list('id', flat=True).first() or 0) + 1
            matricule = f'ETU-{annee_reference}-{prochain_numero:06d}'
            while Etudiant.objects.filter(matricule=matricule).exists():
                prochain_numero += 1
                matricule = f'ETU-{annee_reference}-{prochain_numero:06d}'
            self.matricule = matricule
        ancienne_photo = None
        if self.pk and Etudiant.objects.filter(pk=self.pk).exists():
            ancienne_photo = Etudiant.objects.only('photo').get(pk=self.pk).photo
        if (
            self.photo
            and self.photo.name != 'photos_etudiants/default-student.svg'
            and not self.photo.name.lower().endswith('.webp')
        ):
            self.photo = optimize_student_photo(self.photo)
        super().save(*args, **kwargs)
        if self.annee_academique_id:
            InscriptionAcademique.objects.filter(
                etudiant=self, est_courante=True,
            ).exclude(annee_academique_id=self.annee_academique_id).update(est_courante=False)
            InscriptionAcademique.objects.update_or_create(
                etudiant=self,
                annee_academique=self.annee_academique,
                defaults={
                    'faculte': self.faculte,
                    'departement': self.departement,
                    'promotion': self.promotion,
                    'est_courante': True,
                },
            )
        if (
            ancienne_photo
            and ancienne_photo.name != self.photo.name
            and ancienne_photo.name != 'photos_etudiants/default-student.svg'
        ):
            ancienne_photo.storage.delete(ancienne_photo.name)

    @property
    def password(self):
        """Alias pratique vers `mot_de_passe` pour compatibilité avec "password"."""
        return self.mot_de_passe

    @password.setter
    def password(self, value):
        self.mot_de_passe = value
    
    @property
    def nom_complet(self):
        return f"{self.nom} {self.post_nom} {self.prenom}"
    
    @property
    def age(self):
        if self.date_naissance:
            today = date.today()
            return today.year - self.date_naissance.year - (
                (today.month, today.day) < (self.date_naissance.month, self.date_naissance.day)
            )
        return None
    
    class Meta:
        verbose_name = "Étudiant"
        verbose_name_plural = "Étudiants"
        ordering = ['nom', 'prenom']


class InscriptionAcademique(models.Model):
    """Historique annuel du parcours d'un étudiant, sans recréer son identité."""

    STATUTS = [
        ('INSCRIT', 'Inscrit'),
        ('ADMIS', 'Admis au niveau suivant'),
        ('AJOURNE', 'Ajourné'),
        ('TERMINE', 'Cursus terminé'),
    ]
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='inscriptions_academiques')
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.PROTECT, related_name='inscriptions_etudiants')
    faculte = models.ForeignKey(Faculte, on_delete=models.PROTECT)
    departement = models.ForeignKey(Departement, on_delete=models.SET_NULL, null=True, blank=True)
    promotion = models.ForeignKey(Promotion, on_delete=models.PROTECT)
    statut = models.CharField(max_length=12, choices=STATUTS, default='INSCRIT')
    date_inscription = models.DateField(default=date.today)
    est_courante = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-annee_academique__date_debut']
        constraints = [
            models.UniqueConstraint(
                fields=['etudiant', 'annee_academique'],
                name='unique_inscription_etudiant_annee',
            ),
        ]
        verbose_name = 'Inscription académique'
        verbose_name_plural = 'Inscriptions académiques'

    def __str__(self):
        return f'{self.etudiant.matricule} — {self.annee_academique.nom} — {self.promotion.nom}'
