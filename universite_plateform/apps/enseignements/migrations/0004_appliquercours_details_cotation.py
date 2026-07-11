from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('enseignements', '0003_appliquercours_evaluation'),
    ]

    operations = [
        migrations.AddField(
            model_name='appliquercours',
            name='points_tp',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='appliquercours',
            name='points_interro',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='appliquercours',
            name='points_examen',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
