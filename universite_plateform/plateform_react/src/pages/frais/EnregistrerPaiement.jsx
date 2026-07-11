import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fraisApi } from '../../services/frais';
import { etudiantApi } from '../../services/etudiants/etudiantApi';

export default function EnregistrerPaiement() {
  const { etudiantId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type_frais_id: '',
    semestre: 1,
    montant_paye: '',
    mode_paiement: 'cash',
    date_paiement: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [fraisEtudiant, setFraisEtudiant] = useState([]);
  const [etudiantNom, setEtudiantNom] = useState('');
  const [etudiantMatricule, setEtudiantMatricule] = useState('');
  const [typesDisponibles, setTypesDisponibles] = useState([]);
  const [semestresDisponibles, setSemestresDisponibles] = useState([]);
  const [fraisSelected, setFraisSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    
    Promise.all([fraisApi.getFrais(), etudiantApi.getById(etudiantId)])
      .then(([fraisData, etRes]) => {
        const fraisList = fraisData ?? [];
        const etudiant = etRes?.data ?? etRes;
        
        // Récupérer le matricule de l'étudiant
        const matricule = etudiant?.matricule || '';
        setEtudiantMatricule(matricule);
        
        // Récupérer le nom complet
        const nom = etudiant?.nom_complet || 
                   `${etudiant?.nom || ''} ${etudiant?.post_nom || ''} ${etudiant?.prenom || ''}`.trim() || 
                   etudiant?.full_name || 
                   '';
        setEtudiantNom(nom || `Étudiant ${etudiantId}`);

        // Filtrer les frais par matricule
        const etudiantFrais = (Array.isArray(fraisList) ? fraisList : []).filter(f => {
          let fraisMatricule = null;
          
          if (f.etudiant && typeof f.etudiant === 'string') {
            fraisMatricule = f.etudiant.split(' - ')[0];
          } else if (f.etudiant?.matricule) {
            fraisMatricule = f.etudiant.matricule;
          }
          
          return fraisMatricule === matricule;
        });
        
        if (!mounted) return;
        
        setFraisEtudiant(etudiantFrais);

        // Extraire les types de frais uniques
        const typesMap = new Map();
        etudiantFrais.forEach(f => {
          const typeId = f.type_frais?.id ?? f.type_frais;
          const typeNom = f.type_frais?.nom ?? (typeof f.type_frais === 'string' ? f.type_frais : '');
          if (typeId && !typesMap.has(typeId)) {
            typesMap.set(typeId, { id: typeId, nom: typeNom });
          }
        });
        setTypesDisponibles(Array.from(typesMap.values()));

        // Extraire les semestres uniques
        const semestres = [...new Set(etudiantFrais.map(f => f.semestre).filter(s => s))];
        setSemestresDisponibles(semestres);

        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des frais');
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [etudiantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Quand on sélectionne type ou semestre, chercher le frais correspondant
    if (name === 'type_frais_id' || name === 'semestre') {
      const typeId = name === 'type_frais_id' ? value : form.type_frais_id;
      const semestre = name === 'semestre' ? Number(value) : form.semestre;
      
      const selected = fraisEtudiant.find(
        f => (f.type_frais?.id == typeId || f.type_frais == typeId) && f.semestre == semestre
      );
      setFraisSelected(selected || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.type_frais_id || !form.semestre) {
      alert('Veuillez sélectionner le type de frais et le semestre');
      return;
    }

    if (!fraisSelected) {
      alert('Frais non trouvé');
      return;
    }

    if (!form.montant_paye || parseFloat(form.montant_paye) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    try {
      await fraisApi.createPaiement({
        frais_id: fraisSelected.id,
        montant_paye: form.montant_paye,
        mode_paiement: form.mode_paiement,
        date_paiement: form.date_paiement,
        description: form.description || null,
      });
      alert('Paiement enregistré avec succès');
      navigate(`/frais/etudiant/${etudiantId}/paiements`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement du paiement');
    }
  };

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(`/frais/etudiant/${etudiantId}/paiements`)}
        className="mb-4 rounded bg-gray-500 px-3 py-1 text-white text-sm hover:bg-gray-600"
      >
        ← Retour
      </button>

      <h2 className="text-2xl font-semibold mb-6">Enregistrer un paiement</h2>
      <p className="text-gray-600 mb-2">Étudiant: {etudiantNom}</p>
      {etudiantMatricule && (
        <p className="text-sm text-gray-500 mb-6">Matricule: {etudiantMatricule}</p>
      )}

      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded">
        {/* Section Type de frais */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Type de frais</h3>
          <select
            name="type_frais_id"
            value={form.type_frais_id}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          >
            <option value="">-- Sélectionner un type de frais --</option>
            {typesDisponibles.map(t => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
          {typesDisponibles.length === 0 && (
            <p className="text-yellow-600 text-sm mt-1">Aucun frais assigné à cet étudiant</p>
          )}
        </div>

        {/* Section Semestre */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Semestre</h3>
          <select
            name="semestre"
            value={form.semestre}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          >
            <option value="">-- Sélectionner un semestre --</option>
            {semestresDisponibles.map(s => (
              <option key={s} value={s}>
                {s === 1 ? '1er Semestre' : '2ème Semestre'}
              </option>
            ))}
          </select>
        </div>

        {/* Info montant total (lecture seule) */}
        {fraisSelected && (
          <div className="rounded bg-blue-50 p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Montant total à payer (système):</strong>
            </p>
            <p className="text-2xl font-bold text-blue-700">{parseFloat(fraisSelected.montant_total).toLocaleString('fr-FR')} FC</p>
            <p className="text-xs text-gray-500 mt-2">Ce montant est défini par le tarif dans le système</p>
          </div>
        )}

        {/* Montant payé */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant payé par l'étudiant <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="montant_paye"
            value={form.montant_paye}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          />
          {fraisSelected && form.montant_paye && (
            <p className="text-xs text-gray-500 mt-1">
              Solde restant: {(fraisSelected.montant_total - parseFloat(form.montant_paye)).toLocaleString('fr-FR')} FC
            </p>
          )}
        </div>

        {/* Mode de paiement */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Mode de paiement</h3>
          <select
            name="mode_paiement"
            value={form.mode_paiement}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          >
            <option value="cash">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="banque">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="carte">Carte bancaire</option>
          </select>
        </div>

        {/* Date de paiement */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Date de paiement <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date_paiement"
            value={form.date_paiement}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        {/* Description (optionnel) */}
        <div>
          <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Observations ou notes supplémentaires..."
            rows="4"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Enregistrer le paiement
          </button>
          <button
            type="button"
            onClick={() => navigate(`/frais/etudiant/${etudiantId}/paiements`)}
            className="rounded bg-gray-400 px-6 py-2 text-white hover:bg-gray-500"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}