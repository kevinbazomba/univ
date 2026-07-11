/**
 * FACULTE SERVICE
 * Gestion des facultés (lecture seule)
 */

import { api } from '../apiClient';

const BASE_URL = 'facultes/';

export const faculteService = {
  // Récupérer toutes les facultés
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer une faculté par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
};

export default faculteService;