import { api } from '../apiClient';

const ENDPOINT = 'annees/';

export const anneeApi = {
  // Récupérer toutes les années
  getAll: () => api.get(ENDPOINT),
  
  // Récupérer une année par ID
  getById: (id) => api.get(`${ENDPOINT}${id}/`),
  
  // Créer une année
  create: (data) => api.post(ENDPOINT, data),
  
  // Modifier une année
  update: (id, data) => api.put(`${ENDPOINT}${id}/`, data),
  
  // Supprimer une année
  delete: (id) => api.delete(`${ENDPOINT}${id}/`),
  
  // Récupérer l'année active
  getActive: () => api.get(`${ENDPOINT}active/`),
  
  // Définir une année comme active
  setActive: (id) => api.post(`${ENDPOINT}${id}/set_active/`),
};