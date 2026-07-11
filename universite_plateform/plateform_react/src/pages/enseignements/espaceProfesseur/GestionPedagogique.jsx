import { useMemo, useState } from 'react';
import { BookOpen, ClipboardList, Plus, Search, Save, UserRoundCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { professeurService } from '../../../services/enseignements';

const errorMessage = (error) => {
  const data = error.response?.data;
  if (!data || typeof data !== 'object') return 'Une erreur est survenue';
  return Object.values(data).flat()[0] || 'Une erreur est survenue';
};

export const CoursesManagement = ({ courses, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom_cours: '', ponderation: '1', points: '20', credit: '3', volume_horaire: '', description: '' });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await professeurService.createMyCourse(form);
      toast.success('Cours créé avec succès');
      setShowForm(false);
      setForm({ nom_cours: '', ponderation: '1', points: '20', credit: '3', volume_horaire: '', description: '' });
      await onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  
  }

  return (
    <section>
      <SectionHeader title="Mes cours" subtitle="Cours dont vous êtes responsable." onAdd={() => setShowForm(true)} addLabel="Créer un cours" />
      {showForm && (
        <Panel title="Nouveau cours" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Nom du cours"><input required value={form.nom_cours} onChange={(e) => setForm({...form, nom_cours: e.target.value})} /></Field>
            <Field label="Volume horaire"><input required min="1" type="number" value={form.volume_horaire} onChange={(e) => setForm({...form, volume_horaire: e.target.value})} /></Field>
            <Field label="Pondération"><input required min="0" step="0.01" type="number" value={form.ponderation} onChange={(e) => setForm({...form, ponderation: e.target.value})} /></Field>
            <Field label="Maximum des points"><input required min="1" type="number" value={form.points} onChange={(e) => setForm({...form, points: e.target.value})} /></Field>
            <Field label="Crédits"><input required min="0" step="0.5" type="number" value={form.credit} onChange={(e) => setForm({...form, credit: e.target.value})} /></Field>
            <Field label="Description" wide><textarea rows="3" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}></textarea></Field>
            <Submit saving={saving} label="Créer le cours" />
          </form>
        </Panel>
      )}
      {courses.length === 0 ? <Empty text="Aucun cours créé." /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => (
          <article key={course.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex justify-between"><BookOpen className="h-6 w-6 text-indigo-600" /><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{course.code_cours}</span></div>
            <h3 className="font-bold text-slate-900">{course.nom_cours}</h3>
            <p className="mt-2 text-sm text-slate-500">{course.description || 'Aucune description'}</p>
            <div className="mt-4 grid grid-cols-3 border-t pt-4 text-center text-xs"><span><b className="block">{course.credit}</b>Crédits</span><span><b className="block">{course.points}</b>Points</span><span><b className="block">{course.volume_horaire}h</b>Volume</span></div>
          </article>
        ))}</div>
      )}
    </section>
  );
};

export const ApplicationsManagement = ({ applications, courses, options, annee, readOnly = false, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ titre: '', description: '', cours: '', faculte: '', departement: '', promotion: '', annee_academique: '' });

  const departements = useMemo(() => (
    options.departements?.filter((item) => (
      !form.faculte || String(item.faculte) === String(form.faculte)
    )) || []
  ), [options.departements, form.faculte]);

  async function submit(event) {
    event.preventDefault();
    if (readOnly) return toast.error('Cette année est disponible en consultation uniquement');
    setSaving(true);
    try {
      const data = {...form, annee_academique: annee?.id};
      ['faculte', 'departement', 'promotion', 'annee_academique'].forEach((key) => { if (!data[key]) delete data[key]; });
      await professeurService.createMyApplication(data);
      toast.success('Cours appliqué aux étudiants correspondants');
      setShowForm(false);
      setForm({ titre: '', description: '', cours: '', faculte: '', departement: '', promotion: '', annee_academique: '' });
      await onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteApplication(item) {
    if (readOnly) return toast.error('Cette année est disponible en consultation uniquement');
    const confirmation = window.confirm(
      `Attention !\n\nVous allez supprimer l'application « ${item.titre} ».\n` +
      `Tous les étudiants déjà affectés à cette application seront retirés de cette application de cours.\n\n` +
      `Voulez-vous vraiment continuer ?`
    );
    if (!confirmation) return;

    setDeletingId(item.id);
    try {
      const response = await professeurService.deleteMyApplication(item.id);
      toast.success(response.message || 'Application supprimée avec succès');
      await onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <SectionHeader title="Mes applications de cours" subtitle="Appliquer un cours pour l’année académique affichée." onAdd={readOnly ? null : () => setShowForm(true)} addLabel="Nouvelle application" />
      {readOnly && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Année clôturée — applications visibles en consultation uniquement.</div>}
      {showForm && (
        <Panel title="Appliquer un cours" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Titre"><input required value={form.titre} onChange={(e) => setForm({...form, titre: e.target.value})} /></Field>
            <Field label="Cours"><select required value={form.cours} onChange={(e) => setForm({...form, cours: e.target.value})}><option value="">Sélectionner</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.nom_cours}</option>)}</select></Field>
            <Field label="Faculté"><select value={form.faculte} onChange={(e) => setForm({...form, faculte: e.target.value, departement: ''})}><option value="">Toutes</option>{options.facultes?.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</select></Field>
            <Field label="Département"><select value={form.departement} onChange={(e) => setForm({...form, departement: e.target.value})}><option value="">Tous</option>{departements.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</select></Field>
            <Field label="Promotion"><select value={form.promotion} onChange={(e) => setForm({...form, promotion: e.target.value})}><option value="">Toutes</option>{options.promotions?.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</select></Field>
            <Field label="Année académique"><input value={annee?.nom || ''} readOnly className="bg-slate-100" /></Field>
            <Field label="Description" wide><textarea rows="3" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}></textarea></Field>
            <Submit saving={saving} label="Appliquer le cours" />
          </form>
        </Panel>
      )}
      {applications.length === 0 ? <Empty text="Aucune application enregistrée." /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4">Application</th>
                <th className="p-4">Cours</th>
                <th className="p-4">Cible</th>
                <th className="p-4">Année</th>
                <th className="p-4">Étudiants</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((item) => (
                <tr key={item.id}>
                  <td className="p-4 font-medium">{item.titre}</td>
                  <td className="p-4">{item.cours_nom}</td>
                  <td className="p-4">{[item.faculte_nom, item.promotion_nom].filter(Boolean).join(' · ') || 'Tous'}</td>
                  <td className="p-4">{item.annee_academique_nom || 'Active'}</td>
                  <td className="p-4">{item.nombre_etudiants}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      disabled={readOnly || deletingId === item.id}
                      onClick={() => deleteApplication(item)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export const StudentsManagement = ({ students, courses, applications, sessions = [], readOnly = false, onRefresh }) => {
  const [filters, setFilters] = useState({ search: '', cours: 'all', gestion: 'all', evaluation: 'all' });
  const [selected, setSelected] = useState(null);
  const [grade, setGrade] = useState({ session_id: '', points_tp: '', points_interro: '', points_examen: '', observation: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => students.filter((item) => {
    const search = filters.search.toLowerCase();
    const text = `${item.etudiant_matricule} ${item.etudiant_nom} ${item.etudiant_post_nom} ${item.etudiant_prenom}`.toLowerCase();
    if (search && !text.includes(search)) return false;
    if (filters.cours !== 'all' && String(item.cours) !== filters.cours) return false;
    if (filters.gestion !== 'all' && String(item.gestion) !== filters.gestion) return false;
    if (filters.evaluation === 'note' && item.points_obtenus === null) return false;
    if (filters.evaluation === 'non_note' && item.points_obtenus !== null) return false;
    if (filters.evaluation === 'echoue' && (
      item.points_obtenus === null
      || Number(item.points_obtenus) >= Number(item.cours_points) / 2
    )) return false;
    return true;
  }), [students, filters]);

  const openGrade = (item) => {
    if (readOnly) return toast.error('Cette année est disponible en consultation uniquement');
    setSelected(item);
    const session = sessions[0];
    const cotation = item.cotations?.find((note) => String(note.session) === String(session?.id));
    setGrade({
      session_id: session?.id || '',
      points_tp: cotation?.points_tp ?? '',
      points_interro: cotation?.points_interro ?? '',
      points_examen: cotation?.points_examen ?? '',
      observation: cotation?.observation || '',
    });
  };

  const changeSession = (sessionId) => {
    const cotation = selected?.cotations?.find((note) => String(note.session) === String(sessionId));
    setGrade({
      session_id: sessionId,
      points_tp: cotation?.points_tp ?? '',
      points_interro: cotation?.points_interro ?? '',
      points_examen: cotation?.points_examen ?? '',
      observation: cotation?.observation || '',
    });
  };

  async function submitGrade(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await professeurService.gradeStudent({ application_id: selected.id, ...grade });
      toast.success('Points enregistrés');
      setSelected(null);
      await onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  
  }

  const maximumExamen = selected
    ? Math.max(0, Number(selected.cours_points) - (grade.points_tp !== '' ? 5 : 0) - (grade.points_interro !== '' ? 5 : 0))
    : 0;
  const totalCotation = [grade.points_tp, grade.points_interro, grade.points_examen]
    .reduce((total, valeur) => total + (valeur === '' ? 0 : Number(valeur)), 0);

  return (
    <section>
      <SectionHeader title="Étudiants appliqués" subtitle="Filtrer les étudiants et consulter ou saisir leurs points par cours." />
      {readOnly && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Année clôturée — cotations disponibles en consultation uniquement.</div>}
      <div className="mb-5 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input placeholder="Matricule ou nom" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="w-full rounded-lg border py-2 pl-9 pr-3" /></div>
        <select value={filters.cours} onChange={(e) => setFilters({...filters, cours: e.target.value})} className="rounded-lg border px-3 py-2"><option value="all">Tous les cours</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.nom_cours}</option>)}</select>
        <select value={filters.gestion} onChange={(e) => setFilters({...filters, gestion: e.target.value})} className="rounded-lg border px-3 py-2"><option value="all">Toutes les applications</option>{applications.map((item) => <option key={item.id} value={item.id}>{item.titre}</option>)}</select>
        <select value={filters.evaluation} onChange={(e) => setFilters({...filters, evaluation: e.target.value})} className="rounded-lg border px-3 py-2"><option value="all">Toutes les évaluations</option><option value="note">Déjà notés</option><option value="non_note">Non notés</option><option value="echoue">Échoués</option></select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Matricule</th><th className="p-4">Étudiant</th><th className="p-4">Cours</th><th className="p-4">Faculté / Promotion</th><th className="p-4">Points</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{filtered.map((item) => <tr key={item.id}><td className="p-4 font-mono">{item.etudiant_matricule}</td><td className="p-4 font-medium">{item.etudiant_nom} {item.etudiant_post_nom} {item.etudiant_prenom}</td><td className="p-4">{item.cours_nom}</td><td className="p-4">{item.faculte_nom} · {item.promotion_nom}</td><td className="p-4">{item.points_obtenus === null ? 'Non saisis' : `${Number(item.points_obtenus).toLocaleString('fr-FR')} / ${item.cours_points}`}</td><td className="p-4"><button onClick={() => openGrade(item)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white"><UserRoundCheck className="h-4 w-4" /> Saisir les points</button></td></tr>)}</tbody></table>{filtered.length === 0 && <Empty text="Aucun étudiant ne correspond aux filtres." />}</div>
      {selected && <Panel modal title={`${selected.cours_nom} — ${selected.etudiant_nom} ${selected.etudiant_post_nom} ${selected.etudiant_prenom}`} onClose={() => setSelected(null)}><form onSubmit={submitGrade} className="space-y-4"><Field label="Session d’évaluation"><select required value={grade.session_id} onChange={(e) => changeSession(e.target.value)}><option value="">Sélectionner une session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.nom} · {session.annee_academique_nom}</option>)}</select></Field>{sessions.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">Aucune session active. L’administration doit d’abord créer une session d’évaluation.</p>}<div className="grid gap-3 sm:grid-cols-2"><Field label="TP (maximum 5)"><input type="number" min="0" max="5" step="0.01" value={grade.points_tp} onChange={(e) => setGrade({...grade, points_tp: e.target.value})} placeholder="Non coté" /></Field><Field label="Interrogation (maximum 5)"><input type="number" min="0" max="5" step="0.01" value={grade.points_interro} onChange={(e) => setGrade({...grade, points_interro: e.target.value})} placeholder="Non cotée" /></Field><Field label={`Examen (maximum ${maximumExamen})`}><input type="number" min="0" max={maximumExamen} step="0.01" value={grade.points_examen} onChange={(e) => setGrade({...grade, points_examen: e.target.value})} placeholder="Non coté" /></Field><div className="rounded-xl bg-indigo-50 p-3"><p className="text-xs text-indigo-500">Total calculé</p><p className="mt-1 text-xl font-bold text-indigo-800">{totalCotation.toLocaleString('fr-FR')} / {selected.cours_points}</p></div></div><p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Sans TP ni interrogation, l’examen vaut {selected.cours_points} points. Chaque composante utilisée réserve 5 points.</p><Field label="Observation"><textarea rows="3" value={grade.observation} onChange={(e) => setGrade({...grade, observation: e.target.value})}></textarea></Field><Submit saving={saving || !grade.session_id} label="Enregistrer la cotation" /></form></Panel>}
    </section>
  );
};

const SectionHeader = ({ title, subtitle, onAdd, addLabel }) => <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>{onAdd && <button onClick={onAdd} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> {addLabel}</button>}</div>;
const Panel = ({ title, onClose, children, modal = false }) => {
  const content = <div className={`${modal ? 'w-full max-w-md' : 'mb-6'} rounded-2xl bg-white p-6 shadow-xl ring-1 ring-indigo-200`}><div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-slate-900">{title}</h3><button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{children}</div>;
  return modal
    ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">{content}</div>
    : content;
};
const Field = ({ label, children, wide }) => <label className={`text-sm font-medium text-slate-700 ${wide ? 'md:col-span-2' : ''}`}>{label}<div className="mt-1.5 [&>*]:w-full [&>*]:rounded-lg [&>*]:border [&>*]:px-3 [&>*]:py-2.5 [&>*]:font-normal">{children}</div></label>;
const Submit = ({ saving, label }) => <div className="md:col-span-2"><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Enregistrement...' : label}</button></div>;
const Empty = ({ text }) => <div className="rounded-xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200"><ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300" />{text}</div>;
