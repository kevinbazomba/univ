from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('enseignements', '0013_restaurer_decisions_collectives'),
        ('etudiants', '0007_inscriptionacademique'),
    ]

    operations = [
        migrations.AddField(
            model_name='gestionapplicationcours',
            name='departement',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='etudiants.departement',
            ),
        ),
    ]
