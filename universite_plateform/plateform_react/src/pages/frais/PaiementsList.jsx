import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fraisApi } from '../../services/frais';
import { faculteApi } from '../../services/etudiants/faculteApi';
import { anneeApi } from '../../services/etudiants/anneeApi';
import { universityApi } from '../../services/universityApi';
import { exportCsv } from '../../utils/exportCsv';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  User,
  Download,
  Printer,
  Eye,
  Plus,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  GraduationCap,
  Smartphone,
  Banknote,
  Landmark,
  FileText,
  SlidersHorizontal
} from 'lucide-react';

export default function PaiementsList() {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultes, setFacultes] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [university, setUniversity] = useState(null);
  
  // Filtres avancés
  const [filters, setFilters] = useState({
    search: '',
    statut: 'all',
    modePaiement: 'all',
    faculte: 'all',
    anneeAcademique: 'all',
    dateDebut: '',
    dateFin: '',
    montantMin: '',
    montantMax: '',
    etudiant: 'all'
  });

  useEffect(() => {
    Promise.all([
      faculteApi.getAll(),
      anneeApi.getAll()
    ]).then(([facultesRes, anneesRes]) => {
      setFacultes(facultesRes.data || facultesRes);
      const listeAnnees = anneesRes.data || anneesRes;
      setAnnees(listeAnnees);
      const active = listeAnnees.find((annee) => annee.est_active) || listeAnnees[0];
      setFilters((courants) => ({ ...courants, anneeAcademique: active ? String(active.id) : 'all' }));
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (filters.anneeAcademique === 'all') return;
    fraisApi.getPaiements(filters.anneeAcademique)
      .then(setPaiements)
      .finally(() => setLoading(false));
  }, [filters.anneeAcademique]);

  useEffect(() => {
    universityApi.getIdentity().then(setUniversity).catch(() => null);
  }, []);

  // Extraire les étudiants uniques pour le filtre
  const etudiantsUniques = useMemo(() => {
    const etudiants = new Map();
    paiements.forEach(p => {
      if (p.etudiant && !etudiants.has(p.etudiant)) {
        etudiants.set(p.etudiant, {
          nom: p.etudiant,
          id: p.frais?.etudiant_id || p.etudiant
        });
      }
    });
    return Array.from(etudiants.values());
  }, [paiements]);
  const anneeModifiable = Boolean(annees.find((annee) => String(annee.id) === String(filters.anneeAcademique))?.est_active);

  // Filtrer les paiements
  const filteredPaiements = useMemo(() => {
    return paiements.filter(p => {
      // Recherche texte
      if (filters.search && !p.reference?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !p.etudiant?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !p.frais?.type_frais?.nom?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Statut
      if (filters.statut !== 'all' && p.statut !== filters.statut) {
        return false;
      }
      
      // Mode de paiement
      if (filters.modePaiement !== 'all' && p.mode_paiement !== filters.modePaiement) {
        return false;
      }
      
      // Faculté (utilise la relation FraisAcademique)
      if (filters.faculte !== 'all') {
        const faculteId = p.frais?.faculte?.toString() || p.frais?.faculte_id?.toString();
        if (faculteId !== filters.faculte) {
          return false;
        }
      }
      
      // Étudiant
      if (filters.etudiant !== 'all' && p.etudiant !== filters.etudiant) {
        return false;
      }
      
      // Date
      const datePaiement = new Date(p.date_paiement);
      if (filters.dateDebut && datePaiement < new Date(filters.dateDebut)) {
        return false;
      }
      if (filters.dateFin && datePaiement > new Date(filters.dateFin)) {
        return false;
      }
      
      // Montant
      if (filters.montantMin && (p.montant_paye || 0) < parseFloat(filters.montantMin)) {
        return false;
      }
      if (filters.montantMax && (p.montant_paye || 0) > parseFloat(filters.montantMax)) {
        return false;
      }
      
      return true;
    });
  }, [paiements, filters]);

  // Statistiques
  const stats = useMemo(() => {
    const total = filteredPaiements.reduce((sum, p) => {
      const montant = parseFloat(p.montant_paye) || 0;
      return sum + montant;
    }, 0);
    const parMode = {
      mobile_money: filteredPaiements.filter(p => p.mode_paiement === 'mobile_money').length,
      cash: filteredPaiements.filter(p => p.mode_paiement === 'cash').length,
      cheque: filteredPaiements.filter(p => p.mode_paiement === 'cheque').length,
      banque: filteredPaiements.filter(p => p.mode_paiement === 'banque').length,
      carte: filteredPaiements.filter(p => p.mode_paiement === 'carte').length,
    };
    const parStatut = {
      valide: filteredPaiements.filter(p => p.statut === 'valide').length,
      en_attente: filteredPaiements.filter(p => p.statut === 'en_attente').length,
      annule: filteredPaiements.filter(p => p.statut === 'annule').length,
    };
    
    return { total, parMode, parStatut };
  }, [filteredPaiements]);

  const getStatutStyle = (statut) => {
    switch(statut) {
      case 'valide':
        return { bg: 'bg-gradient-to-r from-green-400 to-green-500', icon: CheckCircle, text: 'Validé' };
      case 'en_attente':
        return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', icon: Clock, text: 'En attente' };
      case 'annule':
        return { bg: 'bg-gradient-to-r from-red-400 to-red-500', icon: AlertCircle, text: 'Annulé' };
      default:
        return { bg: 'bg-gray-400', icon: AlertCircle, text: statut };
    }
  };

  const getModeIcon = (mode) => {
    switch(mode) {
      case 'mobile_money': return <Smartphone className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'cheque': return <FileText className="w-4 h-4" />;
      case 'banque': return <Landmark className="w-4 h-4" />;
      case 'carte': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getModeLabel = (mode) => {
    switch(mode) {
      case 'mobile_money': return 'Mobile Money';
      case 'cash': return 'Espèces';
      case 'cheque': return 'Chèque';
      case 'banque': return 'Virement bancaire';
      case 'carte': return 'Carte bancaire';
      default: return mode || '-';
    }
  };

  const resetFilters = () => {
    const active = annees.find((annee) => annee.est_active) || annees[0];
    setFilters({
      search: '',
      statut: 'all',
      modePaiement: 'all',
      faculte: 'all',
      anneeAcademique: active ? String(active.id) : 'all',
      dateDebut: '',
      dateFin: '',
      montantMin: '',
      montantMax: '',
      etudiant: 'all'
    });
  };

  const handleExport = () => {
    exportCsv({
      filename: `paiements-${new Date().toISOString().slice(0, 10)}.csv`,
      title: 'Historique des paiements',
      identity: university,
      headers: ['Référence', 'Étudiant', 'Type de frais', 'Montant', 'Mode', 'Date', 'Statut', 'Description'],
      rows: filteredPaiements.map((paiement) => [
        paiement.reference,
        paiement.etudiant,
        paiement.frais?.type_frais?.nom,
        paiement.montant_paye,
        getModeLabel(paiement.mode_paiement),
        paiement.date_paiement,
        getStatutStyle(paiement.statut).text,
        paiement.description,
      ]),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{university?.nom || 'Gestion universitaire'}</p>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Gestion des Paiements
                </h1>
                <p className="text-gray-500 mt-1">Suivi et historique des transactions</p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                    showFilters ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres avancés
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm">Total encaissé</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total.toLocaleString()} CFA</p>
            <p className="text-xs text-gray-400 mt-2">{filteredPaiements.length} transactions</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Paiements validés</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.parStatut.valide}</p>
            <p className="text-xs text-green-500 mt-2">{((stats.parStatut.valide / filteredPaiements.length) * 100 || 0).toFixed(1)}% du total</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-xl p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">En attente</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.parStatut.en_attente}</p>
            <p className="text-xs text-yellow-500 mt-2">À vérifier</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-xl p-3">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Modes de paiement</p>
            <div className="space-y-1 mt-2">
              {stats.parMode.mobile_money > 0 && <p className="text-xs">📱 Mobile Money: {stats.parMode.mobile_money}</p>}
              {stats.parMode.cash > 0 && <p className="text-xs">💵 Espèces: {stats.parMode.cash}</p>}
              {stats.parMode.banque > 0 && <p className="text-xs">🏦 Virement bancaire: {stats.parMode.banque}</p>}
              {stats.parMode.cheque > 0 && <p className="text-xs">✉️ Chèque: {stats.parMode.cheque}</p>}
              {stats.parMode.carte > 0 && <p className="text-xs">💳 Carte bancaire: {stats.parMode.carte}</p>}
            </div>
          </div>
        </div>

        {!anneeModifiable && filters.anneeAcademique !== 'all' && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Année clôturée — consultation uniquement.</div>}
        {/* Filtres avancés */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-6 border border-gray-100 transition-all duration-300 ease-out opacity-100">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                Filtres avancés
              </h3>
              <button 
                onClick={resetFilters}
                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Réf., étudiant, type..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.statut}
                  onChange={(e) => setFilters({...filters, statut: e.target.value})}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="valide">Validé</option>
                  <option value="en_attente">En attente</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.modePaiement}
                  onChange={(e) => setFilters({...filters, modePaiement: e.target.value})}
                >
                  <option value="all">Tous les modes</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cash">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="banque">Virement bancaire</option>
                  <option value="carte">Carte bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Étudiant</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.etudiant}
                  onChange={(e) => setFilters({...filters, etudiant: e.target.value})}
                >
                  <option value="all">Tous les étudiants</option>
                  {etudiantsUniques.map(e => (
                    <option key={e.id} value={e.nom}>{e.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faculté</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.faculte}
                  onChange={(e) => setFilters({...filters, faculte: e.target.value})}
                >
                  <option value="all">Toutes les facultés</option>
                  {facultes.map(f => (
                    <option key={f.id} value={String(f.id)}>{f.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Année académique</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.anneeAcademique}
                  onChange={(e) => setFilters({...filters, anneeAcademique: e.target.value})}
                >
                  {annees.map(a => (
                    <option key={a.id} value={a.id}>{a.nom} ({a.date_debut} — {a.date_fin}){a.est_active ? ' · Active' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.dateDebut}
                    onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.dateFin}
                    onChange={(e) => setFilters({...filters, dateFin: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant min</label>
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.montantMin}
                    onChange={(e) => setFilters({...filters, montantMin: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant max</label>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.montantMax}
                    onChange={(e) => setFilters({...filters, montantMax: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des paiements */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Étudiant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type de frais</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPaiements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Search className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
                        <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPaiements.map((p) => {
                    const statutStyle = getStatutStyle(p.statut);
                    const StatutIcon = statutStyle.icon;
                    const etudiantId = p.frais?.etudiant_id || p.etudiant;
                    
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-gray-900">{p.reference}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-2 mr-3 shadow-md group-hover:scale-110 transition-transform">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{p.etudiant || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{p.frais?.type_frais?.nom || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-gray-900">{Number(p.montant_paye)?.toLocaleString('fr-FR')} CFA</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getModeIcon(p.mode_paiement)}
                            <span className="text-sm capitalize text-gray-600">
                              {getModeLabel(p.mode_paiement)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {new Date(p.date_paiement).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm text-white ${statutStyle.bg}`}>
                            <StatutIcon className="w-3 h-3" />
                            {statutStyle.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => navigate(`/frais/etudiant/${etudiantId}/paiements`)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                              title="Voir détails"
                            >
                              <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            {anneeModifiable && <button
                              onClick={() => navigate(`/frais/etudiant/${etudiantId}/nouveau-paiement`)}
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 group"
                              title="Nouveau paiement"
                            >
                              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Affichage de <span className="font-semibold">{filteredPaiements.length}</span> sur <span className="font-semibold">{paiements.length}</span> paiements
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-200">
              Précédent
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-200">
              Suivant
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
