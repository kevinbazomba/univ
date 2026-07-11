import { api } from "../apiClient";

const BASE = "frais/";

export const fraisApi = {
  // Tarifs
  getTarifs: (anneeId) =>
    api
      .get(`${BASE}tarifs/`, anneeId ? { annee_academique: anneeId } : {})
      .then((res) => res.data),
  createTarif: (data) =>
    api.post(`${BASE}tarifs/`, data).then((res) => res.data),
  updateTarif: (id, data) =>
    api.put(`${BASE}tarifs/${id}/`, data).then((res) => res.data),
  deleteTarif: (id) =>
    api.delete(`${BASE}tarifs/${id}/`).then((res) => res.data),

  // Frais assignés
  getFrais: (anneeId, etudiantId) =>
    api
      .get(`${BASE}frais/`, {
        ...(anneeId ? { annee_academique: anneeId } : {}),
        ...(etudiantId ? { etudiant: etudiantId } : {}),
      })
      .then((res) => res.data),
  createFrais: (data) =>
    api.post(`${BASE}frais/`, data).then((res) => res.data),
  updateFrais: (id, data) =>
    api.patch(`${BASE}frais/${id}/`, data).then((res) => res.data),
  deleteFrais: (id) =>
    api.delete(`${BASE}frais/${id}/`).then((res) => res.data),

  // Paiements
  getPaiements: (anneeId, etudiantId) =>
    api
      .get(`${BASE}paiements/`, {
        ...(anneeId ? { annee_academique: anneeId } : {}),
        ...(etudiantId ? { etudiant: etudiantId } : {}),
      })
      .then((res) => res.data),
  createPaiement: (data) =>
    api.post(`${BASE}paiements/`, data).then((res) => res.data),
  // Types de frais
  getTypes: () => api.get(`${BASE}types/`).then((res) => res.data),
  // Appliquer un tarif aux étudiants
  applyTarif: (tarifId) =>
    api.post(`${BASE}tarifs/${tarifId}/apply/`).then((res) => res.data),
};

export default fraisApi;
