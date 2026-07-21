from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('enseignements', '0016_cotationsession_deliberation_jury'),
    ]

    operations = [
        migrations.AddField(
            model_name='sessionevaluation',
            name='est_fin_annee',
            field=models.BooleanField(default=False, verbose_name="Clôture de fin d'année"),
        ),
        migrations.AlterField(
            model_name='decisionjury',
            name='decision',
            field=models.CharField(choices=[
                ('EN_ATTENTE', 'En attente'),
                ('ADMIS', 'Admis'),
                ('AJOURNE', 'Ajourné'),
                ('NON_ADMIS', 'Non admis'),
                ('S', 'Satisfait'),
                ('D', 'Distinction'),
                ('GD', 'Grande distinction'),
                ('AA', 'Assimilé ajourné'),
                ('A', 'Ajourné'),
                ('NF', 'Naf'),
            ], default='EN_ATTENTE', max_length=20),
        ),
    ]
