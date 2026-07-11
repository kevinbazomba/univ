from django.db import migrations, models
import universite_plateform.image_utils


class Migration(migrations.Migration):
    dependencies = [('accounts', '0001_initial')]

    operations = [
        migrations.AddField(
            model_name='identiteuniversite',
            name='logo',
            field=models.ImageField(
                blank=True,
                help_text='JPG, PNG, WebP ou GIF. Conversion automatique en GIF optimisé.',
                null=True,
                upload_to='universite/',
                validators=[universite_plateform.image_utils.validate_image_upload],
            ),
        ),
    ]
