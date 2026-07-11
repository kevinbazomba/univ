from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('etudiants', '0003_etudiant_photo_optimisee')]
    operations = [
        migrations.CreateModel(name='Departement', fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('nom', models.CharField(max_length=120)), ('code', models.CharField(max_length=20, unique=True)),
            ('description', models.TextField(blank=True)), ('est_actif', models.BooleanField(default=True)),
            ('faculte', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='departements', to='etudiants.faculte')),
        ], options={'ordering': ['faculte__nom', 'nom'], 'unique_together': {('faculte', 'nom')}}),
        migrations.AddField(model_name='etudiant', name='departement', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='etudiants', to='etudiants.departement', verbose_name='Département')),
    ]
