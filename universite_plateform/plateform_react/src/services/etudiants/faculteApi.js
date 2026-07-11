import { api } from '../apiClient';

const ENDPOINT = 'facultes/';

export const faculteApi = {
  // Récupérer toutes les facultés
  getAll: () => api.get(ENDPOINT),
  
  // Récupérer une faculté par ID
  getById: (id) => api.get(`${ENDPOINT}${id}/`),
  
  // Créer une faculté
  create: (data) => api.post(ENDPOINT, data),
  
  // Modifier une faculté
  update: (id, data) => api.put(`${ENDPOINT}${id}/`, data),
  
  // Supprimer une faculté
  delete: (id) => api.delete(`${ENDPOINT}${id}/`),
};