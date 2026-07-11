/**
 * COURS SERVICE
 * Gestion des cours
 */

import { api } from '../apiClient';

const BASE_URL = 'cours/';

export const coursService = {
  // Récupérer tous les cours
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer un cours par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
  
  // Créer un cours
  create: (data) => api.post(BASE_URL, data),
  
  // Mettre à jour un cours
  update: (id, data) => api.put(`${BASE_URL}${id}/`, data),
  
  // Mettre à jour partiellement un cours
  patch: (id, data) => api.patch(`${BASE_URL}${id}/`, data),
  
  // Supprimer un cours
  delete: (id) => api.delete(`${BASE_URL}${id}/`),
  
  // ========== FILTRES ==========
  // Récupérer les cours par responsable
  getByResponsable: (responsableId) => api.get(BASE_URL, { responsable: responsableId }),
  
  // Rechercher des cours
  search: (query) => api.get(BASE_URL, { search: query }),
};

export default coursService;