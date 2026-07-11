from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='IdentiteUniversite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=200)),
                ('sigle', models.CharField(blank=True, max_length=30)),
                ('devise', models.CharField(blank=True, max_length=255)),
                ('adresse', models.TextField(blank=True)),
                ('ville', models.CharField(blank=True, max_length=100)),
                ('pays', models.CharField(blank=True, max_length=100)),
                ('telephone', models.CharField(blank=True, max_length=50)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('site_web', models.URLField(blank=True)),
                ('boite_postale', models.CharField(blank=True, max_length=100)),
                ('logo_url', models.URLField(blank=True, help_text='Adresse publique du logo')),
                ('responsable', models.CharField(blank=True, max_length=200)),
                ('date_modification', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': "Identité de l'université",
                'verbose_name_plural': "Identité de l'université",
            },
        ),
    ]
