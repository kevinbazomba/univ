import axios from 'axios';
import { API_BASE_URL } from '../apiClient';

const studentClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

studentClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('student_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

studentClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const refresh = localStorage.getItem('student_refresh_token');

    if (error.response?.status === 401 && refresh && !request?._retry) {
      request._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}auth/refresh/`, { refresh });
        localStorage.setItem('student_access_token', response.data.access);
        request.headers.Authorization = `Bearer ${response.data.access}`;
        return studentClient(request);
      } catch {
        clearStudentSession();
      }
    }

    return Promise.reject(error);
  },
);

export const clearStudentSession = () => {
  localStorage.removeItem('student_access_token');
  localStorage.removeItem('student_refresh_token');
  localStorage.removeItem('student_profile');
};

export const studentAccountApi = {
  login: (credentials) => studentClient
    .post('etudiants/login/', credentials)
    .then((response) => response.data),

  getProfile: () => studentClient
    .get('etudiants/mon-profil/')
    .then((response) => response.data),

  getSpace: (anneeId = null) => studentClient
    .get('etudiants/mon-espace/', { params: anneeId ? { annee_academique: anneeId } : {} })
    .then((response) => response.data),

  updateProfile: (data) => studentClient
    .patch('etudiants/mon-profil/', data)
    .then((response) => response.data),

  changePassword: (data) => studentClient
    .post('etudiants/changer-mot-de-passe/', data)
    .then((response) => response.data),
};

export default studentAccountApi;
