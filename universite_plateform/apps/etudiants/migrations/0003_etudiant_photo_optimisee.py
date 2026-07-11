from django.db import migrations, models
import universite_plateform.image_utils


def definir_photo_par_defaut(apps, schema_editor):
    Etudiant = apps.get_model('etudiants', 'Etudiant')
    Etudiant.objects.filter(photo__isnull=True).update(
        photo='photos_etudiants/default-student.svg'
    )
    Etudiant.objects.filter(photo='').update(
        photo='photos_etudiants/default-student.svg'
    )


class Migration(migrations.Migration):
    dependencies = [('etudiants', '0002_etudiant_mot_de_passe')]

    operations = [
        migrations.RunPython(definir_photo_par_defaut, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='etudiant',
            name='photo',
            field=models.ImageField(
                blank=True,
                default='photos_etudiants/default-student.svg',
                upload_to='photos_etudiants/',
                validators=[universite_plateform.image_utils.validate_image_upload],
                verbose_name='Photo',
            ),
        ),
    ]
