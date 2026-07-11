/**
 * PROMOTION SERVICE
 * Gestion des promotions (lecture seule)
 */

import { api } from '../apiClient';

const BASE_URL = 'promotions/';

export const promotionService = {
  // Récupérer toutes les promotions
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer une promotion par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
};

export default promotionService;