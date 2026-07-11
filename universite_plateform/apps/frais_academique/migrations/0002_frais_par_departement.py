from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('frais_academique', '0001_initial'), ('etudiants', '0006_etudiant_matricule_automatique')]
    operations = [
        migrations.AddField(model_name='tariffrais', name='departement', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tarifs_frais', to='etudiants.departement', verbose_name='Département')),
        migrations.AddField(model_name='fraisacademique', name='departement', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='frais_academiques', to='etudiants.departement', verbose_name='Département')),
        migrations.AlterUniqueTogether(name='tariffrais', unique_together={('faculte','departement','promotion','option_specialisation','semestre','type_frais','annee_academique')}),
    ]
