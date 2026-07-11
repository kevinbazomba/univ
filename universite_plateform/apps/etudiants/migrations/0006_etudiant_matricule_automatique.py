from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('etudiants', '0005_alter_departement_options')]

    operations = [
        migrations.AlterField(
            model_name='etudiant',
            name='matricule',
            field=models.CharField(blank=True, editable=False, max_length=50, unique=True, verbose_name='Matricule'),
        ),
    ]
