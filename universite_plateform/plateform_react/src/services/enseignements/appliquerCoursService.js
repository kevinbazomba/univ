/**
 * APPLIQUER COURS SERVICE
 * Gestion des applications individuelles de cours
 */

import { api } from '../apiClient';

const BASE_URL = 'appliquer-cours/';

export const appliquerCoursService = {
  // ========== CRUD ==========
  // Récupérer toutes les applications
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer une application par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
  
  // Créer une application individuelle
  create: (data) => api.post(BASE_URL, data),
  
  // Mettre à jour une application
  update: (id, data) => api.put(`${BASE_URL}${id}/`, data),
  
  // Mettre à jour partiellement une application
  patch: (id, data) => api.patch(`${BASE_URL}${id}/`, data),
  
  // Supprimer une application individuelle
  delete: (id) => api.delete(`${BASE_URL}${id}/`),
  
  // ========== ACTIONS SPÉCIFIQUES ==========
  // Récupérer tous les cours d'un étudiant
  getByEtudiant: (etudiantId, anneeId = null) => 
    api.get(`${BASE_URL}by-etudiant/`, {
      etudiant_id: etudiantId,
      ...(anneeId ? { annee_academique: anneeId } : {}),
    }),
  
  // Appliquer un cours à un étudiant
  applyToEtudiant: (gestionId, etudiantId) => 
    api.post(`${BASE_URL}apply-to-etudiant/`, { gestion_id: gestionId, etudiant_id: etudiantId }),
  
  // Activer/Désactiver une application
  toggleActive: (id) => api.post(`${BASE_URL}${id}/toggle-active/`),
  
  // Filtrer par période
  getByPeriod: (date_debut, date_fin, etudiant = null) => {
    const params = { date_debut, date_fin };
    if (etudiant) params.etudiant = etudiant;
    return api.get(`${BASE_URL}by-period/`, params);
  },
  
  // ========== FILTRES ==========
  // Par étudiant
  getByEtudiantId: (etudiantId) => api.get(BASE_URL, { etudiant: etudiantId }),
  
  // Par gestion
  getByGestion: (gestionId) => api.get(BASE_URL, { gestion: gestionId }),
  
  // Par cours
  getByCours: (coursId) => api.get(BASE_URL, { cours: coursId }),
  
  // Applications actives
  getActifs: () => api.get(BASE_URL, { est_actif: true }),
};

export default appliquerCoursService;
