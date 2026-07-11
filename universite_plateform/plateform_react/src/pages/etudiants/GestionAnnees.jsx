import { useState, useEffect } from 'react';
import { anneeApi } from '../../services';  // Import centralisé

const GestionAnnees = ({ onAnneeChange, anneeSelectionnee }) => {
  const [annees, setAnnees] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    date_debut: '',
    date_fin: '',
    description: ''
  });

  useEffect(() => {
    chargerAnnees();
  }, []);

  const chargerAnnees = async () => {
    try {
      const response = await anneeApi.getAll();
      const data = response.data;
      setAnnees(data);
      const active = data.find(a => a.est_active);
      setAnneeActive(active);
      if (active && !anneeSelectionnee) {
        onAnneeChange(active.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await anneeApi.create(formData);
      setShowForm(false);
      setFormData({ nom: '', date_debut: '', date_fin: '', description: '' });
      chargerAnnees();
      alert('Année académique créée avec succès !');
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  const setActive = async (id) => {
    try {
      await anneeApi.setActive(id);
      chargerAnnees();
      onAnneeChange(id);
      alert('Année active mise à jour');
    } catch (error) {
      alert('Erreur');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Année académique</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showForm ? 'Fermer' : '+ Nouvelle année'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              name="nom"
              placeholder="Ex: 2024-2025"
              value={formData.nom}
              onChange={handleChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="description"
              placeholder="Description (optionnel)"
              value={formData.description}
              onChange={handleChange}
              className="px-3 py-2 border rounded md:col-span-2"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Créer
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {annees.map((annee) => (
          <button
            key={annee.id}
            onClick={() => {
              onAnneeChange(annee.id);
              if (!annee.est_active) {
                setActive(annee.id);
              }
            }}
            className={`
              px-4 py-2 rounded-lg transition-all duration-200
              ${anneeSelectionnee === annee.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
              ${annee.est_active ? 'ring-2 ring-green-500' : ''}
            `}
          >
            {annee.nom}
            {annee.est_active && (
              <span className="ml-2 text-xs bg-green-500 text-white px-1 rounded">Active</span>
            )}
          </button>
        ))}
      </div>

      {anneeActive && (
        <div className="mt-3 text-sm text-gray-500">
          📅 Période: du {new Date(anneeActive.date_debut).toLocaleDateString('fr-FR')} 
          au {new Date(anneeActive.date_fin).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
};

export default GestionAnnees;