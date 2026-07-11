/**
 * HOOK PERSONNALISÉ D'AUTHENTIFICATION
 * Ce hook fournit des fonctions simplifiées pour gérer l'authentification
 */

import { useAuthStore } from '../store/authStore';

// Hook personnalisé pour l'authentification
export const useAuth = () => {
  // Récupérer toutes les fonctions et états du store
  const {
    user,           // Utilisateur connecté
    isAuthenticated, // État de connexion (true/false)
    isLoading,      // État de chargement
    error,          // Erreur éventuelle
    login,          // Fonction de connexion
    register,       // Fonction d'inscription
    logout,         // Fonction de déconnexion
    clearError,     // Fonction pour effacer les erreurs
  } = useAuthStore();

  // Retourner toutes les fonctions et états
  return {
    // États
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    
    // Fonctions utilitaires
    hasRole: (role) => {
      // Vérifier si l'utilisateur a un certain rôle (à implémenter selon ton besoin)
      return user?.role === role;
    },
    
    isAdmin: () => {
      // Vérifier si l'utilisateur est admin
      return user?.is_superuser === true || user?.role === 'admin';
    },
    
    isStudent: () => {
      // Vérifier si l'utilisateur est étudiant
      return user?.role === 'etudiant';
    },
    
    isTeacher: () => {
      // Vérifier si l'utilisateur est enseignant
      return user?.role === 'enseignant';
    },
  };
};

// Hook pour protéger les routes (redirige si non connecté)
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};

// Hook pour rediriger si déjà connecté (pour login/register)
export const useRequireGuest = (redirectTo = '/dashboard') => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};