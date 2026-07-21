from django.db import models

# Create your models here.
from django.db import models
from django.utils import timezone
import uuid
import secrets
import random
from django.contrib.auth.models import User
from django.contrib.auth.hashers import identify_hasher, make_password
from django.core.exceptions import ValidationError

# Import depuis l'application etudiant
from apps.etudiants.models import Faculte, Etudiant, InscriptionAcademique

class Grade(models.Model):
    code = models.CharField(max_length=10, unique=True, editable=False)
    libelle = models.CharField(max_length=100)
    ordre = models.IntegerField(default=0)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['ordre', 'code']
    
    def save(self, *args, **kwargs):
        if not self.code:
            if self.libelle:
                mots = self.libelle.split()
                if len(mots) >= 2:
                    code_base = (mots[0][0] + mots[1][0]).upper()
                else:
                    code_base = self.libelle[:2].upper()
            else:
                code_base = str(uuid.uuid4())[:8].upper()

            code_base = ''.join(caractere for caractere in code_base if caractere.isalnum())[:8] or str(uuid.uuid4())[:8].upper()
            code = code_base
            compteur = 1
            while Grade.objects.filter(code=code).exclude(pk=self.pk).exists():
                suffixe = str(compteur)
                code = f"{code_base[:10 - len(suffixe)]}{suffixe}"
                compteur += 1
            self.code = code
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.libelle}"


class Professeur(models.Model):
    matricule = models.CharField(max_length=20, unique=True, editable=False)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=15, blank=True, null=True)
    
    mot_de_passe = models.CharField(max_length=255)
    est_actif = models.BooleanField(default=True)
    
    date_embauche = models.DateField()
    grade = models.ForeignKey(Grade, on_delete=models.PROTECT, related_name='professeurs')
    faculte = models.ForeignKey(Faculte, on_delete=models.PROTECT, related_name='professeurs')
    specialite = models.CharField(max_length=200, blank=True, null=True)
    
    tentative_connexion = models.IntegerField(default=0)
    bloque_jusqua = models.DateTimeField(null=True, blank=True)
    date_derniere_connexion = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(default=timezone.now)
    date_modification = models.DateTimeField(auto_now=True)
    # Lien optionnel vers le compte utilisateur Django
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='professeur')
    
    class Meta:
        ordering = ['nom', 'prenom']
        indexes = [
            models.Index(fields=['matricule']),
            models.Index(fields=['email']),
            models.Index(fields=['est_actif']),
            models.Index(fields=['faculte']),
        ]
    
    def save(self, *args, **kwargs):
        if self.mot_de_passe:
            try:
                identify_hasher(self.mot_de_passe)
            except ValueError:
                self.mot_de_passe = make_password(self.mot_de_passe)

        if not self.matricule:
            annee = timezone.now().strftime('%Y')
            chiffres = str(random.randint(1000, 9999))
            self.matricule = f"PROF{annee}{chiffres}"
        super().save(*args, **kwargs)
        # Synchroniser ou créer un User Django associé si possible
        try:
            if not self.user:
                # Créer un utilisateur Django minimal et lier
                username = self.matricule or (self.email or '').split('@')[0]
                user = User.objects.create(username=username, email=self.email or '')
                # Si `mot_de_passe` contient une valeur (déjà hashée par le serializer), l'assigner directement
                if self.mot_de_passe:
                    user.password = self.mot_de_passe
                else:
                    user.set_unusable_password()
                user.save()
                self.user = user
                super().save(update_fields=['user'])
            else:
                # Mettre à jour le mot de passe côté User si Professeur.mot_de_passe est renseigné
                if self.mot_de_passe:
                    # Assigner la valeur de hash directement (le serializer applique make_password)
                    if self.user.password != self.mot_de_passe:
                        self.user.password = self.mot_de_passe
                        self.user.save()
        except Exception:
            # Ne pas bloquer la sauvegarde principale si la création du User échoue
            pass
    
    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom}"




class Cours(models.Model):
    code_cours = models.CharField(max_length=20, unique=True, editable=False)
    nom_cours = models.CharField(max_length=200)
    ponderation = models.DecimalField(max_digits=4, decimal_places=2)
    points = models.IntegerField(default=20)
    credit = models.DecimalField(max_digits=3, decimal_places=1, default=3.0)
    volume_horaire = models.IntegerField()
    description = models.TextField(blank=True, null=True)
    
    # Liens
    responsable = models.ForeignKey('Professeur', on_delete=models.PROTECT, related_name='cours_responsables')
    
    date_creation = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Cours"
        verbose_name_plural = "Cours"
    
    def save(self, *args, **kwargs):
        if not self.code_cours:
            import hashlib
            from django.utils import timezone
            annee = timezone.now().year
            hash_object = hashlib.md5(self.nom_cours.encode())
            suffixe = str(int(hash_object.hexdigest()[:6], 16))[:4]
            self.code_cours = f"CRS{annee}{suffixe}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.nom_cours


class FusionCoursJury(models.Model):
    """Regle decidee par le jury pour regrouper plusieurs branches en un seul cours."""

    nom_cours_fusionne = models.CharField(max_length=200)
    cours = models.ManyToManyField('Cours', related_name='fusions_jury')
    faculte = models.ForeignKey('etudiants.Faculte', on_delete=models.SET_NULL, null=True, blank=True)
    departement = models.ForeignKey('etudiants.Departement', on_delete=models.SET_NULL, null=True, blank=True)
    promotion = models.ForeignKey('etudiants.Promotion', on_delete=models.SET_NULL, null=True, blank=True)
    annee_academique = models.ForeignKey('etudiants.AnneeAcademique', on_delete=models.SET_NULL, null=True, blank=True)
    est_active = models.BooleanField(default=True)
    cree_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='fusions_cours_jury')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom_cours_fusionne']
        verbose_name = "Fusion de cours du jury"
        verbose_name_plural = "Fusions de cours du jury"

    def __str__(self):
        return self.nom_cours_fusionne

    def clean(self):
        super().clean()
        if self.pk and self.cours.count() < 2:
            raise ValidationError({'cours': 'Selectionnez au moins deux branches/cours a fusionner.'})







###################################################""
##############################################""
########################################################""


class GestionApplicationCours(models.Model):
    """Conteneur principal - Supprimer ceci supprime TOUS les AppliquerCours liés"""
    
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Créateur
    createur = models.ForeignKey('Professeur', on_delete=models.PROTECT, related_name='applications_cours')
    
    # Critères de sélection (ceux qui définissent quels étudiants reçoivent le cours)
    faculte = models.ForeignKey('etudiants.Faculte', on_delete=models.SET_NULL, null=True, blank=True)
    departement = models.ForeignKey('etudiants.Departement', on_delete=models.SET_NULL, null=True, blank=True)
    promotion = models.ForeignKey('etudiants.Promotion', on_delete=models.SET_NULL, null=True, blank=True)
    annee_academique = models.ForeignKey('etudiants.AnneeAcademique', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Cours à appliquer
    cours = models.ForeignKey('Cours', on_delete=models.PROTECT, related_name='applications')
    
    date_creation = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Gestion application de cours"
        verbose_name_plural = "Gestion applications de cours"
    
    def __str__(self):
        return self.titre
    
    def appliquer_aux_etudiants(self):
        """Applique automatiquement le cours aux étudiants selon les critères"""
        if self.annee_academique:
            inscriptions = InscriptionAcademique.objects.filter(
                annee_academique=self.annee_academique,
                etudiant__est_actif=True,
            ).select_related('etudiant')
            if self.faculte:
                inscriptions = inscriptions.filter(faculte=self.faculte)
            if self.departement:
                inscriptions = inscriptions.filter(departement=self.departement)
            if self.promotion:
                inscriptions = inscriptions.filter(promotion=self.promotion)
            etudiants = [inscription.etudiant for inscription in inscriptions]
        else:
            queryset = Etudiant.objects.filter(est_actif=True)
            if self.faculte:
                queryset = queryset.filter(faculte=self.faculte)
            if self.departement:
                queryset = queryset.filter(departement=self.departement)
            if self.promotion:
                queryset = queryset.filter(promotion=self.promotion)
            etudiants = list(queryset)

        for etudiant in etudiants:
            AppliquerCours.objects.get_or_create(
                gestion=self,
                etudiant=etudiant,
                cours=self.cours
            )


class AppliquerCours(models.Model):
    """Lien individuel - Pour suppression unitaire"""
    
    gestion = models.ForeignKey(GestionApplicationCours, on_delete=models.CASCADE, related_name='applications_individuelles')
    etudiant = models.ForeignKey('etudiants.Etudiant', on_delete=models.CASCADE, related_name='cours_appliques')
    cours = models.ForeignKey('Cours', on_delete=models.PROTECT, related_name='etudiants_assignes')
    
    date_application = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True)
    points_tp = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_interro = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_examen = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_obtenus = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    observation = models.CharField(max_length=255, blank=True)
    date_evaluation = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Cours appliqué"
        verbose_name_plural = "Cours appliqués"
        unique_together = ['gestion', 'etudiant', 'cours']
    
    def __str__(self):
        return f"{self.etudiant} - {self.cours.nom_cours}"


class SessionEvaluation(models.Model):
    """Période d'évaluation librement définie par l'administration."""
    nom = models.CharField(max_length=120)
    annee_academique = models.ForeignKey(
        'etudiants.AnneeAcademique',
        on_delete=models.CASCADE,
        related_name='sessions_evaluation',
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    description = models.TextField(blank=True)
    est_active = models.BooleanField(default=True)
    est_rattrapage = models.BooleanField(
        default=False,
        verbose_name='Session de rattrapage',
    )
    est_cloture = models.BooleanField(default=False, verbose_name='Session de clôture du jury')
    est_fin_annee = models.BooleanField(default=False, verbose_name="Clôture de fin d'année")
    session_origine = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='sessions_rattrapage',
        verbose_name='Session remplacée',
    )
    sessions_incluses = models.ManyToManyField(
        'self', symmetrical=False, blank=True,
        related_name='clotures_associees', verbose_name='Sessions à consolider',
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_debut', 'nom']
        unique_together = ['nom', 'annee_academique']
        verbose_name = "Session d'évaluation"
        verbose_name_plural = "Sessions d'évaluation"

    def __str__(self):
        return f"{self.nom} — {self.annee_academique.nom}"

    def clean(self):
        super().clean()
        if self.date_debut and self.date_fin and self.date_debut > self.date_fin:
            raise ValidationError({'date_fin': 'La date de fin doit suivre la date de début.'})
        if self.est_rattrapage and not self.session_origine_id:
            raise ValidationError({'session_origine': 'Sélectionnez la session concernée par ce rattrapage.'})
        if not self.est_rattrapage and self.session_origine_id:
            raise ValidationError({'session_origine': "Une session ordinaire ne doit pas avoir de session d'origine."})
        if self.est_cloture and self.est_rattrapage:
            raise ValidationError({'est_cloture': 'Une session de clôture ne peut pas être une session de rattrapage.'})
        if self.est_fin_annee and not self.est_cloture:
            raise ValidationError({'est_fin_annee': "La fin d'année doit être une session de clôture."})
        if self.session_origine_id:
            if self.pk and self.session_origine_id == self.pk:
                raise ValidationError({'session_origine': 'Une session ne peut pas se remplacer elle-même.'})
            if self.session_origine.annee_academique_id != self.annee_academique_id:
                raise ValidationError({'session_origine': "Les deux sessions doivent appartenir à la même année académique."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        if self.est_rattrapage and self.session_origine_id:
            SessionEvaluation.objects.filter(pk=self.session_origine_id).update(est_active=False)


class CotationSession(models.Model):
    application = models.ForeignKey(
        AppliquerCours,
        on_delete=models.CASCADE,
        related_name='cotations',
    )
    session = models.ForeignKey(
        SessionEvaluation,
        on_delete=models.PROTECT,
        related_name='cotations',
    )
    points_tp = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_interro = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_examen = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total = models.DecimalField(max_digits=6, decimal_places=2, default=0, editable=False)
    observation = models.CharField(max_length=255, blank=True)
    delibere_par_jury = models.BooleanField(default=False)
    date_deliberation_jury = models.DateTimeField(null=True, blank=True)
    date_evaluation = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-session__date_debut', 'application__cours__nom_cours']
        unique_together = ['application', 'session']
        verbose_name = 'Cotation par session'
        verbose_name_plural = 'Cotations par session'

    def save(self, *args, **kwargs):
        self.total = sum(
            (valeur for valeur in (self.points_tp, self.points_interro, self.points_examen) if valeur is not None),
            0,
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.application.etudiant} — {self.application.cours} — {self.session.nom}"


class DecisionJury(models.Model):
    DECISIONS = [
        ('EN_ATTENTE', 'En attente'), ('ADMIS', 'Admis'), ('AJOURNE', 'Ajourné'), ('NON_ADMIS', 'Non admis'),
        ('S', 'Satisfait'), ('D', 'Distinction'), ('GD', 'Grande distinction'),
        ('AA', 'Assimilé ajourné'), ('A', 'Ajourné'), ('NF', 'Naf'),
    ]
    MODES = [('INDIVIDUEL', 'Individuel'), ('COLLECTIF', 'Collectif')]
    session = models.ForeignKey(SessionEvaluation, on_delete=models.CASCADE, related_name='decisions_jury')
    etudiant = models.ForeignKey('etudiants.Etudiant', on_delete=models.CASCADE, related_name='decisions_jury')
    decision = models.CharField(max_length=20, choices=DECISIONS, default='EN_ATTENTE')
    resultats_publies = models.BooleanField(default=False)
    mode_approbation = models.CharField(max_length=20, choices=MODES, default='INDIVIDUEL')
    approuve_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='decisions_jury_approuvees')
    date_approbation = models.DateTimeField(null=True, blank=True)
    observation = models.TextField(blank=True)

    class Meta:
        unique_together = ['session', 'etudiant']
        ordering = ['etudiant__nom', 'etudiant__prenom']
        verbose_name = 'Décision du jury'
        verbose_name_plural = 'Décisions du jury'

    def __str__(self):
        return f"{self.etudiant} — {self.session.nom} — {self.get_decision_display()}"


class PromotionEnAttente(models.Model):
    STATUTS = [('EN_ATTENTE', 'En attente'), ('PROMU', 'Promu'), ('BLOQUE', 'Bloqué')]
    decision = models.OneToOneField(DecisionJury, on_delete=models.CASCADE, related_name='promotion_attendue')
    inscription_origine = models.OneToOneField('etudiants.InscriptionAcademique', on_delete=models.PROTECT, related_name='promotion_emise')
    annee_cible = models.ForeignKey('etudiants.AnneeAcademique', on_delete=models.PROTECT, null=True, blank=True, related_name='promotions_recues')
    promotion_cible = models.ForeignKey('etudiants.Promotion', on_delete=models.PROTECT, null=True, blank=True, related_name='promotions_recues')
    inscription_creee = models.OneToOneField('etudiants.InscriptionAcademique', on_delete=models.SET_NULL, null=True, blank=True, related_name='promotion_source')
    statut = models.CharField(max_length=12, choices=STATUTS, default='EN_ATTENTE')
    message = models.CharField(max_length=255, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Promotion en attente'
        verbose_name_plural = 'Promotions en attente'

    def __str__(self):
        return f'{self.inscription_origine.etudiant.matricule} — {self.get_statut_display()}'
