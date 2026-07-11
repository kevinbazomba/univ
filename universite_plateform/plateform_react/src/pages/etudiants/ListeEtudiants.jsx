import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Users,
  WalletCards,
} from 'lucide-react';
import { anneeApi, etudiantApi } from '../../services';

const statuts = {
  PAYE: { label: 'Payé', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  IMPAYE: { label: 'Impayé', classes: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
  PARTIEL: { label: 'Partiel', classes: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  EXONERE: { label: 'Exonéré', classes: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
  NON_APPLIQUE: { label: 'Aucun frais', classes: 'bg-slate-100 text-slate-600 ring-slate-500/20' },
};

const ListeEtudiants = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutSelectionne, setStatutSelectionne] = useState('TOUS');
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);
  const [annees, setAnnees] = useState([]);

  useEffect(() => {
    const chargerAnnees = async () => {
      try {
        const response = await anneeApi.getAll();
        setAnnees(response.data || []);
        const active = response.data.find((annee) => annee.est_active);
        if (active) setAnneeSelectionnee(active.id);
        else setLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };
    chargerAnnees();
  }, []);

  useEffect(() => {
    if (anneeSelectionnee === null) return;

    const chargerEtudiants = async () => {
      setLoading(true);
      try {
        const response = await etudiantApi.getAll(anneeSelectionnee);
        setEtudiants(response.data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    chargerEtudiants();
  }, [anneeSelectionnee]);

  const rechercher = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    try {
      if (value.trim().length > 2) {
        const response = await etudiantApi.search(value.trim(), anneeSelectionnee);
        setEtudiants(response.data);
      } else if (value.length === 0) {
        const response = await etudiantApi.getAll(anneeSelectionnee);
        setEtudiants(response.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const etudiantsFiltres = useMemo(
    () => statutSelectionne === 'TOUS'
      ? etudiants
      : etudiants.filter((etudiant) => etudiant.statut_frais === statutSelectionne),
    [etudiants, statutSelectionne],
  );

  const totalParStatut = (statut) => etudiants.filter(
    (etudiant) => etudiant.statut_frais === statut,
  ).length;
  const anneeModifiable = Boolean(annees.find((annee) => String(annee.id) === String(anneeSelectionnee))?.est_active);

  const getStatutBadge = (statut) => {
    const configuration = statuts[statut] || {
      label: statut || 'Non défini',
      classes: 'bg-slate-50 text-slate-600 ring-slate-500/20',
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${configuration.classes}`}>
        {configuration.label}
      </span>
    );
  };

  const statistiques = [
    { label: 'Total étudiants', valeur: etudiants.length, icon: Users, couleur: 'bg-indigo-600', fond: 'from-indigo-50 to-white' },
    { label: 'Frais payés', valeur: totalParStatut('PAYE'), icon: BadgeCheck, couleur: 'bg-emerald-600', fond: 'from-emerald-50 to-white' },
    { label: 'Paiements partiels', valeur: totalParStatut('PARTIEL'), icon: Clock3, couleur: 'bg-amber-500', fond: 'from-amber-50 to-white' },
    { label: 'Frais impayés', valeur: totalParStatut('IMPAYE'), icon: CircleDollarSign, couleur: 'bg-rose-600', fond: 'from-rose-50 to-white' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-200">
                <GraduationCap className="h-4 w-4" />
                Gestion académique
                <ChevronRight className="h-4 w-4" />
                Étudiants
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Liste des étudiants</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80">
                Consultez les inscriptions, les promotions et la situation des frais académiques.
              </p>
            </div>
            {anneeModifiable && <Link
              to="/etudiants/nouveau"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              Nouvel étudiant
            </Link>}
          </div>
        </section>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistiques.map(({ label, valeur, icon: Icon, couleur, fond }) => (
            <article key={label} className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br ${fond} p-5 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{valeur}</p>
                </div>
                <div className={`rounded-2xl ${couleur} p-3 text-white shadow-sm`}><Icon className="h-6 w-6" /></div>
              </div>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {!anneeModifiable && <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">Année clôturée — consultation uniquement.</div>}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchTerm}
                onChange={rechercher}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-1 lg:pb-0">
              <select
                value={anneeSelectionnee || ''}
                onChange={(event) => setAnneeSelectionnee(Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700"
                aria-label="Année académique"
              >
                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}
                  </option>
                ))}
              </select>
              {['TOUS', 'PAYE', 'PARTIEL', 'IMPAYE', 'NON_APPLIQUE'].map((statut) => (
                <button
                  key={statut}
                  type="button"
                  onClick={() => setStatutSelectionne(statut)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    statutSelectionne === statut
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {statut === 'TOUS' ? 'Tous' : statuts[statut].label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  {['Étudiant', 'Matricule', 'Faculté', 'Promotion', 'Téléphone', 'Frais', 'Actions'].map((titre) => (
                    <th key={titre} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">{titre}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-16 text-center text-sm text-slate-500">Chargement des étudiants...</td></tr>
                ) : etudiantsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <WalletCards className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-700">Aucun étudiant trouvé</p>
                      <p className="mt-1 text-sm text-slate-400">Modifiez votre recherche ou le filtre sélectionné.</p>
                    </td>
                  </tr>
                ) : etudiantsFiltres.map((etudiant) => (
                  <tr key={etudiant.id} className="group transition hover:bg-indigo-50/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 ring-1 ring-indigo-200">
                          {etudiant.photo ? (
                            <img src={etudiant.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-sm font-bold text-indigo-700">{etudiant.nom_complet?.[0] || 'E'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{etudiant.nom_complet}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{etudiant.email || 'Email non renseigné'}</p>
                          {!etudiant.est_actif && (
                            <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-600/20">
                              Compte inactif
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-semibold text-slate-600">{etudiant.matricule}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{etudiant.faculte_nom || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{etudiant.promotion_nom || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{etudiant.telephone || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4">{getStatutBadge(etudiant.statut_frais)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/etudiants/${etudiant.id}?annee_academique=${anneeSelectionnee}`} title="Voir le dossier" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Eye className="h-4 w-4" /></Link>
                        {anneeModifiable && <Link to={`/etudiants/modifier/${etudiant.id}`} title="Modifier" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><Pencil className="h-4 w-4" /></Link>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{etudiantsFiltres.length}</span> étudiant{etudiantsFiltres.length > 1 ? 's' : ''} affiché{etudiantsFiltres.length > 1 ? 's' : ''}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ListeEtudiants;
