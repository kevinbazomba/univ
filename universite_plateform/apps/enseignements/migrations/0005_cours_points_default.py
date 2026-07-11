from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('enseignements', '0004_appliquercours_details_cotation')]

    operations = [
        migrations.AlterField(
            model_name='cours',
            name='points',
            field=models.IntegerField(default=20),
        ),
    ]
