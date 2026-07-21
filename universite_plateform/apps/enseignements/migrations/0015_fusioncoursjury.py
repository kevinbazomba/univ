from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('etudiants', '0007_inscriptionacademique'),
        ('enseignements', '0014_gestionapplicationcours_departement'),
    ]

    operations = [
        migrations.CreateModel(
            name='FusionCoursJury',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_cours_fusionne', models.CharField(max_length=200)),
                ('est_active', models.BooleanField(default=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('annee_academique', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='etudiants.anneeacademique')),
                ('cree_par', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fusions_cours_jury', to=settings.AUTH_USER_MODEL)),
                ('departement', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='etudiants.departement')),
                ('faculte', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='etudiants.faculte')),
                ('promotion', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='etudiants.promotion')),
                ('cours', models.ManyToManyField(related_name='fusions_jury', to='enseignements.cours')),
            ],
            options={
                'verbose_name': 'Fusion de cours du jury',
                'verbose_name_plural': 'Fusions de cours du jury',
                'ordering': ['nom_cours_fusionne'],
            },
        ),
    ]
