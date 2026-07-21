/**
 * API CLIENT CENTRALISÉ
 * Tous les appels API passent par ce fichier
 */

import axios from 'axios';

// ============================================
// CONFIGURATION DE BASE
// ============================================


//const API_BASE_URL = 'https://universiteafrica.pythonanywhere.com/api/';
//export const API_BASE_URL = 'http://127.0.0.1:8000/api/';
export const API_BASE_URL = 'https://univ-production-8f5a.up.railway.app/api/';

// Création d'une instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// ============================================
// INTERCEPTEUR POUR LE TOKEN D'AUTHENTIFICATION
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const juryToken = sessionStorage.getItem('jury_access_token');
    if (juryToken) {
      config.headers['X-Jury-Token'] = juryToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// INTERCEPTEUR POUR GÉRER LES ERREURS
// ============================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthRoute = url.includes('/auth/') || url.startsWith('auth/');
    const isJuryRoute = url.includes('jury') || url.includes('fusions-cours');
    const juryErrorMessage = String(
      error.response?.data?.detail || error.response?.data?.error || ''
    ).toLowerCase();

    if (
      error.response?.status === 403 &&
      isJuryRoute &&
      juryErrorMessage.includes('jeton')
    ) {
      sessionStorage.removeItem('jury_access_token');
      sessionStorage.removeItem('jury_access_scope');
      window.dispatchEvent(new Event('jury-token-invalid'));
    }

    // Ne pas tenter de rafraîchir le token pour les routes d'authentification
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}auth/refresh/`, {
          refresh: refreshToken
        });
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// MÉTHODES GÉNÉRIQUES
// ============================================

export const api = {
  get: (url, params = {}) => apiClient.get(url, { params }),
  post: (url, data = {}) => apiClient.post(url, data),
  put: (url, data = {}) => apiClient.put(url, data),
  patch: (url, data = {}) => apiClient.patch(url, data),
  delete: (url) => apiClient.delete(url),
};

// Export aussi l'instance brute si besoin
export default apiClient;
