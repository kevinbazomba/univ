from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('enseignements', '0015_fusioncoursjury'),
    ]

    operations = [
        migrations.AddField(
            model_name='cotationsession',
            name='delibere_par_jury',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='cotationsession',
            name='date_deliberation_jury',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
