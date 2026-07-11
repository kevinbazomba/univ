import { api } from './apiClient';

const ENDPOINT = 'auth/';

export const authApi = {
  // Inscription
  register: (userData) => api.post(`${ENDPOINT}register/`, userData).then((res) => res.data),
  
  // Connexion
  login: (credentials) => api.post(`${ENDPOINT}login/`, credentials).then((res) => res.data),
  
  // Déconnexion
  logout: (refreshToken) => api.post(`${ENDPOINT}logout/`, { refresh: refreshToken }).then((res) => res.data),
  
  // Rafraîchir le token
  refresh: (refreshToken) => api.post(`${ENDPOINT}refresh/`, { refresh: refreshToken }).then((res) => res.data),
  
  // Obtenir le profil
  getProfile: () => api.get(`${ENDPOINT}profile/`).then((res) => res.data),
};