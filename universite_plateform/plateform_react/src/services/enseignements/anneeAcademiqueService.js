/**
 * ANNEE ACADEMIQUE SERVICE
 * Gestion des années académiques
 */

import { api } from '../apiClient';

const BASE_URL = 'annees-academiques/';

export const anneeAcademiqueService = {
  // Récupérer toutes les années
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer une année par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
  
  // Récupérer l'année académique active
  getActive: () => api.get(`${BASE_URL}active/`),
};

export default anneeAcademiqueService;