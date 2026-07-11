import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Banknote, BarChart3, CalendarDays, Download,
  Filter, Loader2, RefreshCw, Search, TrendingUp, Users, WalletCards, X,
} from 'lucide-react';
import { fraisApi } from '../../services/frais';
import { anneeApi } from '../../services/etudiants/anneeApi';
import { universityApi } from '../../services/universityApi';

const liste = (valeur) => Array.isArray(valeur) ? valeur : valeur?.results || valeur?.data || [];
const texte = (valeur) => String(valeur ?? '').trim();
const nombre = (valeur) => Number.parseFloat(valeur) || 0;
const dateFr = (valeur) => valeur ? new Date(`${valeur}T00:00:00`).toLocaleDateString('fr-FR') : '-';
const monnaie = (valeur) => `${nombre(valeur).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FC`;

const valeurFrais = (paiement, champ, secours = '-') => {
  const frais = paiement.frais || {};
  const valeur = frais[champ];
  if (valeur && typeof valeur === 'object') return valeur.nom || valeur.libelle || secours;
  return texte(valeur) || secours;
};

const nomEtudiant = (paiement) => {
  const valeur = paiement.etudiant || paiement.frais?.etudiant;
  if (typeof valeur === 'object') return valeur.nom_complet || `${valeur.nom || ''} ${valeur.postnom || ''} ${valeur.prenom || ''}`.trim();
  return texte(valeur) || '-';
};

const libelleMode = {
  cash: 'Espèces', mobile_money: 'Mobile Money', banque: 'Virement bancaire',
  cheque: 'Chèque', carte: 'Carte bancaire',
};

const libelleStatut = { valide: 'Validé', annule: 'Annulé', en_attente: 'En attente' };

export default function StatistiquesFrais() {
  const [paiements, setPaiements] = useState([]);
  const [frais, setFrais] = useState([]);
  const [universite, setUniversite] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [exportation, setExportation] = useState(false);
  const [erreur, setErreur] = useState('');
  const [annees, setAnnees] = useState([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);
  const [filtres, setFiltres] = useState({
    recherche: '', faculte: '', departement: '', promotion: '', type: '',
    mode: '', statut: '', dateDebut: '', dateFin: '',
  });

  const charger = async () => {
    setChargement(true);
    setErreur('');
    try {
      const [paiementsData, fraisData, identite] = await Promise.all([
        fraisApi.getPaiements(anneeSelectionnee), fraisApi.getFrais(anneeSelectionnee), universityApi.getIdentity().catch(() => null),
      ]);
      setPaiements(liste(paiementsData));
      setFrais(liste(fraisData));
      setUniversite(identite);
    } catch (error) {
      console.error(error);
      setErreur("Impossible de charger les statistiques financières.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    let actif = true;
    anneeApi.getAll()
      .then((response) => {
        if (!actif) return;
        const anneesData = response.data || [];
        setAnnees(anneesData);
        setAnneeSelectionnee(anneesData.find((annee) => annee.est_active)?.id || anneesData[0]?.id || '');
      })
      .catch((error) => {
        console.error(error);
        if (actif) setErreur("Impossible de charger les statistiques financières.");
      })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, []);

  useEffect(() => {
    if (anneeSelectionnee) Promise.resolve().then(charger);
  }, [anneeSelectionnee]);

  const options = useMemo(() => {
    const uniques = (champ) => [...new Set(paiements.map((p) => valeurFrais(p, champ, '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
    return {
      facultes: uniques('faculte_nom'),
      departements: uniques('departement_nom'),
      promotions: uniques('promotion_nom'),
      types: [...new Set(paiements.map((p) => p.frais?.type_frais?.nom || valeurFrais(p, 'type_frais', '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    };
  }, [paiements]);

  const paiementsFiltres = useMemo(() => paiements.filter((paiement) => {
    const faculte = valeurFrais(paiement, 'faculte_nom');
    const departement = valeurFrais(paiement, 'departement_nom');
    const promotion = valeurFrais(paiement, 'promotion_nom');
    const type = paiement.frais?.type_frais?.nom || valeurFrais(paiement, 'type_frais');
    const recherche = filtres.recherche.toLocaleLowerCase('fr');
    const contenu = [nomEtudiant(paiement), paiement.reference, faculte, departement, promotion, type, paiement.agent?.username].join(' ').toLocaleLowerCase('fr');
    return (!recherche || contenu.includes(recherche))
      && (!filtres.faculte || faculte === filtres.faculte)
      && (!filtres.departement || departement === filtres.departement)
      && (!filtres.promotion || promotion === filtres.promotion)
      && (!filtres.type || type === filtres.type)
      && (!filtres.mode || paiement.mode_paiement === filtres.mode)
      && (!filtres.statut || paiement.statut === filtres.statut)
      && (!filtres.dateDebut || paiement.date_paiement >= filtres.dateDebut)
      && (!filtres.dateFin || paiement.date_paiement <= filtres.dateFin);
  }), [paiements, filtres]);

  const statistiques = useMemo(() => {
    const valides = paiementsFiltres.filter((p) => p.statut === 'valide');
    const totalPaye = valides.reduce((somme, p) => somme + nombre(p.montant_paye), 0);
    const idsFrais = new Set(paiementsFiltres.map((p) => p.frais?.id).filter(Boolean));
    const fraisConcernes = frais.filter((item) => idsFrais.has(item.id));
    const totalAttendu = fraisConcernes.reduce((somme, item) => somme + nombre(item.montant_total), 0);
    const taux = totalAttendu > 0 ? Math.min(100, (totalPaye / totalAttendu) * 100) : 0;
    return { valides: valides.length, totalPaye, totalAttendu, taux, etudiants: new Set(valides.map(nomEtudiant)).size };
  }, [paiementsFiltres, frais]);

  const regroupementFacultes = useMemo(() => {
    const groupes = new Map();
    paiementsFiltres.filter((p) => p.statut === 'valide').forEach((paiement) => {
      const nom = valeurFrais(paiement, 'faculte_nom', 'Non renseignée');
      const courant = groupes.get(nom) || { faculte: nom, montant: 0, operations: 0, etudiants: new Set() };
      courant.montant += nombre(paiement.montant_paye);
      courant.operations += 1;
      courant.etudiants.add(nomEtudiant(paiement));
      groupes.set(nom, courant);
    });
    return [...groupes.values()].map((g) => ({ ...g, nombreEtudiants: g.etudiants.size })).sort((a, b) => b.montant - a.montant);
  }, [paiementsFiltres]);

  const filtresActifs = Object.values(filtres).filter(Boolean).length;
  const reinitialiser = () => setFiltres({ recherche: '', faculte: '', departement: '', promotion: '', type: '', mode: '', statut: '', dateDebut: '', dateFin: '' });

  const exporterExcel = () => {
    setExportation(true);
    try {
      const identite = [
        ['IDENTITÉ DE L’UNIVERSITÉ', ''], ['Nom', universite?.nom || '-'], ['Sigle', universite?.sigle || '-'],
        ['Devise', universite?.devise || '-'], ['Adresse', universite?.adresse || '-'], ['Ville', universite?.ville || '-'],
        ['Pays', universite?.pays || '-'], ['Téléphone', universite?.telephone || '-'], ['E-mail', universite?.email || '-'],
        ['Date du rapport', new Date().toLocaleString('fr-FR')],
      ];
      const synthese = [
        ['RAPPORT STATISTIQUE DES PAIEMENTS', ''], ['Période du', filtres.dateDebut ? dateFr(filtres.dateDebut) : 'Début de l’année active'],
        ['Période au', filtres.dateFin ? dateFr(filtres.dateFin) : 'Aujourd’hui'], ['Paiements affichés', paiementsFiltres.length],
        ['Paiements validés', statistiques.valides], ['Étudiants ayant payé', statistiques.etudiants],
        ['Total encaissé (FC)', statistiques.totalPaye], ['Total attendu concerné (FC)', statistiques.totalAttendu],
        ['Taux de paiement', `${statistiques.taux.toFixed(2)} %`], ['Faculté', filtres.faculte || 'Toutes'],
        ['Département', filtres.departement || 'Tous'], ['Promotion', filtres.promotion || 'Toutes'], ['Type de frais', filtres.type || 'Tous'],
      ];
      const details = paiementsFiltres.map((p) => ({
        Référence: p.reference || '-', Date: dateFr(p.date_paiement), Étudiant: nomEtudiant(p),
        Faculté: valeurFrais(p, 'faculte_nom'), Département: valeurFrais(p, 'departement_nom'),
        Promotion: valeurFrais(p, 'promotion_nom'), 'Type de frais': p.frais?.type_frais?.nom || valeurFrais(p, 'type_frais'),
        Semestre: valeurFrais(p, 'semestre'), 'Montant payé (FC)': nombre(p.montant_paye),
        Mode: libelleMode[p.mode_paiement] || p.mode_paiement || '-', Statut: libelleStatut[p.statut] || p.statut || '-',
        Agent: p.agent ? `${p.agent.first_name || ''} ${p.agent.last_name || ''}`.trim() || p.agent.username : '-', Observation: p.description || '-',
      }));
      const facultes = regroupementFacultes.map((g) => ({ Faculté: g.faculte, Opérations: g.operations, Étudiants: g.nombreEtudiants, 'Total encaissé (FC)': g.montant }));
      const classeur = XLSX.utils.book_new();
      const feuilles = [
        ['Identité', XLSX.utils.aoa_to_sheet(identite)], ['Synthèse', XLSX.utils.aoa_to_sheet(synthese)],
        ['Paiements', XLSX.utils.json_to_sheet(details)], ['Par faculté', XLSX.utils.json_to_sheet(facultes)],
      ];
      feuilles.forEach(([nom, feuille]) => {
        feuille['!cols'] = Array.from({ length: 14 }, (_, index) => ({ wch: index === 2 ? 30 : 22 }));
        if (nom === 'Paiements' && details.length) feuille['!autofilter'] = { ref: feuille['!ref'] };
        XLSX.utils.book_append_sheet(classeur, feuille, nom);
      });
      const sigle = (universite?.sigle || 'Universite').replace(/[^a-z0-9_-]/gi, '_');
      XLSX.writeFile(classeur, `${sigle}_statistiques_paiements_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportation(false);
    }
  };

  if (chargement) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-800 p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div><Link to="/frais" className="mb-5 inline-flex items-center gap-2 text-sm text-emerald-100 hover:text-white"><ArrowLeft className="h-4 w-4" />Retour aux frais</Link><p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Pilotage financier</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Statistiques des paiements</h1><p className="mt-3 max-w-2xl text-sm text-emerald-100/80">Analyse détaillée des encaissements de l’année académique active.</p></div>
            <div className="flex flex-wrap gap-3"><button onClick={charger} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"><RefreshCw className="h-4 w-4" />Actualiser</button><button onClick={exporterExcel} disabled={exportation || !paiementsFiltres.length} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-lg disabled:opacity-50"><Download className="h-4 w-4" />{exportation ? 'Exportation…' : 'Exporter en Excel'}</button></div>
          </div>
        </section>

        {erreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{erreur}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Banknote, 'Total encaissé', monnaie(statistiques.totalPaye), `${statistiques.valides} paiement(s) validé(s)`, 'bg-emerald-50 text-emerald-700'],
            [WalletCards, 'Total attendu concerné', monnaie(statistiques.totalAttendu), 'Frais liés aux opérations filtrées', 'bg-indigo-50 text-indigo-700'],
            [TrendingUp, 'Taux de paiement', `${statistiques.taux.toFixed(1)} %`, 'Encaissement / montant attendu', 'bg-amber-50 text-amber-700'],
            [Users, 'Étudiants payeurs', statistiques.etudiants, `${paiementsFiltres.length} opération(s) affichée(s)`, 'bg-cyan-50 text-cyan-700'],
          ].map(([Icon, label, valeur, detail, couleur]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-xl p-3 ${couleur}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{valeur}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Filter className="h-5 w-5 text-emerald-600" /><h2 className="text-lg font-black text-slate-900">Filtres avancés</h2>{filtresActifs > 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{filtresActifs} actif(s)</span>}</div><p className="mt-1 text-xs text-slate-400">Les statistiques, le tableau et le classeur Excel suivent les filtres appliqués.</p></div>{filtresActifs > 0 && <button onClick={reinitialiser} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600"><X className="h-4 w-4" />Réinitialiser</button>}</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label><span className="text-xs font-bold text-slate-600">Année académique</span><select value={anneeSelectionnee || ''} onChange={(e) => setAnneeSelectionnee(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{annees.map((annee) => <option key={annee.id} value={annee.id}>{annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}</option>)}</select></label>
            <label className="xl:col-span-2"><span className="text-xs font-bold text-slate-600">Recherche</span><div className="relative mt-1.5"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filtres.recherche} onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })} placeholder="Étudiant, référence, agent…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></div></label>
            <SelectFiltre label="Faculté" valeur={filtres.faculte} options={options.facultes} onChange={(valeur) => setFiltres({ ...filtres, faculte: valeur, departement: '' })} />
            <SelectFiltre label="Département" valeur={filtres.departement} options={options.departements} onChange={(valeur) => setFiltres({ ...filtres, departement: valeur })} />
            <SelectFiltre label="Promotion" valeur={filtres.promotion} options={options.promotions} onChange={(valeur) => setFiltres({ ...filtres, promotion: valeur })} />
            <SelectFiltre label="Type de frais" valeur={filtres.type} options={options.types} onChange={(valeur) => setFiltres({ ...filtres, type: valeur })} />
            <SelectFiltre label="Mode" valeur={filtres.mode} options={Object.entries(libelleMode)} onChange={(valeur) => setFiltres({ ...filtres, mode: valeur })} paires />
            <SelectFiltre label="Statut" valeur={filtres.statut} options={Object.entries(libelleStatut)} onChange={(valeur) => setFiltres({ ...filtres, statut: valeur })} paires />
            <ChampDate label="Du" valeur={filtres.dateDebut} onChange={(valeur) => setFiltres({ ...filtres, dateDebut: valeur })} />
            <ChampDate label="Au" valeur={filtres.dateFin} onChange={(valeur) => setFiltres({ ...filtres, dateFin: valeur })} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_2fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-600" /><h2 className="font-black text-slate-900">Encaissement par faculté</h2></div><div className="mt-5 space-y-4">{regroupementFacultes.length ? regroupementFacultes.slice(0, 8).map((g) => { const part = statistiques.totalPaye ? (g.montant / statistiques.totalPaye) * 100 : 0; return <div key={g.faculte}><div className="flex justify-between gap-4 text-xs"><span className="truncate font-bold text-slate-700">{g.faculte}</span><span className="whitespace-nowrap font-black text-slate-900">{monnaie(g.montant)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${part}%` }} /></div><p className="mt-1 text-[11px] text-slate-400">{g.nombreEtudiants} étudiant(s) · {part.toFixed(1)} %</p></div>; }) : <p className="py-10 text-center text-sm text-slate-400">Aucune donnée validée.</p>}</div></div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="font-black text-slate-900">Détail des paiements</h2><p className="mt-1 text-xs text-slate-400">{paiementsFiltres.length} résultat(s)</p></div><CalendarDays className="h-5 w-5 text-slate-300" /></div><div className="max-h-[650px] overflow-auto"><table className="min-w-[1250px] w-full text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-500"><tr>{['Date', 'Référence', 'Étudiant', 'Faculté', 'Département', 'Promotion', 'Type', 'Mode', 'Montant', 'Statut'].map((titre) => <th key={titre} className="px-4 py-3 font-black">{titre}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{paiementsFiltres.length ? paiementsFiltres.map((p) => <tr key={p.id} className="hover:bg-emerald-50/40"><td className="whitespace-nowrap px-4 py-3">{dateFr(p.date_paiement)}</td><td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-indigo-700">{p.reference}</td><td className="px-4 py-3 font-bold text-slate-800">{nomEtudiant(p)}</td><td className="px-4 py-3">{valeurFrais(p, 'faculte_nom')}</td><td className="px-4 py-3">{valeurFrais(p, 'departement_nom')}</td><td className="px-4 py-3">{valeurFrais(p, 'promotion_nom')}</td><td className="px-4 py-3">{p.frais?.type_frais?.nom || '-'}</td><td className="px-4 py-3">{libelleMode[p.mode_paiement] || p.mode_paiement}</td><td className="whitespace-nowrap px-4 py-3 font-black text-emerald-700">{monnaie(p.montant_paye)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.statut === 'valide' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'annule' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{libelleStatut[p.statut] || p.statut}</span></td></tr>) : <tr><td colSpan="10" className="px-6 py-16 text-center text-slate-400">Aucun paiement ne correspond aux filtres.</td></tr>}</tbody></table></div></div>
        </section>
      </div>
    </main>
  );
}

function SelectFiltre({ label, valeur, options, onChange, paires = false }) {
  return <label><span className="text-xs font-bold text-slate-600">{label}</span><select value={valeur} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"><option value="">Tous</option>{options.map((option) => { const [val, libelle] = paires ? option : [option, option]; return <option key={val} value={val}>{libelle}</option>; })}</select></label>;
}

function ChampDate({ label, valeur, onChange }) {
  return <label><span className="text-xs font-bold text-slate-600">{label}</span><input type="date" value={valeur} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /></label>;
}
