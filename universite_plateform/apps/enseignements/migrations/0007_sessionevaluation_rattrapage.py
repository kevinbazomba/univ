from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('enseignements', '0006_sessions_evaluation_cotations')]

    operations = [
        migrations.AddField(
            model_name='sessionevaluation',
            name='est_rattrapage',
            field=models.BooleanField(default=False, verbose_name='Session de rattrapage'),
        ),
        migrations.AddField(
            model_name='sessionevaluation',
            name='session_origine',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='sessions_rattrapage', to='enseignements.sessionevaluation', verbose_name='Session remplacée'),
        ),
    ]
