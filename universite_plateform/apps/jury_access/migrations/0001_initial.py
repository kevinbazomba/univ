from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('etudiants', '0007_inscriptionacademique'),
    ]

    operations = [
        migrations.CreateModel(
            name='JetonJury',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(editable=False, max_length=32, unique=True)),
                ('libelle', models.CharField(blank=True, max_length=150)),
                ('est_actif', models.BooleanField(default=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_desactivation', models.DateTimeField(blank=True, null=True)),
                ('annee_academique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='jetons_jury', to='etudiants.anneeacademique')),
                ('departement', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jetons_jury', to='etudiants.departement')),
                ('faculte', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jetons_jury', to='etudiants.faculte')),
                ('promotion', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jetons_jury', to='etudiants.promotion')),
            ],
            options={
                'verbose_name': 'Jeton du jury',
                'verbose_name_plural': 'Jetons du jury',
                'ordering': ['-date_creation'],
            },
        ),
    ]
