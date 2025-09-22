import axios from 'axios';
import { tokenStorage } from '../utils/supabase';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

export interface Match {
  id: number;
  user1Id: number;
  user2Id: number;
  status: 'pending' | 'matched' | 'rejected';
  createdAt: string;
}

export const matchingService = {
  async likeUser(targetUserId: number) {
    try {
      const response = await api.post('/matching/like', {
        targetUserId
      });
      
      toast.success('Like sent!');
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to like user: ' + error.message);
      return { data: null, error };
    }
  },

  async passUser(targetUserId: number) {
    try {
      const response = await api.post('/matching/pass', {
        targetUserId
      });
      
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to pass user: ' + error.message);
      return { data: null, error };
    }
  },

  async getMatches() {
    try {
      const response = await api.get('/matching/matches');
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load matches: ' + error.message);
      return { data: null, error };
    }
  },

  async getPotentialMatches() {
    try {
      const response = await api.get('/matching/potential');
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load potential matches: ' + error.message);
      return { data: null, error };
    }
  }
};
