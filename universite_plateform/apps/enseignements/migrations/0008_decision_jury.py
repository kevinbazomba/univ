from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('enseignements', '0007_sessionevaluation_rattrapage'), ('etudiants', '0004_departement_etudiant')]
    operations = [migrations.CreateModel(name='DecisionJury', fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('decision', models.CharField(choices=[('EN_ATTENTE','En attente'),('ADMIS','Admis'),('AJOURNE','Ajourné')], default='EN_ATTENTE', max_length=20)),
        ('resultats_publies', models.BooleanField(default=False)),
        ('mode_approbation', models.CharField(choices=[('INDIVIDUEL','Individuel'),('COLLECTIF','Collectif')], default='INDIVIDUEL', max_length=20)),
        ('date_approbation', models.DateTimeField(blank=True, null=True)), ('observation', models.TextField(blank=True)),
        ('approuve_par', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='decisions_jury_approuvees', to='auth.user')),
        ('etudiant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='decisions_jury', to='etudiants.etudiant')),
        ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='decisions_jury', to='enseignements.sessionevaluation')),
    ], options={'unique_together': {('session','etudiant')}})]
