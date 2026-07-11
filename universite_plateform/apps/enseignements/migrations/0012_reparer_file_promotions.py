import re

from django.db import migrations


def reparer_file_promotions(apps, schema_editor):
    Promotion = apps.get_model('etudiants', 'Promotion')
    Inscription = apps.get_model('etudiants', 'InscriptionAcademique')
    Decision = apps.get_model('enseignements', 'DecisionJury')
    Attente = apps.get_model('enseignements', 'PromotionEnAttente')

    for promotion in Promotion.objects.all():
        correspondance = re.match(r'^[A-Z]+\s*(\d+)$', (promotion.code or promotion.nom or '').upper())
        if correspondance and promotion.ordre == 0:
            promotion.ordre = int(correspondance.group(1))
            promotion.save(update_fields=['ordre'])

    for inscription in Inscription.objects.select_related('promotion'):
        decision = Decision.objects.filter(
            etudiant_id=inscription.etudiant_id,
            session__annee_academique_id=inscription.annee_academique_id,
            session__est_cloture=True,
        ).order_by('-session__date_fin', '-id').first()
        if not decision or decision.decision != 'ADMIS':
            Attente.objects.filter(inscription_origine_id=inscription.id).delete()
            continue
        promotion_cible = Promotion.objects.filter(
            ordre__gt=inscription.promotion.ordre,
        ).order_by('ordre', 'id').first()
        Attente.objects.update_or_create(
            inscription_origine_id=inscription.id,
            defaults={
                'decision_id': decision.id,
                'promotion_cible_id': promotion_cible.id if promotion_cible else None,
                'statut': 'EN_ATTENTE' if promotion_cible else 'BLOQUE',
                'message': '' if promotion_cible else 'Aucun niveau supérieur configuré.',
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('enseignements', '0011_alter_promotionenattente_inscription_origine'),
        ('etudiants', '0007_inscriptionacademique'),
    ]

    operations = [
        migrations.RunPython(reparer_file_promotions, migrations.RunPython.noop),
    ]
