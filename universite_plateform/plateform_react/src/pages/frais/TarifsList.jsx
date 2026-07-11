import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fraisApi } from '../../services/frais';
import { anneeApi } from '../../services/etudiants/anneeApi';
import { 
  DollarSign, 
  Loader2, 
  Tag, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Search,
  X,
  Eye,
  Plus,
  Users,
  Target,
  Zap,
  ChevronRight,
  WalletCards,
} from 'lucide-react';

export default function TarifsList() {
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [annees, setAnnees] = useState([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);

  useEffect(() => {
    anneeApi.getAll().then((response) => {
      const liste = response.data || [];
      setAnnees(liste);
      setAnneeSelectionnee(liste.find((annee) => annee.est_active)?.id || liste[0]?.id || '');
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (anneeSelectionnee) loadTarifs();
  }, [anneeSelectionnee]);

  async function loadTarifs() {
    try {
      const data = await fraisApi.getTarifs(anneeSelectionnee);
      setTarifs(data);
    } catch (error) {
      console.error('Erreur chargement tarifs:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (id) => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir appliquer ce tarif à tous les étudiants correspondants ?\n\nCette action peut créer plusieurs frais étudiants.')) return;
    
    setApplyingId(id);
    try {
      const res = await fraisApi.applyTarif(id);
      alert(`✅ Tarif appliqué avec succès !\n\n📊 Créés: ${res.created}\n⏭️ Ignorés: ${res.skipped}`);
      await loadTarifs();
    } catch (err) {
      console.error(err);
      alert('❌ Erreur lors de l\'application du tarif. Veuillez réessayer.');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredTarifs = tarifs;
  const anneeModifiable = Boolean(annees.find((annee) => String(annee.id) === String(anneeSelectionnee))?.est_active);

  // Statistiques
  const stats = useMemo(() => {
    const total = filteredTarifs.reduce((sum, t) => sum + Number(t.montant || 0), 0);
    const moyenne = filteredTarifs.length > 0 ? total / filteredTarifs.length : 0;
    const parSemestre = {
      premier: filteredTarifs.filter(t => t.semestre === 1).length,
      deuxieme: filteredTarifs.filter(t => t.semestre === 2).length
    };
    
    return { total, moyenne, parSemestre, count: filteredTarifs.length };
  }, [filteredTarifs]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(Number(montant) || 0) + ' FC';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des tarifs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1550px]">
        {/* Header */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-800 px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-200"><WalletCards className="h-4 w-4" />Finances<ChevronRight className="h-3 w-3" />Tarification</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Gestion des tarifs</h1>
                <p className="mt-2 max-w-2xl text-sm text-emerald-100/75">Configurez les frais académiques par faculté, promotion et semestre.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={anneeSelectionnee || ''} onChange={(e) => setAnneeSelectionnee(Number(e.target.value))} className="rounded-xl border border-white/20 bg-emerald-950/60 px-4 py-3 text-sm font-semibold text-white">
                  {annees.map((annee) => <option key={annee.id} value={annee.id}>{annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}</option>)}
                </select>
                {anneeModifiable && <Link
                  to="/frais/tarifs/nouveau"
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 shadow-lg transition hover:bg-emerald-50"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau tarif
                </Link>}
              </div>
            </div>
        </div>

        {/* Statistiques */}
        {!anneeModifiable && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Année clôturée — consultation uniquement.</div>}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">ACTIFS</span>
            </div>
            <p className="text-gray-500 text-sm">Total tarifs</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{filteredTarifs.length}</p>
            <p className="text-xs text-gray-400 mt-2">Configurations actives</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Montant total</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatMontant(stats.total)}</p>
            <p className="text-xs text-gray-400 mt-2">Cumul des tarifs</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-xl p-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Moyenne par tarif</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{formatMontant(Math.round(stats.moyenne))}</p>
            <p className="text-xs text-gray-400 mt-2">Montant moyen</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-xl p-3">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Répartition semestres</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-sm font-bold text-blue-600">{stats.parSemestre.premier}</p>
                <p className="text-xs text-gray-500">1er Sem.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-purple-600">{stats.parSemestre.deuxieme}</p>
                <p className="text-xs text-gray-500">2ème Sem.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des tarifs */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold text-slate-900">Grille tarifaire</h2><p className="mt-1 text-xs text-slate-400">{filteredTarifs.length} tarif{filteredTarifs.length > 1 ? 's' : ''} affiché{filteredTarifs.length > 1 ? 's' : ''}</p></div><Tag className="h-6 w-6 text-slate-300" /></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Building className="inline w-3 h-3 mr-1" />
                    Faculté
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Users className="inline w-3 h-3 mr-1" />
                    Promotion
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Building className="inline w-3 h-3 mr-1" />
                    D&eacute;partement
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <GraduationCap className="inline w-3 h-3 mr-1" />
                    Option
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Tag className="inline w-3 h-3 mr-1" />
                    Type
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <BookOpen className="inline w-3 h-3 mr-1" />
                    Semestre
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <DollarSign className="inline w-3 h-3 mr-1" />
                    Montant
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTarifs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Search className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Aucun tarif trouvé</p>
                        <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTarifs.map((t) => (
                    <tr key={t.id} className="group transition-all duration-200 hover:bg-emerald-50/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg p-1.5 shadow-md group-hover:scale-110 transition-transform">
                            <Building className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {t.faculte?.nom || t.faculte || '-'}
                          </span>
                        </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {t.promotion?.nom || t.promotion || '-'}
                          </span>
                        </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-gray-600">
                            {t.departement?.nom || t.departement || '-'}
                          </span>
                        </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {t.option_specialisation || '-'}
                          </span>
                        </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                          <Tag className="w-3 h-3" />
                          {t.type_frais?.nom || t.type_frais || '-'}
                        </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                          t.semestre === 1 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t.semestre === 1 ? '1er Semestre' : '2ème Semestre'}
                        </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {formatMontant(t.montant)}
                        </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          {anneeModifiable && <button
                            onClick={() => setSelectedTarif(t)}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>}
                          <button
                            onClick={() => handleApply(t.id)}
                            disabled={applyingId === t.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                            title="Appliquer aux étudiants"
                          >
                            {applyingId === t.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Application...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                Appliquer
                              </>
                            )}
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-600">
            Affichage de <span className="font-semibold">{filteredTarifs.length}</span> sur <span className="font-semibold">{tarifs.length}</span> tarifs
          </p>
          <p className="text-xs text-slate-400">Liste complète des tarifs enregistrés</p>
        </div>
      </div>

      {/* Modal Détails */}
      {selectedTarif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setSelectedTarif(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Détails du tarif</h3>
              <button onClick={() => setSelectedTarif(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Faculté:</span>
                <span className="font-medium">{selectedTarif.faculte?.nom || selectedTarif.faculte || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">D&eacute;partement:</span>
                <span className="font-medium">{selectedTarif.departement?.nom || selectedTarif.departement || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Promotion:</span>
                <span className="font-medium">{selectedTarif.promotion?.nom || selectedTarif.promotion || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Option:</span>
                <span className="font-medium">{selectedTarif.option_specialisation || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Type de frais:</span>
                <span className="font-medium">{selectedTarif.type_frais?.nom || selectedTarif.type_frais || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Semestre:</span>
                <span className="font-medium">{selectedTarif.semestre === 1 ? '1er Semestre' : '2ème Semestre'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Montant:</span>
                <span className="font-bold text-green-600 text-lg">{formatMontant(selectedTarif.montant)}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {anneeModifiable && <button
                onClick={() => handleApply(selectedTarif.id)}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                Appliquer
              </button>}
              <button
                onClick={() => setSelectedTarif(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
