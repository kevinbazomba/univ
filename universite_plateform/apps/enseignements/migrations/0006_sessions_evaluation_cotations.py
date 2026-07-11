from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('enseignements', '0005_cours_points_default'),
        ('etudiants', '0003_etudiant_photo_optimisee'),
    ]

    operations = [
        migrations.CreateModel(
            name='SessionEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=120)),
                ('date_debut', models.DateField()),
                ('date_fin', models.DateField()),
                ('description', models.TextField(blank=True)),
                ('est_active', models.BooleanField(default=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('annee_academique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessions_evaluation', to='etudiants.anneeacademique')),
            ],
            options={'ordering': ['-date_debut', 'nom'], 'unique_together': {('nom', 'annee_academique')}},
        ),
        migrations.CreateModel(
            name='CotationSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('points_tp', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('points_interro', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('points_examen', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('total', models.DecimalField(decimal_places=2, default=0, editable=False, max_digits=6)),
                ('observation', models.CharField(blank=True, max_length=255)),
                ('date_evaluation', models.DateTimeField(auto_now=True)),
                ('application', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cotations', to='enseignements.appliquercours')),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='cotations', to='enseignements.sessionevaluation')),
            ],
            options={'unique_together': {('application', 'session')}},
        ),
    ]
