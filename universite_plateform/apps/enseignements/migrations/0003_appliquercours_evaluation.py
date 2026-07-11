from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('enseignements', '0002_remove_sessionconnexion_enseignemen_token_faf33e_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='appliquercours',
            name='points_obtenus',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name='appliquercours',
            name='observation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='appliquercours',
            name='date_evaluation',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
