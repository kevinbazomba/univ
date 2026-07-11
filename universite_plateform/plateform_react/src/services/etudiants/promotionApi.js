import { api } from '../apiClient';

const ENDPOINT = 'promotions/';

export const promotionApi = {
  // Récupérer toutes les promotions
  getAll: () => api.get(ENDPOINT),
  
  // Récupérer une promotion par ID
  getById: (id) => api.get(`${ENDPOINT}${id}/`),
  
  // Créer une promotion
  create: (data) => api.post(ENDPOINT, data),
  
  // Modifier une promotion
  update: (id, data) => api.put(`${ENDPOINT}${id}/`, data),
  
  // Supprimer une promotion
  delete: (id) => api.delete(`${ENDPOINT}${id}/`),
};