import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import { toast } from 'sonner';

const ConnexionCorpsAcademique = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await login(formData);

    if (result.success) {
      toast.success('Connexion réussie !');
      navigate(result.accountType === 'professeur' ? '/espace-professeur' : '/dashboard');
    } else {
      toast.error(result.error || 'Erreur de connexion');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Nom d&apos;utilisateur, matricule ou email</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={(event) => setFormData({ ...formData, username: event.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={(event) => setFormData({ ...formData, password: event.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Pas de compte ?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:underline">S&apos;inscrire</Link>
      </p>
    </form>
  );
};

export default ConnexionCorpsAcademique;
