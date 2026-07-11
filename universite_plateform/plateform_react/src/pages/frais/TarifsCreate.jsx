import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fraisApi } from '../../services/frais';
import { faculteApi } from '../../services/etudiants/faculteApi';
import { departementApi } from '../../services/etudiants/departementApi';
import { promotionApi } from '../../services/etudiants/promotionApi';
import { anneeApi } from '../../services/etudiants/anneeApi';
import { 
  Save, 
  X, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Tag,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Layers,
  Users
} from 'lucide-react';

export default function TarifsCreate() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ 
    faculte_id: '', 
    departement_id: '',
    promotion_id: '', 
    option_specialisation: '', 
    semestre: 1, 
    type_frais_id: '', 
    montant: '', 
    annee_academique_id: '' 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, fRes, dRes, pRes, aRes] = await Promise.all([
          fraisApi.getTypes(), 
          faculteApi.getAll(), 
          departementApi.getAll(),
          promotionApi.getAll(), 
          anneeApi.getAll()
        ]);
        setTypes(tRes);
        setFacultes(fRes.data || fRes);
        setDepartements(dRes.data || dRes);
        setPromotions(pRes.data || pRes);
        setAnnees(aRes.data || aRes);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    // Convertir semestre en nombre
    if (name === 'semestre') {
      finalValue = parseInt(value, 10);
    }
    
    setForm({ ...form, [name]: finalValue });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.type_frais_id) newErrors.type_frais_id = 'Le type de frais est requis';
    if (!form.montant) newErrors.montant = 'Le montant est requis';
    if (form.montant && parseFloat(form.montant) <= 0) newErrors.montant = 'Le montant doit être supérieur à 0';
    if (!form.annee_academique_id) newErrors.annee_academique_id = "L'année académique est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await fraisApi.createTarif(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ 
          faculte_id: '', 
          departement_id: '',
          promotion_id: '', 
          option_specialisation: '', 
          semestre: 1, 
          type_frais_id: '', 
          montant: '', 
          annee_academique_id: '' 
        });
        navigate('/frais/tarifs');
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Erreur lors de la création du tarif. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  const getMontantApercu = () => {
    if (!form.montant) return '';
    return new Intl.NumberFormat('fr-FR').format(form.montant) + ' CFA';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/frais/tarifs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste des tarifs
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Nouveau Tarif
                </h1>
                <p className="text-gray-500 mt-1">Configurer les frais académiques</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 shadow-lg">
                <Tag className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 animate-slideDown">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <p className="text-green-700">Tarif créé avec succès ! Redirection en cours...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Informations du tarif
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Faculté */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Building className="inline w-4 h-4 mr-2 text-gray-500" />
                  Faculté / École
                  <span className="text-gray-400 text-xs ml-1">(Optionnel)</span>
                </label>
                <div className="relative">
                  <select
                    name="faculte_id"
                    value={form.faculte_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Toutes les facultés</option>
                    {facultes.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Laisser vide pour appliquer à toutes les facultés</p>
              </div>

              {/* Département */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Building className="inline w-4 h-4 mr-2 text-gray-500" />
                  Département
                  <span className="text-gray-400 text-xs ml-1">(Optionnel)</span>
                </label>
                <select
                  name="departement_id"
                  value={form.departement_id}
                  onChange={handleChange}
                  disabled={!form.faculte_id}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">Tous les départements</option>
                  {departements.filter((departement) => String(departement.faculte) === String(form.faculte_id)).map((departement) => (
                    <option key={departement.id} value={departement.id}>{departement.nom}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">Choisissez d’abord une faculté pour cibler un département précis.</p>
              </div>

              {/* Promotion */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Users className="inline w-4 h-4 mr-2 text-gray-500" />
                  Promotion / Niveau
                  <span className="text-gray-400 text-xs ml-1">(Optionnel)</span>
                </label>
                <div className="relative">
                  <select
                    name="promotion_id"
                    value={form.promotion_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Toutes les promotions</option>
                    {promotions.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Option / Spécialisation */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <GraduationCap className="inline w-4 h-4 mr-2 text-gray-500" />
                  Option / Spécialisation
                  <span className="text-gray-400 text-xs ml-1">(Optionnel)</span>
                </label>
                <input
                  type="text"
                  name="option_specialisation"
                  value={form.option_specialisation}
                  onChange={handleChange}
                  placeholder="Ex: Mathématiques, Informatique de gestion..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Semestre */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <BookOpen className="inline w-4 h-4 mr-2 text-gray-500" />
                  Semestre
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="semestre"
                      value="1"
                      checked={form.semestre === 1}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">1er Semestre</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="semestre"
                      value="2"
                      checked={form.semestre === 2}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">2ème Semestre</span>
                  </label>
                </div>
              </div>

              {/* Type de frais */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Tag className="inline w-4 h-4 mr-2 text-gray-500" />
                  Type de frais *
                </label>
                <div className="relative">
                  <select
                    name="type_frais_id"
                    value={form.type_frais_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white appearance-none cursor-pointer ${
                      errors.type_frais_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Sélectionner un type de frais</option>
                    {types.map(t => (
                      <option key={t.id} value={t.id}>{t.nom}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.type_frais_id && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.type_frais_id}
                  </p>
                )}
              </div>

              {/* Montant */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <DollarSign className="inline w-4 h-4 mr-2 text-gray-500" />
                  Montant *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="montant"
                    value={form.montant}
                    onChange={handleChange}
                    placeholder="Ex: 150000"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.montant ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {form.montant && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      CFA
                    </div>
                  )}
                </div>
                {form.montant && (
                  <p className="text-xs text-green-600 font-medium">
                    Aperçu: {getMontantApercu()}
                  </p>
                )}
                {errors.montant && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.montant}
                  </p>
                )}
              </div>

              {/* Année académique */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Calendar className="inline w-4 h-4 mr-2 text-gray-500" />
                  Année académique *
                </label>
                <div className="relative">
                  <select
                    name="annee_academique_id"
                    value={form.annee_academique_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white appearance-none cursor-pointer ${
                      errors.annee_academique_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Sélectionner une année académique</option>
                    {annees.map(a => (
                      <option key={a.id} value={a.id}>{a.nom}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.annee_academique_id && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.annee_academique_id}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Créer le tarif
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/frais/tarifs')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </form>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 rounded-lg p-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">À propos des tarifs</h3>
              <p className="text-xs text-blue-700">
                Les champs marqués d'un astérisque (*) sont obligatoires. 
                Vous pouvez définir des tarifs spécifiques par faculté, promotion ou option.
                Laissez les champs vides pour appliquer le tarif à tous les niveaux.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
