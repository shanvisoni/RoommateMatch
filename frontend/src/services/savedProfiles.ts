import axios from 'axios';
import { tokenStorage } from '../utils/supabase';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

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

export interface SavedProfile {
  id: number;
  userId: number;
  profileId: number;
  createdAt: string;
  profile?: {
    id: number;
    name: string;
    age: number;
    bio: string;
    location: string;
    profilePhotoUrl?: string;
    gender?: string;
    profession?: string;
    budget?: number;
    moveInDate?: string;
    smoking?: boolean;
    pets?: boolean;
    cleanliness?: string;
    socialLevel?: string;
    workFromHome?: boolean;
    guests?: string;
    music?: string;
    cooking?: string;
  };
}

export const savedProfilesService = {
  async getSavedProfiles() {
    try {
      const response = await api.get('/saved-profiles');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load saved profiles: ' + error.message);
      return { data: null, error };
    }
  },

  async saveProfile(profileId: number) {
    try {
      const response = await api.post('/saved-profiles/save', {
        profileId
      });
      
      toast.success('Profile saved!');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to save profile: ' + error.message);
      return { data: null, error };
    }
  },

  async unsaveProfile(profileId: number) {
    try {
      await api.delete(`/saved-profiles/unsave/${profileId}`);
      
      toast.success('Profile unsaved!');
      return { data: true, error: null };
    } catch (error: any) {
      toast.error('Failed to unsave profile: ' + error.message);
      return { data: null, error };
    }
  },

  async checkIfSaved(profileId: number) {
    try {
      const response = await api.get(`/saved-profiles/check/${profileId}`);
      return { data: response.data.data.isSaved, error: null };
    } catch (error: any) {
      return { data: false, error };
    }
  }
};
