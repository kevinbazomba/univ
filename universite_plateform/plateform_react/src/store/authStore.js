import { create } from 'zustand';
import { authApi } from '../services/authApi';

const accessTokenInitial = localStorage.getItem('access_token');

const useAuthStore = create((set) => ({
  user: accessTokenInitial ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  isAuthenticated: Boolean(accessTokenInitial && localStorage.getItem('user')),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    console.log('🔄 Store: Début connexion');
    set({ isLoading: true, error: null });
    
    try {
      const data = await authApi.login(credentials);
      
      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      console.log('🔄 Store: Connexion réussie', data);
      set({ 
        user: data.user || null, 
        isAuthenticated: !!data.access, 
        isLoading: false 
      });
      return { success: true, accountType: data.user?.account_type };
      
    } catch (error) {
      const message = error.response?.data?.error || 'Erreuro de connexion';
      console.error('🔄 Store: Erreur connexion', message);
      set({ 
        error: message, 
        isLoading: false 
      });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    console.log('🔄 Store: Début inscription');
    set({ isLoading: true, error: null });
    
    try {
      const data = await authApi.register(userData);
      
      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      console.log('🔄 Store: Inscription réussie', data);
      set({ 
        user: data.user || null, 
        isAuthenticated: !!data.access, 
        isLoading: false 
      });
      return { success: true };
      
    } catch (error) {
      const errors = error.response?.data || { error: "Erreur d'inscription" };
      console.error('🔄 Store: Erreur inscription', errors);
      set({ 
        error: errors, 
        isLoading: false 
      });
      return { success: false, error: errors };
    }
  },

  logout: async () => {
    try {
      await authApi.logout(localStorage.getItem('refresh_token'));
    } catch (error) {
      console.warn('🔄 Store: Erreur logout', error);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
