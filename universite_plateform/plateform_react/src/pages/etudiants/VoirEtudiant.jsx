import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, CalendarDays, GraduationCap, Mail,
  MapPin, Pencil, Phone, ShieldCheck, UserRound,
} from 'lucide-react';
import { etudiantApi } from '../../services';

const Information = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm ring-1 ring-slate-200"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 break-words font-semibold text-slate-800">{value || 'Non renseigné'}</p>
      </div>
    </div>
  </div>
);

const VoirEtudiant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const anneeAcademiqueId = searchParams.get('annee_academique');
  const [etudiant, setEtudiant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        const response = await etudiantApi.getById(id);
        setEtudiant(response.data);
      } catch (erreur) {
        setError(erreur);
      } finally {
        setLoading(false);
      }
    };
    if (id) charger();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
      <div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" /><p className="mt-4 text-sm text-slate-500">Chargement du dossier...</p></div>
    </div>
  );

  if (error || !etudiant) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <UserRound className="mx-auto h-12 w-12 text-rose-300" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Dossier introuvable</h2>
        <p className="mt-2 text-sm text-slate-500">Impossible de charger les informations de cet étudiant.</p>
        <button onClick={() => navigate(-1)} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Retour</button>
      </div>
    </div>
  );

  const inscriptionAffichee = etudiant.parcours_academique?.find(
    (inscription) => String(inscription.annee_academique) === String(anneeAcademiqueId),
  );
  const faculteAffichee = inscriptionAffichee?.faculte_nom || etudiant.faculte_nom;
  const departementAffiche = inscriptionAffichee?.departement_nom || etudiant.departement_nom;
  const promotionAffichee = inscriptionAffichee?.promotion_nom || etudiant.promotion_nom;
  const anneeAffichee = inscriptionAffichee?.annee_academique_nom || etudiant.annee_academique_nom;
  const consultationHistorique = Boolean(inscriptionAffichee && !inscriptionAffichee.est_courante);

  const informations = [
    { icon: UserRound, label: 'Nom complet', value: etudiant.nom_complet },
    { icon: ShieldCheck, label: 'Matricule', value: etudiant.matricule },
    { icon: Building2, label: 'Faculté', value: faculteAffichee },
    { icon: Building2, label: 'Département', value: departementAffiche },
    { icon: GraduationCap, label: 'Promotion', value: promotionAffichee },
    { icon: CalendarDays, label: 'Année académique', value: anneeAffichee },
    { icon: Mail, label: 'Adresse email', value: etudiant.email },
    { icon: Phone, label: 'Téléphone', value: etudiant.telephone },
    { icon: CalendarDays, label: 'Date de naissance', value: etudiant.date_naissance },
    { icon: MapPin, label: 'Adresse', value: etudiant.adresse },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl">
        <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Retour à la liste</button>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 text-white shadow-xl shadow-indigo-950/10">
          <div className="relative flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-white/15 ring-4 ring-white/10">
              {etudiant.photo ? <img src={etudiant.photo} alt={etudiant.nom_complet} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-3xl font-bold">{etudiant.nom_complet?.[0]}</span>}
            </div>
            <div className="relative flex-1">
              <p className="text-sm font-medium text-indigo-200">Dossier étudiant</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{etudiant.nom_complet}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">{etudiant.matricule}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">{promotionAffichee || 'Promotion non définie'}</span>
                {anneeAffichee && <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">{anneeAffichee}</span>}
                {consultationHistorique && <span className="rounded-full bg-amber-300/20 px-3 py-1.5 text-amber-50 ring-1 ring-amber-200/30">Historique</span>}
              </div>
            </div>
            {!consultationHistorique && <Link to={`/etudiants/modifier/${etudiant.id}`} className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-950 shadow-lg transition hover:bg-indigo-50"><Pencil className="h-4 w-4" />Modifier le dossier</Link>}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6"><h2 className="text-xl font-bold text-slate-900">Informations personnelles et académiques</h2><p className="mt-1 text-sm text-slate-500">Informations enregistrées dans le dossier de l’étudiant.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{informations.map((information) => <Information key={information.label} {...information} />)}</div>
        </section>
      </main>
    </div>
  );
};

export default VoirEtudiant;
