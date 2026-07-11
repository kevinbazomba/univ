import React, { useEffect, useState } from 'react';
import { fraisApi } from '../../services/frais';
import { etudiantApi } from '../../services/etudiants/etudiantApi';

export default function CreatePaiement() {
  const [etudiants, setEtudiants] = useState([]);
  const [frais, setFrais] = useState([]);
  const [form, setForm] = useState({ frais_id: '', montant_paye: '', mode_paiement: 'cash', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // récupérer étudiants et frais pour remplir les selects
    Promise.all([etudiantApi.getAll(), fraisApi.getFrais()])
      .then(([eRes, fRes]) => {
        setEtudiants(eRes.data || eRes);
        setFrais(fRes);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fraisApi.createPaiement(form);
      alert('Paiement enregistré');
      setForm({ frais_id: '', montant_paye: '', mode_paiement: 'cash', description: '' });
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  if (loading) return <div>Chargement…</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Enregistrer un paiement</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Frais</label>
          <select name="frais_id" value={form.frais_id} onChange={handleChange} required className="w-full">
            <option value="">Sélectionner</option>
            {frais.map(f => {
              const etudiantLabel = typeof f.etudiant === 'string'
                ? f.etudiant
                : f.etudiant?.nom_complet || f.etudiant?.matricule || '-';
              return (
                <option key={f.id} value={f.id}>{etudiantLabel} - {f.type_frais?.nom} - {f.semestre === 1 ? '1er' : '2ème'}</option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Montant</label>
          <input type="number" name="montant_paye" value={form.montant_paye} onChange={handleChange} required className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium">Mode de paiement</label>
          <select name="mode_paiement" value={form.mode_paiement} onChange={handleChange} className="w-full">
            <option value="cash">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="banque">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="carte">Carte bancaire</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Description (optionnel)</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full" />
        </div>

        <button className="rounded bg-blue-600 px-4 py-2 text-white">Enregistrer</button>
      </form>
    </div>
  );
}
