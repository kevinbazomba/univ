/**
 * GRADE SERVICE
 * Gestion des grades
 */

import { api } from '../apiClient';

const BASE_URL = 'grades/';

export const gradeService = {
  // Récupérer tous les grades
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer un grade par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
  
  // Créer un grade
  create: (data) => api.post(BASE_URL, data),
  
  // Mettre à jour un grade
  update: (id, data) => api.put(`${BASE_URL}${id}/`, data),
  
  // Supprimer un grade
  delete: (id) => api.delete(`${BASE_URL}${id}/`),
  
  // Récupérer les grades actifs
  getActifs: () => api.get(BASE_URL, { est_actif: true }),
};

export default gradeService;