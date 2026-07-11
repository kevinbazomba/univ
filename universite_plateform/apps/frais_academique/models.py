from django.contrib.auth.models import User
from django.db import models
from django.db.models import Sum
from django.template.defaultfilters import slugify
from django.utils import timezone

from apps.etudiants.models import AnneeAcademique, Etudiant, Faculte, Departement, Promotion


class TypeFrais(models.Model):
    nom = models.CharField(max_length=100, unique=True, verbose_name='Type de frais')
    code = models.SlugField(max_length=50, unique=True, blank=True, verbose_name='Code')
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    class Meta:
        verbose_name = 'Type de frais'
        verbose_name_plural = 'Types de frais'
        ordering = ['nom']

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = slugify(self.nom)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom


class Semestre(models.IntegerChoices):
    PREMIER = 1, '1er Semestre'
    DEUXIEME = 2, '2ème Semestre'


class TarifFrais(models.Model):
    """Modèle de tarif universitaire appliqué par faculté/promotion/option."""

    faculte = models.ForeignKey(
        Faculte,
        on_delete=models.CASCADE,
        related_name='tarifs_frais',
        verbose_name='Faculté',
        blank=True,
        null=True,
    )
    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.CASCADE,
        related_name='tarifs_frais',
        verbose_name='Promotion',
        blank=True,
        null=True,
    )
    departement = models.ForeignKey(
        Departement, on_delete=models.CASCADE, related_name='tarifs_frais',
        blank=True, null=True, verbose_name='Département',
    )
    option_specialisation = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Option / Spécialisation',
    )
    semestre = models.IntegerField(choices=Semestre.choices, verbose_name='Semestre')
    type_frais = models.ForeignKey(
        TypeFrais,
        on_delete=models.PROTECT,
        related_name='tarifs',
        verbose_name='Type de frais',
    )
    montant = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')
    annee_academique = models.ForeignKey(
        AnneeAcademique,
        on_delete=models.CASCADE,
        related_name='tarifs_frais',
        verbose_name='Année académique',
    )

    class Meta:
        verbose_name = 'Tarif'
        verbose_name_plural = 'Tarifs'
        unique_together = [
            'faculte',
            'departement',
            'promotion',
            'option_specialisation',
            'semestre',
            'type_frais',
            'annee_academique',
        ]

    def __str__(self):
        parts = []
        if self.faculte:
            parts.append(self.faculte.nom)
        if self.promotion:
            parts.append(self.promotion.nom)
        if self.option_specialisation:
            parts.append(self.option_specialisation)
        parts.append(str(self.type_frais))
        parts.append(self.get_semestre_display())
        parts.append(f"{self.montant} FC")
        return ' - '.join(parts)


class FraisAcademique(models.Model):
    """Frais applicables à un étudiant pour une année académique donnée."""

    etudiant = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name='frais_academiques',
        verbose_name='Étudiant',
    )
    annee_academique = models.ForeignKey(
        AnneeAcademique,
        on_delete=models.CASCADE,
        related_name='frais_academiques',
        verbose_name='Année académique',
    )
    faculte = models.ForeignKey(
        Faculte,
        on_delete=models.SET_NULL,
        related_name='frais_academiques',
        verbose_name='Faculté',
        blank=True,
        null=True,
    )
    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.SET_NULL,
        related_name='frais_academiques',
        verbose_name='Promotion',
        blank=True,
        null=True,
    )
    departement = models.ForeignKey(
        Departement, on_delete=models.SET_NULL, related_name='frais_academiques',
        blank=True, null=True, verbose_name='Département',
    )
    option_specialisation = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Option / Spécialisation',
    )
    semestre = models.IntegerField(choices=Semestre.choices, verbose_name='Semestre')
    type_frais = models.ForeignKey(
        TypeFrais,
        on_delete=models.PROTECT,
        related_name='frais_academiques',
        verbose_name='Type de frais',
    )
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant total à payer')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Frais académique'
        verbose_name_plural = 'Frais académiques'
        unique_together = ['etudiant', 'annee_academique', 'semestre', 'type_frais']

    def __str__(self):
        return f"{self.etudiant.nom_complet} - {self.type_frais} - {self.get_semestre_display()}"

    @property
    def total_paye(self):
        total = self.paiements.filter(statut='valide').aggregate(total=Sum('montant_paye'))['total']
        return total or 0

    @property
    def solde_restant(self):
        return self.montant_total - self.total_paye

    @property
    def statut_paiement(self):
        if self.total_paye <= 0:
            return 'non_paye'
        if self.total_paye >= self.montant_total:
            return 'paye'
        return 'partiel'


class Paiement(models.Model):
    MODE_PAIEMENT = [
        ('cash', 'Espèces'),
        ('mobile_money', 'Mobile Money'),
        ('banque', 'Virement bancaire'),
        ('cheque', 'Chèque'),
        ('carte', 'Carte bancaire'),
    ]

    STATUT_PAIEMENT = [
        ('valide', 'Validé'),
        ('annule', 'Annulé'),
        ('en_attente', 'En attente'),
    ]

    frais = models.ForeignKey(
        FraisAcademique,
        on_delete=models.CASCADE,
        related_name='paiements',
        verbose_name='Frais concernés',
    )
    etudiant = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name='paiements',
        verbose_name='Étudiant',
    )
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant payé')
    date_paiement = models.DateField(default=timezone.now, verbose_name='Date de paiement')
    mode_paiement = models.CharField(max_length=50, choices=MODE_PAIEMENT, verbose_name='Mode de paiement')
    reference = models.CharField(max_length=100, unique=True, editable=False, verbose_name='Numéro de reçu')
    statut = models.CharField(max_length=20, choices=STATUT_PAIEMENT, default='valide', verbose_name='Statut')
    description = models.TextField(blank=True, null=True, verbose_name='Observations')
    agent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='paiements_enregistres',
        verbose_name='Agent',
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = self.generer_reference()
        if not self.etudiant_id and self.frais_id:
            self.etudiant = self.frais.etudiant
        super().save(*args, **kwargs)

    def generer_reference(self):
        annee = timezone.now().strftime('%Y')
        dernier = Paiement.objects.filter(reference__startswith=f'REC-{annee}').order_by('-reference').first()
        if dernier and dernier.reference:
            try:
                dernier_num = int(dernier.reference.split('-')[-1])
            except ValueError:
                dernier_num = 0
            nouveau_num = dernier_num + 1
        else:
            nouveau_num = 1
        return f'REC-{annee}-{nouveau_num:06d}'

    def __str__(self):
        return f"{self.reference} - {self.etudiant.nom_complet} - {self.montant_paye} FC"

