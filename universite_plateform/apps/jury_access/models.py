import secrets

from django.db import models
from django.utils import timezone


class JetonJury(models.Model):
    code = models.CharField(max_length=32, unique=True, editable=False)
    libelle = models.CharField(max_length=150, blank=True, verbose_name='Nom du jeton')
    annee_academique = models.ForeignKey(
        'etudiants.AnneeAcademique',
        on_delete=models.CASCADE,
        related_name='jetons_jury',
    )
    faculte = models.ForeignKey(
        'etudiants.Faculte',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jetons_jury',
    )
    departement = models.ForeignKey(
        'etudiants.Departement',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jetons_jury',
    )
    promotion = models.ForeignKey(
        'etudiants.Promotion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jetons_jury',
    )
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_desactivation = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Jeton du jury'
        verbose_name_plural = 'Jetons du jury'

    def __str__(self):
        return f'{self.libelle or self.code} — {self.annee_academique}'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generer_code_unique()
        if not self.est_actif and not self.date_desactivation:
            self.date_desactivation = timezone.now()
        if self.est_actif:
            self.date_desactivation = None
        super().save(*args, **kwargs)

    @classmethod
    def generer_code_unique(cls):
        while True:
            code = secrets.token_urlsafe(12).replace('-', '').replace('_', '').upper()[:16]
            if not cls.objects.filter(code=code).exists():
                return code
