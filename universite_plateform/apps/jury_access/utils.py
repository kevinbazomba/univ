from rest_framework.exceptions import PermissionDenied

from .models import JetonJury


def get_jury_token_from_request(request):
    code = request.headers.get('X-Jury-Token') or request.query_params.get('jury_token')
    if not code:
        raise PermissionDenied('Code jeton du jury requis.')
    try:
        return JetonJury.objects.select_related(
            'annee_academique', 'faculte', 'departement', 'promotion',
        ).get(code=str(code).strip().upper(), est_actif=True)
    except JetonJury.DoesNotExist as exc:
        raise PermissionDenied('Code jeton du jury invalide ou désactivé.') from exc


def filtrer_queryset_par_jeton(queryset, jeton, prefix=''):
    filtres = {f'{prefix}annee_academique_id': jeton.annee_academique_id}
    if jeton.faculte_id:
        filtres[f'{prefix}faculte_id'] = jeton.faculte_id
    if jeton.departement_id:
        filtres[f'{prefix}departement_id'] = jeton.departement_id
    if jeton.promotion_id:
        filtres[f'{prefix}promotion_id'] = jeton.promotion_id
    return queryset.filter(**filtres)

