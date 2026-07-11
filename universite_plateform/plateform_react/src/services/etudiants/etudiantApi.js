import { api } from '../apiClient';

const ENDPOINT = 'etudiants/';

export const etudiantApi = {
  // Inscription publique d'un étudiant
  register: (data) => api.post(`${ENDPOINT}inscription/`, data),

  // ========== CRUD DE BASE ==========
  
  // Récupérer tous les étudiants (optionnellement par année)
  getAll: (anneeId = null) => {
    const params = anneeId ? { annee_academique: anneeId } : {};
    return api.get(ENDPOINT, params);
  },
  
  // Récupérer un étudiant par ID
  getById: (id) => api.get(`${ENDPOINT}${id}/`),
  
  // Créer un étudiant
  create: (data) => api.post(ENDPOINT, data),
  
  // Modifier un étudiant
  update: (id, data) => api.put(`${ENDPOINT}${id}/`, data),
  
  // Supprimer un étudiant
  delete: (id) => api.delete(`${ENDPOINT}${id}/`),
  
  // ========== FONCTIONS SPÉCIALES ==========
  
  // Rechercher des étudiants
  search: (query, anneeId = null) => {
    let url = `${ENDPOINT}rechercher/?q=${query}`;
    if (anneeId) url += `&annee_academique=${anneeId}`;
    return api.get(url);
  },
  
  // Filtrer par faculté
  getByFaculte: (faculteId, anneeId = null) => api.get(`${ENDPOINT}par_faculte/`, { faculte_id: faculteId, ...(anneeId ? { annee_academique: anneeId } : {}) }),
  
  // Filtrer par statut de frais
  getByStatut: (statut, anneeId = null) => api.get(`${ENDPOINT}par_statut/`, { statut, ...(anneeId ? { annee_academique: anneeId } : {}) }),
  
  // Filtrer par année académique
  getByAnnee: (anneeId) => api.get(`${ENDPOINT}par_annee/?annee_id=${anneeId}`),
  
  // Modifier le statut des frais
  updateStatutFrais: (id, statut) => 
    api.patch(`${ENDPOINT}${id}/modifier_statut_frais/`, { statut_frais: statut }),
  
  // Changer l'année académique d'un étudiant
  changerAnnee: (id, anneeId) => 
    api.patch(`${ENDPOINT}${id}/changer_annee/`, { annee_academique_id: anneeId }),
};
