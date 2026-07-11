from django.db import migrations


def restaurer_decisions_collectives(apps, schema_editor):
    Session = apps.get_model('enseignements', 'SessionEvaluation')
    Decision = apps.get_model('enseignements', 'DecisionJury')
    Attente = apps.get_model('enseignements', 'PromotionEnAttente')
    Inscription = apps.get_model('etudiants', 'InscriptionAcademique')
    Promotion = apps.get_model('etudiants', 'Promotion')

    for session in Session.objects.filter(est_cloture=True):
        modele = Decision.objects.filter(session=session, mode_approbation='COLLECTIF').order_by('id').first()
        if not modele:
            continue
        inscriptions = Inscription.objects.filter(
            annee_academique_id=session.annee_academique_id,
            etudiant__est_actif=True,
        ).select_related('promotion')
        for inscription in inscriptions:
            Decision.objects.get_or_create(
                session_id=session.id,
                etudiant_id=inscription.etudiant_id,
                defaults={
                    'decision': modele.decision,
                    'resultats_publies': modele.resultats_publies,
                    'mode_approbation': 'COLLECTIF',
                    'approuve_par_id': modele.approuve_par_id,
                    'date_approbation': modele.date_approbation,
                    'observation': modele.observation,
                },
            )

    for inscription in Inscription.objects.select_related('promotion'):
        decision = Decision.objects.filter(
            etudiant_id=inscription.etudiant_id,
            session__annee_academique_id=inscription.annee_academique_id,
            session__est_cloture=True,
        ).order_by('-session__date_fin', '-id').first()
        if not decision or decision.decision != 'ADMIS':
            Attente.objects.filter(inscription_origine_id=inscription.id).delete()
            continue
        cible = Promotion.objects.filter(ordre__gt=inscription.promotion.ordre).order_by('ordre', 'id').first()
        Attente.objects.update_or_create(
            inscription_origine_id=inscription.id,
            defaults={
                'decision_id': decision.id,
                'promotion_cible_id': cible.id if cible else None,
                'statut': 'EN_ATTENTE' if cible else 'BLOQUE',
                'message': '' if cible else 'Aucun niveau supérieur configuré.',
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('enseignements', '0012_reparer_file_promotions'),
        ('etudiants', '0007_inscriptionacademique'),
    ]

    operations = [
        migrations.RunPython(restaurer_decisions_collectives, migrations.RunPython.noop),
    ]
