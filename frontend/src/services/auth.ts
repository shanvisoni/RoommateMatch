import axios from 'axios';
import { tokenStorage } from '../utils/supabase';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.REACT_APP_API_URL || 'https://roommatematch-skb3.onrender.com';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export const authService = {
  async register(email: string, password: string) {
    try {
      const response = await api.post('/auth/register', { email, password });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        tokenStorage.setToken(token);
        tokenStorage.setUser(user);
        toast.success('Registration successful!');
        return { data: response.data.data, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Registration failed: ' + message);
      return { data: null, error: { message } };
    }
  },

  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        tokenStorage.setToken(token);
        tokenStorage.setUser(user);
        toast.success('Login successful!');
        return { data: response.data.data, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Login failed: ' + message);
      return { data: null, error: { message } };
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
      tokenStorage.clear();
      toast.success('Logged out successfully!');
      return { error: null };
    } catch (error: any) {
      // Even if the API call fails, clear local storage
      tokenStorage.clear();
      toast.success('Logged out successfully!');
      return { error: null };
    }
  },

  async getCurrentUser() {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        console.log('🔍 No token found in storage');
        return { user: null, error: null };
      }

      console.log('🔍 Checking current user with token:', token.substring(0, 20) + '...');
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        const user = response.data.data.user;
        tokenStorage.setUser(user);
        console.log('✅ Current user loaded:', user.id);
        return { user, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('❌ Get current user failed:', error);
      // If token is invalid, clear it
      tokenStorage.clear();
      return { user: null, error };
    }
  },

  async resetPassword(email: string) {
    try {
      const response = await api.post('/auth/reset-password', { email });
      
      if (response.data.success) {
        toast.success('Password reset instructions sent to your email!');
        return { error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Password reset failed: ' + message);
      return { error: { message } };
    }
  },

  isAuthenticated() {
    return !!tokenStorage.getToken();
  },

  getStoredUser() {
    return tokenStorage.getUser();
  }
};
