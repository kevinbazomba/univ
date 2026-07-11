import { api } from '../apiClient';
export const departementApi = {
  getAll: (faculte = null) => api.get('departements/', faculte ? { faculte } : {}),
};
