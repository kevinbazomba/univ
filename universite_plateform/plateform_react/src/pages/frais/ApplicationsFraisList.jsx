import { useEffect, useMemo, useState } from 'react';
import { Banknote, Eye, Pencil, Search, Trash2, WalletCards, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { fraisApi } from '../../services/frais';
import { anneeApi } from '../../services/etudiants/anneeApi';

const montant = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FC`;

const ApplicationsFraisList = () => {
  const [frais, setFrais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [faculte, setFaculte] = useState('all');
  const [departement, setDepartement] = useState('all');
  const [typeFrais, setTypeFrais] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [annees, setAnnees] = useState([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);
  const anneeModifiable = Boolean(annees.find((annee) => String(annee.id) === String(anneeSelectionnee))?.est_active);

  const charger = async () => {
    setLoading(true);
    try { setFrais(await fraisApi.getFrais(anneeSelectionnee)); }
    catch { toast.error('Impossible de charger les frais appliqués'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    anneeApi.getAll().then((response) => {
      const liste = response.data || [];
      setAnnees(liste);
      setAnneeSelectionnee(liste.find((annee) => annee.est_active)?.id || liste[0]?.id || null);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (anneeSelectionnee) Promise.resolve().then(charger);
  }, [anneeSelectionnee]);

  const facultes = useMemo(() => [...new Set(frais.map((item) => item.faculte_nom).filter(Boolean))].sort(), [frais]);
  const departements = useMemo(() => [...new Set(frais.filter((item) => faculte === 'all' || item.faculte_nom === faculte).map((item) => item.departement_nom).filter(Boolean))].sort(), [frais, faculte]);
  const typesFrais = useMemo(() => [...new Set(frais.map((item) => item.type_frais?.nom).filter(Boolean))].sort(), [frais]);
  const visibles = useMemo(() => frais.filter((item) => {
    const texte = `${item.etudiant || ''} ${item.type_frais?.nom || ''} ${item.faculte_nom || ''} ${item.promotion || ''}`.toLowerCase();
    return texte.includes(search.toLowerCase()) && (faculte === 'all' || item.faculte_nom === faculte) && (departement === 'all' || item.departement_nom === departement) && (typeFrais === 'all' || item.type_frais?.nom === typeFrais);
  }), [frais, search, faculte, departement, typeFrais]);

  const supprimer = async (item) => {
    if (!anneeModifiable) return toast.error('Cette année est disponible en consultation uniquement');
    if (!window.confirm(`Supprimer le frais « ${item.type_frais?.nom || 'académique'} » appliqué à ${item.etudiant} ?`)) return;
    try { await fraisApi.deleteFrais(item.id); toast.success('Application du frais supprimée'); await charger(); }
    catch { toast.error('Suppression impossible'); }
  };

  const supprimerSelection = async () => {
    if (!anneeModifiable) return toast.error('Cette année est disponible en consultation uniquement');
    if (!selectedIds.length && faculte === 'all') return toast.error('Choisissez une faculté ou sélectionnez des applications');
    const ids = selectedIds.length ? selectedIds : visibles.map((item) => item.id);
    if (!ids.length) return toast.error('Aucune application à supprimer');
    const contexte = selectedIds.length
      ? `${ids.length} application(s) sélectionnée(s)`
      : `toutes les ${ids.length} application(s) visibles${departement !== 'all' ? ` du département ${departement}` : faculte !== 'all' ? ` de la faculté ${faculte}` : ''}`;
    if (!window.confirm(`Supprimer ${contexte} ?\n\nCette action est irréversible.`)) return;
    try {
      await Promise.all(ids.map((id) => fraisApi.deleteFrais(id)));
      toast.success(`${ids.length} application(s) supprimée(s)`);
      setSelectedIds([]);
      await charger();
    } catch { toast.error('Certaines applications n’ont pas pu être supprimées'); await charger(); }
  };

  const enregistrer = async (event) => {
    event.preventDefault();
    if (!anneeModifiable) return toast.error('Cette année est disponible en consultation uniquement');
    setSaving(true);
    try {
      await fraisApi.updateFrais(editing.id, { montant_total: editing.montant_total, description: editing.description });
      toast.success('Application du frais modifiée');
      setEditing(null);
      await charger();
    } catch { toast.error('Modification impossible'); }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-[1550px]">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-800 p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative flex items-center gap-4"><div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"><WalletCards className="h-8 w-8" /></div><div><p className="text-sm text-emerald-200">Gestion financière</p><h1 className="text-3xl font-bold">Applications des frais</h1><p className="mt-1 text-sm text-emerald-100/70">Consultez et gérez chaque frais appliqué aux étudiants.</p></div></div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {!anneeModifiable && anneeSelectionnee && <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">Année clôturée — consultation uniquement.</div>}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-bold text-slate-900">Frais appliqués</h2><p className="text-sm text-slate-500">{visibles.length} application(s) affichée(s)</p></div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <select value={anneeSelectionnee || ''} onChange={(e) => { setAnneeSelectionnee(Number(e.target.value)); setSelectedIds([]); }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-800">{annees.map((annee) => <option key={annee.id} value={annee.id}>{annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}</option>)}</select>
              <select value={faculte} onChange={(e) => { setFaculte(e.target.value); setDepartement('all'); setSelectedIds([]); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="all">Toutes les facultés</option>{facultes.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <select value={departement} onChange={(e) => { setDepartement(e.target.value); setSelectedIds([]); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="all">Tous les départements</option>{departements.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <select value={typeFrais} onChange={(e) => { setTypeFrais(e.target.value); setSelectedIds([]); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="all">Tous les types de frais</option>{typesFrais.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Étudiant ou type..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></div>
              {anneeModifiable && <button onClick={supprimerSelection} disabled={!visibles.length || (!selectedIds.length && faculte === 'all')} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Trash2 className="h-4 w-4" />{selectedIds.length ? `Supprimer (${selectedIds.length})` : faculte !== 'all' ? 'Supprimer la faculté' : 'Choisir une faculté'}</button>}
            </div>
          </div>
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="px-5 py-4"><input type="checkbox" checked={visibles.length > 0 && visibles.every((item) => selectedIds.includes(item.id))} onChange={(e) => setSelectedIds(e.target.checked ? visibles.map((item) => item.id) : [])} aria-label="Sélectionner toutes les applications visibles" /></th>{['Étudiant','Type de frais','Semestre','Montant','Payé','Solde','Statut','Actions'].map((titre) => <th key={titre} className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">{titre}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
            {visibles.map((item) => <tr key={item.id} className="hover:bg-emerald-50/30"><td className="px-5 py-4"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id])} aria-label={`Sélectionner ${item.etudiant}`} /></td><td className="px-5 py-4 font-semibold text-slate-900">{item.etudiant}</td><td className="px-5 py-4 text-sm">{item.type_frais?.nom || '—'}</td><td className="px-5 py-4 text-sm">{item.semestre === 1 ? '1er' : '2ème'}</td><td className="px-5 py-4 font-bold">{montant(item.montant_total)}</td><td className="px-5 py-4 font-semibold text-emerald-700">{montant(item.total_paye)}</td><td className="px-5 py-4 font-semibold text-amber-700">{montant(item.solde_restant)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : item.statut_paiement === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{item.statut_paiement === 'paye' ? 'Payé' : item.statut_paiement === 'partiel' ? 'Partiel' : 'Non payé'}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => setSelected(item)} title="Voir" className="rounded-lg border p-2 text-slate-500 hover:bg-slate-50"><Eye className="h-4 w-4" /></button><button onClick={() => setEditing({...item})} title="Modifier" className="rounded-lg border p-2 text-indigo-600 hover:bg-indigo-50"><Pencil className="h-4 w-4" /></button><button onClick={() => supprimer(item)} title="Supprimer individuellement" className="rounded-lg border p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}
          </tbody></table>{!loading && !visibles.length && <div className="p-12 text-center text-slate-400"><Banknote className="mx-auto mb-2 h-10 w-10" />Aucun frais appliqué trouvé.</div>}</div>
        </section>
      </div>

      {selected && <Modal title="Détail du frais appliqué" onClose={() => setSelected(null)}><div className="space-y-3 text-sm">{[['Étudiant',selected.etudiant],['Type',selected.type_frais?.nom],['Faculté',selected.faculte_nom],['Département',selected.departement_nom],['Promotion',selected.promotion],['Montant',montant(selected.montant_total)],['Total payé',montant(selected.total_paye)],['Solde',montant(selected.solde_restant)],['Description',selected.description || '—']].map(([label,value]) => <div key={label} className="flex justify-between gap-5 border-b pb-2"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800">{value || '—'}</span></div>)}</div></Modal>}
      {editing && <Modal title="Modifier le frais appliqué" onClose={() => setEditing(null)}><form onSubmit={enregistrer} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Montant total<input required min="0" step="0.01" type="number" value={editing.montant_total} onChange={(e) => setEditing({...editing, montant_total: e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><label className="block text-sm font-semibold text-slate-700">Description<textarea rows="3" value={editing.description || ''} onChange={(e) => setEditing({...editing, description: e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><button disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button></form></Modal>}
    </main>
  );
};

const Modal = ({ title, children, onClose }) => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">{title}</h3><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{children}</div></div>;

export default ApplicationsFraisList;
