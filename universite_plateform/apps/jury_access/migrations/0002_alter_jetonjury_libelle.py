from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jury_access', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='jetonjury',
            name='libelle',
            field=models.CharField(blank=True, max_length=150, verbose_name='Nom du jeton'),
        ),
    ]
