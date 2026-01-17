import axios from 'axios';
import { tokenStorage } from '../utils/supabase';
import toast from 'react-hot-toast';

import { API_URL } from '../config';

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

export interface Profile {
  id: number;
  user_id: number;
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
  drinking?: string;
  pets?: boolean;
  cleanliness?: string;
  socialLevel?: string;
  cooking?: string;
  guests?: string;
  music?: string;
  createdAt: string;
  updatedAt: string;
}

export const profileService = {
  async createProfile(profileData: {
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
    drinking?: string;
    pets?: boolean;
    socialLevel?: string;
    cooking?: string;
  }) {
    try {
      console.log('🚀 Sending profile data:', profileData);
      const response = await api.post('/profile', profileData);
      console.log('📡 Profile creation response:', response.data);

      if (response.data.success) {
        toast.success('Profile created successfully!');
        return { data: response.data.data, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Profile creation failed: ' + message);
      return { data: null, error: { message } };
    }
  },

  async getProfile(userId?: number) {
    try {
      console.log('🔍 Getting profile for userId:', userId);
      let response;

      if (userId) {
        response = await api.get(`/profile/${userId}`);
      } else {
        response = await api.get('/profile');
      }

      console.log('📡 Profile response:', response.data);
      if (response.data.success) {
        return { data: response.data.data, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      // Don't log 404 errors as they're expected for new users
      if (error.response?.status !== 404) {
        console.error('Profile fetch error:', error);
      }
      return { data: null, error: { message } };
    }
  },

  async updateProfile(profileData: {
    name?: string;
    age?: number;
    bio?: string;
    location?: string;
    profilePhotoUrl?: string;
    gender?: string;
    profession?: string;
    budget?: number;
    moveInDate?: string;
    smoking?: boolean;
    drinking?: string;
    pets?: boolean;
    cleanliness?: string;
    socialLevel?: string;
    cooking?: string;
    guests?: string;
    music?: string;
  }) {
    try {
      const response = await api.put('/profile', profileData);

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        return { data: response.data.data, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Profile update failed: ' + message);
      return { data: null, error: { message } };
    }
  },

  async getAllProfiles() {
    try {
      const response = await api.get('/profile/all');

      if (response.data.success) {
        return { data: response.data.data, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Failed to load profiles: ' + message);
      return { data: null, error: { message } };
    }
  },

  async uploadProfilePhoto(file: File) {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/profile/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Use base64 image if available (works perfectly for deployment)
        const base64Image = response.data.data.base64Image;
        const photoUrl = response.data.data.photoUrl;

        // Prefer base64 for reliability, fallback to URL
        const finalImageUrl = base64Image || `${API_URL}${photoUrl}`;

        console.log('📸 Uploaded photo - Base64 available:', !!base64Image);
        console.log('📸 Final image URL:', finalImageUrl);
        toast.success('Photo uploaded successfully!');
        return { data: finalImageUrl, error: null };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      toast.error('Photo upload failed: ' + message);
      return { data: null, error: { message } };
    }
  }
};
