import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import studentAccountApi from '../../../services/etudiants/studentAccountApi';

const ConnexionEtudiant = () => {
  const [formData, setFormData] = useState({ matricule: '', mot_de_passe: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await studentAccountApi.login(formData);
      localStorage.setItem('student_access_token', data.access);
      localStorage.setItem('student_refresh_token', data.refresh);
      localStorage.setItem('student_profile', JSON.stringify(data.etudiant));
      toast.success(`Bienvenue ${data.etudiant.prenom} !`);
      navigate('/espace-etudiant');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Matricule ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Matricule</label>
        <input
          type="text"
          value={formData.matricule}
          onChange={(event) => setFormData({ ...formData, matricule: event.target.value })}
          placeholder="Votre matricule étudiant"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          type="password"
          value={formData.mot_de_passe}
          onChange={(event) => setFormData({ ...formData, mot_de_passe: event.target.value })}
          placeholder="Votre mot de passe"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Accéder à mon espace'}
      </button>

      <p className="text-center text-xs leading-5 text-gray-500">
        Utilisez le matricule et le mot de passe enregistrés dans votre dossier étudiant.
      </p>
    </form>
  );
};

export default ConnexionEtudiant;
