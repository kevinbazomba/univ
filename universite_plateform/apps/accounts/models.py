from django.db import models
from universite_plateform.image_utils import optimize_university_logo, validate_image_upload


class IdentiteUniversite(models.Model):
    """Identité institutionnelle unique utilisée dans l'interface et les documents."""

    nom = models.CharField(max_length=200)
    sigle = models.CharField(max_length=30, blank=True)
    devise = models.CharField(max_length=255, blank=True)
    adresse = models.TextField(blank=True)
    ville = models.CharField(max_length=100, blank=True)
    pays = models.CharField(max_length=100, blank=True)
    telephone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    site_web = models.URLField(blank=True)
    boite_postale = models.CharField(max_length=100, blank=True)
    logo_url = models.URLField(blank=True, help_text="Adresse publique du logo")
    logo = models.ImageField(
        upload_to='universite/', blank=True, null=True,
        validators=[validate_image_upload],
        help_text='JPG, PNG, WebP ou GIF. Conversion automatique en GIF optimisé.',
    )
    responsable = models.CharField(max_length=200, blank=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Identité de l'université"
        verbose_name_plural = "Identité de l'université"

    def save(self, *args, **kwargs):
        self.pk = 1
        ancien_logo = None
        if IdentiteUniversite.objects.filter(pk=1).exists():
            ancien_logo = IdentiteUniversite.objects.only('logo').get(pk=1).logo
        if self.logo and not self.logo.name.lower().endswith('.gif'):
            self.logo = optimize_university_logo(self.logo)
        super().save(*args, **kwargs)
        if ancien_logo and ancien_logo.name != self.logo.name:
            ancien_logo.storage.delete(ancien_logo.name)

    def delete(self, *args, **kwargs):
        return None

    def __str__(self):
        return self.nom
