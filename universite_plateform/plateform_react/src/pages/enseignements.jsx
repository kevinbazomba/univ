import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, GraduationCap, Layers3, Plus, RefreshCw, School,
  Sparkles, UserPlus, UsersRound,
} from 'lucide-react';
import { professeurService } from '../services/enseignements/professeurService';
import { coursService } from '../services/enseignements/coursService';
import { gestionApplicationService } from '../services/enseignements/gestionApplicationService';
import { appliquerCoursService } from '../services/enseignements/appliquerCoursService';
import { universityApi } from '../services/universityApi';

const liste = (valeur) => Array.isArray(valeur) ? valeur : (valeur?.results || []);

const CarteStatistique = ({ icon: Icon, label, valeur, detail, couleur }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{valeur}</p>
        <p className="mt-2 text-xs text-slate-400">{detail}</p>
      </div>
      <div className={`rounded-2xl p-3 text-white shadow-sm ${couleur}`}><Icon className="h-6 w-6" /></div>
    </div>
  </article>
);

const EnseignementsDashboard = () => {
  const [donnees, setDonnees] = useState({ professeurs: [], cours: [], gestions: [], applications: [], universite: null });
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  async function chargerDonnees() {
    setLoading(true);
    setErreur('');
    const resultats = await Promise.allSettled([
      professeurService.getAll(),
      coursService.getAll(),
      gestionApplicationService.getAll(),
      appliquerCoursService.getAll(),
      universityApi.getIdentity(),
    ]);
    const reponse = (index) => resultats[index].status === 'fulfilled' ? resultats[index].value.data : [];
    setDonnees({
      professeurs: liste(reponse(0)),
      cours: liste(reponse(1)),
      gestions: liste(reponse(2)),
      applications: liste(reponse(3)),
      universite: resultats[4].status === 'fulfilled' ? resultats[4].value : null,
    });
    if (resultats.some((resultat) => resultat.status === 'rejected')) {
      setErreur('Certaines données ne sont pas disponibles. Les informations chargées restent affichées.');
    }
    setLoading(false);
  
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    chargerDonnees();
  }, []);

  const professeursActifs = donnees.professeurs.filter((professeur) => professeur.est_actif !== false).length;
  const applicationsActives = donnees.applications.filter((application) => application.est_actif !== false).length;
  const coursRecents = donnees.cours.slice(0, 5);

  const statistiques = [
    { icon: UsersRound, label: 'Professeurs', valeur: donnees.professeurs.length, detail: `${professeursActifs} compte${professeursActifs > 1 ? 's' : ''} actif${professeursActifs > 1 ? 's' : ''}`, couleur: 'bg-indigo-600' },
    { icon: BookOpen, label: 'Cours enregistrés', valeur: donnees.cours.length, detail: 'Catalogue des enseignements', couleur: 'bg-sky-600' },
    { icon: ClipboardList, label: 'Plans d’application', valeur: donnees.gestions.length, detail: 'Cours affectés par promotion', couleur: 'bg-violet-600' },
    { icon: CheckCircle2, label: 'Affectations actives', valeur: applicationsActives, detail: `${donnees.applications.length} affectation${donnees.applications.length > 1 ? 's' : ''} au total`, couleur: 'bg-emerald-600' },
  ];

  const modules = [
    { to: '/enseignements/professeurs', title: 'Corps enseignant', description: 'Gérer les profils, facultés et informations des professeurs.', icon: UsersRound, couleur: 'from-indigo-600 to-indigo-700', action: 'Voir les professeurs' },
    { to: '/enseignements/cours', title: 'Catalogue des cours', description: 'Créer, consulter et organiser les unités d’enseignement.', icon: BookOpen, couleur: 'from-sky-600 to-cyan-700', action: 'Voir les cours' },
    { to: '/enseignements/gestion-applications', title: 'Plans d’application', description: 'Affecter les cours aux promotions et années académiques.', icon: Layers3, couleur: 'from-violet-600 to-purple-700', action: 'Gérer les applications' },
    { to: '/enseignements/appliquer-cours', title: 'Étudiants affectés', description: 'Consulter les applications individuelles des cours.', icon: GraduationCap, couleur: 'from-emerald-600 to-teal-700', action: 'Voir les affectations' },
    { to: '/enseignements/grades', title: 'Grades académiques', description: 'Administrer les grades du personnel enseignant.', icon: School, couleur: 'from-amber-500 to-orange-600', action: 'Gérer les grades' },
  ];

  const actions = [
    { to: '/enseignements/professeurs', label: 'Gérer les professeurs', icon: UserPlus },
    { to: '/enseignements/cours', label: 'Gérer les cours', icon: Plus },
    { to: '/enseignements/gestion-applications', label: 'Gérer les applications', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80">
      <main className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8 xl:pl-80">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-200"><Sparkles className="h-4 w-4" />Pilotage académique</div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Gestion des enseignements</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/75">Organisez le corps enseignant, les cours et leur application aux étudiants de {donnees.universite?.sigle || donnees.universite?.nom || 'l’université'}.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/enseignements/cours" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"><BookOpen className="h-4 w-4" />Gérer les cours</Link>
              <button onClick={chargerDonnees} disabled={loading} title="Actualiser" className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>
        </section>

        {erreur && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{erreur}</div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistiques.map((statistique) => <CarteStatistique key={statistique.label} {...statistique} valeur={loading ? '—' : statistique.valeur} />)}
        </section>

        <aside className="mt-6 xl:fixed xl:bottom-6 xl:left-6 xl:top-28 xl:mt-0 xl:w-64 xl:overflow-y-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
            <div className="mb-4 px-2">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Navigation</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Enseignements</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">Accès rapide aux modules</p>
            </div>
            <nav className="space-y-2">
            {modules.map(({ to, title, description, icon: Icon, couleur, action }) => (
              <Link key={to} to={to} title={description} className="group flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-indigo-100 hover:bg-indigo-50">
                <span className={`shrink-0 rounded-xl bg-gradient-to-br p-2.5 text-white shadow-sm ${couleur}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-700 group-hover:text-indigo-800">{title}</span>
                  <span className="block truncate text-[11px] text-slate-400">{action}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
              </Link>
            ))}
            </nav>
          </div>
        </aside>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-900">Cours récemment chargés</h2><p className="mt-1 text-sm text-slate-500">Aperçu du catalogue actuel.</p></div><Link to="/enseignements/cours" className="text-sm font-bold text-indigo-600">Voir tout</Link></div>
            <div className="divide-y divide-slate-100">
              {loading ? <div className="p-10 text-center text-sm text-slate-400">Chargement...</div> : coursRecents.length ? coursRecents.map((cours, index) => (
                <Link key={cours.id || index} to={`/enseignements/cours/${cours.id}`} className="flex items-center gap-4 px-6 py-4 transition hover:bg-indigo-50/40">
                  <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><BookOpen className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{cours.intitule || cours.nom || cours.titre || `Cours n° ${cours.id}`}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{cours.code || cours.faculte_nom || 'Cours universitaire'}</span></span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              )) : <div className="px-6 py-12 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-400">Aucun cours enregistré.</p></div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><CalendarDays className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-slate-900">Actions rapides</h2><p className="text-xs text-slate-400">Créer de nouvelles données</p></div></div>
            <div className="mt-6 space-y-3">{actions.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"><Icon className="h-5 w-5 text-violet-600" /><span className="flex-1">{label}</span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1" /></Link>)}</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EnseignementsDashboard;
