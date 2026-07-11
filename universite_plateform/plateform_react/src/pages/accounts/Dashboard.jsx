import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, BadgeCheck, Banknote, BookOpen, Building2,
  CalendarDays, ChevronRight, CircleDollarSign, Clock3,
  LayoutDashboard, Plus, ReceiptText, RefreshCw,
  School, Search, Users, WalletCards,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { anneeApi, etudiantApi, faculteApi, promotionApi } from '../../services';
import { fraisApi } from '../../services/frais';
import { universityApi } from '../../services/universityApi';

const liste = (valeur) => Array.isArray(valeur) ? valeur : (valeur?.results || []);
const monnaie = (valeur) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(valeur) || 0);
const dateCourte = (valeur) => valeur ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(valeur)) : '—';

const CarteStatistique = ({ icon: Icon, label, valeur, detail, couleur }) => (
  <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{valeur}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>
      <div className={`rounded-2xl p-3 text-white shadow-sm ${couleur}`}><Icon className="h-6 w-6" /></div>
    </div>
  </article>
);

const Dashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState({ etudiants: [], annees: [], facultes: [], promotions: [], frais: [], paiements: [], universite: null });
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);

  const chargerDashboard = async (anneeId = null) => {
    setLoading(true);
    setErreur('');
    const requetes = await Promise.allSettled([
      anneeApi.getAll(), etudiantApi.getAll(), faculteApi.getAll(), promotionApi.getAll(),
      fraisApi.getFrais(), fraisApi.getPaiements(), universityApi.getIdentity(),
    ]);

    const valeur = (index, axios = true) => requetes[index].status === 'fulfilled'
      ? (axios ? requetes[index].value.data : requetes[index].value)
      : [];

    const annees = liste(valeur(0));
    const anneeActive = annees.find((annee) => String(annee.id) === String(anneeId))
      || annees.find((annee) => annee.est_active)
      || annees[0];
    setAnneeSelectionnee(anneeActive?.id || null);
    let etudiants = liste(valeur(1));
    if (anneeActive) {
      try {
        const [etudiantsReponse, fraisReponse, paiementsReponse] = await Promise.all([
          etudiantApi.getAll(anneeActive.id),
          fraisApi.getFrais(anneeActive.id),
          fraisApi.getPaiements(anneeActive.id),
        ]);
        etudiants = liste(etudiantsReponse.data);
        requetes[4] = { status: 'fulfilled', value: fraisReponse };
        requetes[5] = { status: 'fulfilled', value: paiementsReponse };
      } catch { /* conserve les données disponibles */ }
    }

    setDonnees({
      annees,
      etudiants,
      facultes: liste(valeur(2)),
      promotions: liste(valeur(3)),
      frais: liste(valeur(4, false)),
      paiements: liste(valeur(5, false)),
      universite: requetes[6].status === 'fulfilled' ? requetes[6].value : null,
    });
    if (requetes.some((requete) => requete.status === 'rejected')) setErreur('Certaines données n’ont pas pu être chargées. Les informations disponibles restent affichées.');
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    // Le chargement initial synchronise ce tableau avec les API métier.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    chargerDashboard();
  }, [isAuthenticated, navigate]);

  const anneeActive = donnees.annees.find((annee) => String(annee.id) === String(anneeSelectionnee));
  const payes = donnees.etudiants.filter((etudiant) => etudiant.statut_frais === 'PAYE').length;
  const partiels = donnees.etudiants.filter((etudiant) => etudiant.statut_frais === 'PARTIEL').length;
  const impayes = donnees.etudiants.filter((etudiant) => etudiant.statut_frais === 'IMPAYE').length;
  const montantEncaisse = donnees.paiements
    .filter((paiement) => paiement.statut === 'valide')
    .reduce((total, paiement) => total + Number(paiement.montant_paye || 0), 0);
  const tauxPaiement = donnees.etudiants.length ? Math.round((payes / donnees.etudiants.length) * 100) : 0;

  const repartition = useMemo(() => donnees.facultes.map((faculte) => {
    const total = donnees.etudiants.filter((etudiant) => String(etudiant.faculte) === String(faculte.id) || etudiant.faculte_nom === faculte.nom).length;
    return { ...faculte, total };
  }).sort((a, b) => b.total - a.total).slice(0, 5), [donnees.facultes, donnees.etudiants]);

  const paiementsRecents = [...donnees.paiements].sort((a, b) => new Date(b.date_paiement || b.date || b.created_at) - new Date(a.date_paiement || a.date || a.created_at)).slice(0, 5);
  const nomUtilisateur = user?.first_name || user?.username || 'Utilisateur';

  const accesRapides = [
    { to: '/etudiants/nouveau', label: 'Inscrire un étudiant', detail: 'Créer un nouveau dossier', icon: Plus, couleur: 'bg-indigo-600' },
    { to: '/etudiants', label: 'Liste des étudiants', detail: 'Consulter et rechercher', icon: Search, couleur: 'bg-sky-600' },
    { to: '/frais', label: 'Gestion des frais', detail: 'Tarifs et paiements', icon: WalletCards, couleur: 'bg-emerald-600' },
    { to: '/enseignements', label: 'Enseignements', detail: 'Cours et applications', icon: BookOpen, couleur: 'bg-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80">
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-200"><LayoutDashboard className="h-4 w-4" />Tableau de bord administratif</div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Bonjour, {nomUtilisateur}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/75">Vue d’ensemble de {donnees.universite?.nom || 'votre université'} pour l’année académique en cours.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select value={anneeSelectionnee || ''} onChange={(e) => chargerDashboard(e.target.value)} className="rounded-xl border border-white/15 bg-indigo-950 px-4 py-3 text-sm font-bold text-white">
                {donnees.annees.map((annee) => <option key={annee.id} value={annee.id}>{annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}</option>)}
              </select>
              <button onClick={() => chargerDashboard(anneeSelectionnee)} disabled={loading} title="Actualiser" className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>
        </section>

        {erreur && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{erreur}</div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CarteStatistique icon={Users} label="Étudiants inscrits" valeur={loading ? '—' : donnees.etudiants.length} detail={anneeActive?.nom || 'Toutes années'} couleur="bg-indigo-600" />
          <CarteStatistique icon={Building2} label="Facultés" valeur={loading ? '—' : donnees.facultes.length} detail={`${donnees.promotions.length} promotion${donnees.promotions.length > 1 ? 's' : ''}`} couleur="bg-sky-600" />
          <CarteStatistique icon={BadgeCheck} label="Frais entièrement payés" valeur={loading ? '—' : `${tauxPaiement}%`} detail={`${payes} étudiant${payes > 1 ? 's' : ''} en ordre`} couleur="bg-emerald-600" />
          <CarteStatistique icon={Banknote} label="Montant encaissé" valeur={loading ? '—' : monnaie(montantEncaisse)} detail="Paiements validés uniquement" couleur="bg-violet-600" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Situation financière des étudiants</h2><p className="mt-1 text-sm text-slate-500">Répartition selon le statut des frais académiques.</p></div><CircleDollarSign className="h-6 w-6 text-slate-300" /></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[{ label: 'Payés', valeur: payes, icon: BadgeCheck, classes: 'bg-emerald-50 text-emerald-700' }, { label: 'Partiels', valeur: partiels, icon: Clock3, classes: 'bg-amber-50 text-amber-700' }, { label: 'Impayés', valeur: impayes, icon: ReceiptText, classes: 'bg-rose-50 text-rose-700' }].map(({ label, valeur, icon: Icon, classes }) => (
                <div key={label} className={`rounded-2xl p-5 ${classes}`}><Icon className="h-6 w-6" /><p className="mt-4 text-3xl font-bold">{valeur}</p><p className="mt-1 text-sm font-semibold">{label}</p></div>
              ))}
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${tauxPaiement}%` }} /></div>
            <div className="mt-2 flex justify-between text-xs text-slate-400"><span>Taux de paiement complet</span><span className="font-bold text-emerald-700">{tauxPaiement}%</span></div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Accès rapides</h2><p className="mt-1 text-sm text-slate-500">Vos opérations les plus fréquentes.</p>
            <div className="mt-5 space-y-3">{accesRapides.map(({ to, label, detail, icon: Icon, couleur }) => <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"><span className={`rounded-xl p-2.5 text-white ${couleur}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{label}</span><span className="block text-xs text-slate-400">{detail}</span></span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" /></Link>)}</div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Étudiants par faculté</h2><p className="mt-1 text-sm text-slate-500">Principales répartitions des inscriptions.</p></div><School className="h-6 w-6 text-slate-300" /></div>
            <div className="mt-6 space-y-5">{repartition.length ? repartition.map((faculte) => { const pourcentage = donnees.etudiants.length ? Math.round((faculte.total / donnees.etudiants.length) * 100) : 0; return <div key={faculte.id}><div className="mb-2 flex justify-between text-sm"><span className="truncate font-semibold text-slate-700">{faculte.nom}</span><span className="ml-3 text-slate-400">{faculte.total}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${pourcentage}%` }} /></div></div>; }) : <p className="py-10 text-center text-sm text-slate-400">Aucune donnée disponible.</p>}</div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-900">Paiements récents</h2><p className="mt-1 text-sm text-slate-500">Dernières opérations enregistrées.</p></div><Link to="/frais" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">Voir tout<ArrowUpRight className="h-4 w-4" /></Link></div>
            <div className="divide-y divide-slate-100">{paiementsRecents.length ? paiementsRecents.map((paiement, index) => <div key={paiement.id || index} className="flex items-center gap-4 px-6 py-4"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Banknote className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{paiement.etudiant || `Paiement n° ${paiement.id || index + 1}`}</p><p className="mt-0.5 text-xs text-slate-400">{dateCourte(paiement.date_paiement || paiement.date_creation)}</p></div><p className="whitespace-nowrap text-sm font-bold text-emerald-700">{monnaie(paiement.montant_paye)}</p></div>) : <div className="px-6 py-14 text-center"><CalendarDays className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm text-slate-400">Aucun paiement enregistré.</p></div>}</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
