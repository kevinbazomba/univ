/**
 * PROFESSEUR SERVICE
 * Gestion des professeurs et authentification
 */

import { api } from '../apiClient';

const BASE_URL = 'professeurs/';

export const professeurService = {
  // Inscription publique (le backend force le compte professeur à inactif)
  getRegistrationOptions: () => api.get(`${BASE_URL}options-inscription/`).then((res) => res.data),
  register: (data) => api.post(`${BASE_URL}inscription/`, data).then((res) => res.data),

  // ========== CRUD ==========
  // Récupérer tous les professeurs
  getAll: (params = {}) => api.get(BASE_URL, params),
  
  // Récupérer un professeur par ID
  getById: (id) => api.get(`${BASE_URL}${id}/`),
  
  // Créer un professeur
  create: (data) => api.post(BASE_URL, data),
  
  // Mettre à jour un professeur
  update: (id, data) => api.put(`${BASE_URL}${id}/`, data),
  
  // Mettre à jour partiellement un professeur
  patch: (id, data) => api.patch(`${BASE_URL}${id}/`, data),
  
  // Supprimer un professeur
  delete: (id) => api.delete(`${BASE_URL}${id}/`),
  
  // ========== AUTHENTIFICATION ==========
  // Connexion
  login: (email, mot_de_passe) => api.post(`${BASE_URL}login/`, { email, mot_de_passe }),
  
  // Déconnexion
  logout: () => api.post(`${BASE_URL}logout/`),
  
  // Récupérer le profil connecté
  getMe: () => api.get(`${BASE_URL}me/`),

  // Espace personnel du professeur connecté
  getMonEspace: (anneeId = null) => api.get(`${BASE_URL}mon-espace/`, anneeId ? { annee_academique: anneeId } : {}).then((res) => res.data),
  updateMonProfil: (data) => api.patch(`${BASE_URL}mon-espace/`, data).then((res) => res.data),
  changeMyPassword: (data) => api.post(`${BASE_URL}changer-mon-mot-de-passe/`, data).then((res) => res.data),
  createMyCourse: (data) => api.post(`${BASE_URL}creer-mon-cours/`, data).then((res) => res.data),
  createMyApplication: (data) => api.post(`${BASE_URL}creer-mon-application/`, data).then((res) => res.data),
  deleteMyApplication: (id) => api.delete(`${BASE_URL}supprimer-mon-application/${id}/`).then((res) => res.data),
  getMyStudents: (params = {}) => api.get(`${BASE_URL}mes-etudiants/`, params).then((res) => res.data),
  gradeStudent: (data) => api.post(`${BASE_URL}noter-etudiant/`, data).then((res) => res.data),
  
  // Vérifier un token
  verifyToken: (token) => api.post(`${BASE_URL}verify-token/`, { token }),
  
  // Changer le mot de passe
  changePassword: (id, ancien_mot_de_passe, nouveau_mot_de_passe, confirmer_mot_de_passe) => 
    api.post(`${BASE_URL}${id}/change-password/`, {
      ancien_mot_de_passe,
      nouveau_mot_de_passe,
      confirmer_mot_de_passe
    }),
  
  // ========== FILTRES ==========
  // Récupérer les professeurs par faculté
  getByFaculte: (faculteId) => api.get(BASE_URL, { faculte: faculteId }),
  
  // Récupérer les professeurs par grade
  getByGrade: (gradeId) => api.get(BASE_URL, { grade: gradeId }),
  
  // Récupérer les professeurs actifs
  getActifs: () => api.get(BASE_URL, { est_actif: true }),
};

export default professeurService;
