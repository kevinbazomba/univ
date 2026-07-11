/**
 * EXPORT CENTRALISÉ DE TOUTES LES APIS
 * Utilisation: import { etudiantApi, anneeApi, authApi } from '../services'
 */

export { anneeApi } from './etudiants/anneeApi';
export { faculteApi } from './etudiants/faculteApi';
export { departementApi } from './etudiants/departementApi';
export { promotionApi } from './etudiants/promotionApi';
export { etudiantApi } from './etudiants/etudiantApi';
export { authApi } from './authApi';
export { api, default as apiClient } from './apiClient';
