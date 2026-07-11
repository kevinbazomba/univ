import { api } from './apiClient';

let cachedIdentity = null;

export const universityApi = {
  getIdentity: async () => {
    if (cachedIdentity) return cachedIdentity;
    const response = await api.get('auth/universite/');
    cachedIdentity = response.data;
    return cachedIdentity;
  },
};

export default universityApi;
