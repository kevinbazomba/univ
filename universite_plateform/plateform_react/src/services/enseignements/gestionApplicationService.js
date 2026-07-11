/**
 * GESTION APPLICATION COURS SERVICE
 * Gestion des applications de cours (conteneur principal)
 */

import { api } from '../apiClient';

const BASE_URL = 'gestion-applications/';

export const gestionApplicationService = {
  // ========== CRUD ==========
  // Récupérer toutes les gestions
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer une gestion par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
  
  // Créer une gestion
  create: (data) => api.post(BASE_URL, data),
  
  // Mettre à jour une gestion
  update: (id, data) => api.put(`${BASE_URL}${id}/`, data),
  
  // Mettre à jour partiellement une gestion
  patch: (id, data) => api.patch(`${BASE_URL}${id}/`, data),
  
  // Supprimer une gestion (supprime toutes les applications liées)
  delete: (id) => api.delete(`${BASE_URL}${id}/`),
  
  // ========== ACTIONS SPÉCIFIQUES ==========
  // Réappliquer le cours aux étudiants
  reapply: (id) => api.post(`${BASE_URL}${id}/reapply/`),
  
  // Supprimer toutes les applications individuelles
  deleteAllApplications: (id) => api.delete(`${BASE_URL}${id}/delete-all-applications/`),
  
  // Filtrer par période
  getByPeriod: (date_debut, date_fin) => 
    api.get(`${BASE_URL}by-period/`, { date_debut, date_fin }),
  
  // ========== FILTRES ==========
  // Par créateur
  getByCreateur: (createurId) => api.get(BASE_URL, { createur: createurId }),
  
  // Par cours
  getByCours: (coursId) => api.get(BASE_URL, { cours: coursId }),
  
  // Par faculté
  getByFaculte: (faculteId) => api.get(BASE_URL, { faculte: faculteId }),
  
  // Par promotion
  getByPromotion: (promotionId) => api.get(BASE_URL, { promotion: promotionId }),
  
  // Par année académique
  getByAnneeAcademique: (anneeId) => api.get(BASE_URL, { annee_academique: anneeId }),
};

export default gestionApplicationService;