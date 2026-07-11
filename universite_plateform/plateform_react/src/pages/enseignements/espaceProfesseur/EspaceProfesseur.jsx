import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CalendarDays, ClipboardList, GraduationCap, KeyRound,
  LogOut, Mail, Pencil, Phone, Save, ShieldCheck, UserRound,
  Users, X, Eye, EyeOff,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import useAuthStore from '../../../store/authStore';
import { professeurService } from '../../../services/enseignements';
import { universityApi } from '../../../services/universityApi';
import {
  ApplicationsManagement,
  CoursesManagement,
  StudentsManagement,
} from './GestionPedagogique';

const tabs = [
  { id: 'profil', label: 'Mon profil', icon: UserRound },
  { id: 'cours', label: 'Mes cours', icon: BookOpen },
  { id: 'applications', label: 'Mes applications', icon: ClipboardList },
  { id: 'etudiants', label: 'Étudiants & points', icon: Users },
  { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
];

const EspaceProfesseur = () => {
  const [space, setSpace] = useState(null);
  const [activeTab, setActiveTab] = useState('profil');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [university, setUniversity] = useState(null);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    universityApi.getIdentity().then(setUniversity).catch(() => null);
  }, []);

  useEffect(() => {
    professeurService.getMonEspace()
      .then((data) => {
        setSpace(data);
        setForm(data.professeur);
        setAnneeSelectionnee(data.annee_selectionnee?.id || null);
      })
      .catch(async (error) => {
        toast.error(error.response?.data?.error || 'Impossible de charger votre espace');
        if ([401, 403].includes(error.response?.status)) {
          await logout();
          navigate('/login', { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [logout, navigate]);

  async function refreshSpace() {
    const data = await professeurService.getMonEspace(anneeSelectionnee);
    setSpace(data);
    return data;
  
  }

  async function changerAnnee(anneeId) {
    setLoading(true);
    try {
      const data = await professeurService.getMonEspace(anneeId);
      setSpace(data);
      setAnneeSelectionnee(data.annee_selectionnee?.id || Number(anneeId));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Impossible de charger cette année académique");
    } finally {
      setLoading(false);
    }
  
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await professeurService.updateMonProfil({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone || '',
        specialite: form.specialite || '',
      });
      setSpace(data);
      setForm(data.professeur);
      setEditing(false);
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error(error);
      const details = error.response?.data;
      const message = details && typeof details === 'object'
        ? Object.values(details).flat()[0]
        : 'Impossible de modifier le profil';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  
  }

  async function changePassword(event) {
    event.preventDefault();
    if (passwords.nouveau_mot_de_passe !== passwords.confirmer_mot_de_passe) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setSaving(true);
    try {
      await professeurService.changeMyPassword(passwords);
      setPasswords({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmer_mot_de_passe: '',
      });
      toast.success('Mot de passe modifié');
    } catch (error) {
      console.error(error);
      const details = error.response?.data;
      const message = details?.error || Object.values(details || {}).flat()[0]
        || 'Impossible de modifier le mot de passe';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Chargement de votre espace...</div>;
  }

  if (!space) return null;

  const { professeur, cours, gestions, statistiques } = space;
  const anneeCourante = space.annee_selectionnee;
  const anneeModifiable = Boolean(anneeCourante?.est_active);

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" richColors />

      <header className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500 p-2.5">
              {university?.logo || university?.logo_url ? (
                <img
                  src={university.logo || university.logo_url}
                  alt={`Logo ${university?.sigle || university?.nom || 'université'}`}
                  className="h-6 w-6 rounded-md object-contain"
                />
              ) : (
                <GraduationCap className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-semibold">{university?.sigle || university?.nom || 'Université'}</p>
              <p className="text-xs text-indigo-200">Espace professeur · {professeur.matricule}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
                {professeur.prenom?.[0]}{professeur.nom?.[0]}
              </div>
              <div>
                <p className="text-sm text-indigo-100">Bienvenue dans votre espace personnel</p>
                <h1 className="text-3xl font-bold">{professeur.prenom} {professeur.nom}</h1>
                <p className="mt-1 text-indigo-100">{professeur.faculte_nom} · {professeur.specialite || 'Spécialité non renseignée'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat value={statistiques.nombre_cours} label="Cours" />
              <Stat value={statistiques.nombre_gestions} label="Applications" />
              <Stat value={statistiques.nombre_etudiants} label="Étudiants" />
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Période académique affichée</p><p className="mt-1 text-sm text-white/80">{anneeCourante ? `${anneeCourante.date_debut} — ${anneeCourante.date_fin}` : 'Aucune année configurée'}</p></div>
            <div className="flex items-center gap-3"><select value={anneeSelectionnee || ''} onChange={(e) => changerAnnee(e.target.value)} className="rounded-xl border border-white/20 bg-indigo-950 px-4 py-2.5 text-sm font-bold text-white">{space.options?.annees?.map((annee) => <option key={annee.id} value={annee.id}>{annee.nom}{annee.est_active ? ' · Active' : ' · Consultation'}</option>)}</select><span className={`rounded-full px-3 py-2 text-xs font-bold ${anneeModifiable ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'}`}>{anneeModifiable ? 'Modification autorisée' : 'Lecture seule'}</span></div>
          </div>
        </section>

        <nav className="flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        {activeTab === 'profil' && (
          <ProfileSection
            professeur={professeur}
            form={form}
            setForm={setForm}
            editing={editing}
            setEditing={setEditing}
            saving={saving}
            onSave={saveProfile}
          />
        )}
        {activeTab === 'cours' && <CoursesManagement courses={cours} onRefresh={refreshSpace} />}
        {activeTab === 'applications' && (
          <ApplicationsManagement
            applications={gestions}
            courses={cours}
            options={space.options || {}}
            annee={anneeCourante}
            readOnly={!anneeModifiable}
            onRefresh={refreshSpace}
          />
        )}
        {activeTab === 'etudiants' && (
          <StudentsManagement
            students={space.etudiants_appliques || []}
            courses={cours}
            applications={gestions}
            sessions={space.options?.sessions || []}
            readOnly={!anneeModifiable}
            onRefresh={refreshSpace}
          />
        )}
        {activeTab === 'securite' && (
          <SecuritySection
            passwords={passwords}
            setPasswords={setPasswords}
            saving={saving}
            onSubmit={changePassword}
          />
        )}
      </main>
    </div>
  );
};

const ProfileSection = ({ professeur, form, setForm, editing, setEditing, saving, onSave }) => (
  <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <div className="mb-6 flex items-center justify-between">
      <div><h2 className="text-xl font-bold text-slate-900">Mes informations</h2><p className="text-sm text-slate-500">Vos informations personnelles et professionnelles.</p></div>
      {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"><Pencil className="h-4 w-4" /> Modifier</button>}
    </div>
    {editing ? (
      <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
        {[
          ['nom', 'Nom', 'text'], ['prenom', 'Prénom', 'text'], ['email', 'Email', 'email'],
          ['telephone', 'Téléphone', 'tel'], ['specialite', 'Spécialité', 'text'],
        ].map(([name, label, type]) => (
          <label key={name} className="text-sm font-medium text-slate-700">{label}
            <input type={type} value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" required={['nom', 'prenom', 'email'].includes(name)} />
          </label>
        ))}
        <div className="flex justify-end gap-3 md:col-span-2">
          <button type="button" onClick={() => { setForm(professeur); setEditing(false); }} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><X className="h-4 w-4" /> Annuler</button>
          <button disabled={saving} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    ) : (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Info icon={UserRound} label="Nom complet" value={`${professeur.prenom} ${professeur.nom}`} />
        <Info icon={Mail} label="Email" value={professeur.email} />
        <Info icon={Phone} label="Téléphone" value={professeur.telephone} />
        <Info icon={GraduationCap} label="Faculté" value={professeur.faculte_nom} />
        <Info icon={BookOpen} label="Spécialité" value={professeur.specialite} />
        <Info icon={CalendarDays} label="Date d'embauche" value={professeur.date_embauche} />
      </div>
    )}
  </section>
);

const SecuritySection = ({ passwords, setPasswords, saving, onSubmit }) => {
  const [visibleFields, setVisibleFields] = useState({});

  return (
    <section className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><KeyRound className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-slate-900">Modifier mon mot de passe</h2><p className="text-sm text-slate-500">Le nouveau mot de passe doit contenir au moins 8 caractères.</p></div></div>
      <form onSubmit={onSubmit} className="space-y-4">{[
        ['ancien_mot_de_passe', 'Mot de passe actuel'], ['nouveau_mot_de_passe', 'Nouveau mot de passe'], ['confirmer_mot_de_passe', 'Confirmer le nouveau mot de passe'],
      ].map(([name, label]) => <label key={name} className="block text-sm font-medium text-slate-700">{label}<div className="relative mt-1.5"><input type={visibleFields[name] ? 'text' : 'password'} value={passwords[name]} onChange={(event) => setPasswords({ ...passwords, [name]: event.target.value })} minLength={name === 'ancien_mot_de_passe' ? undefined : 8} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" required /><button type="button" onClick={() => setVisibleFields({...visibleFields, [name]: !visibleFields[name]})} aria-label={visibleFields[name] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">{visibleFields[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>)}<button disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Modification...' : 'Modifier le mot de passe'}</button></form>
    </section>
  );
};

const Stat = ({ value, label }) => <div className="min-w-20 rounded-xl bg-white/15 px-4 py-3 text-center"><p className="text-2xl font-bold">{value}</p><p className="text-xs text-indigo-100">{label}</p></div>;
const Info = ({ icon: Icon, label, value }) => <div className="flex gap-3"><div className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><Icon className="h-4 w-4" /></div><div><p className="text-xs text-slate-500">{label}</p><p className="font-medium text-slate-800">{value || 'Non renseigné'}</p></div></div>;
export default EspaceProfesseur;
