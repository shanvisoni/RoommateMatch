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

export interface Feedback {
  id: number;
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment?: string;
  cleanliness?: number;
  communication?: number;
  reliability?: number;
  createdAt: string;
  fromUser?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
  toUser?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
}

export interface FeedbackSummary {
  feedbacks: Feedback[];
  averageRating: number;
  ratingCount: number;
}

export const feedbackService = {
  async getUserFeedback(userId: number) {
    try {
      const response = await api.get(`/feedback/user/${userId}`);
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load feedback: ' + error.message);
      return { data: null, error };
    }
  },

  async getGivenFeedback() {
    try {
      const response = await api.get('/feedback/given');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load given feedback: ' + error.message);
      return { data: null, error };
    }
  },

  async createFeedback(data: {
    toUserId: number;
    rating: number;
    comment?: string;
    cleanliness?: number;
    communication?: number;
    reliability?: number;
  }) {
    try {
      const response = await api.post('/feedback/create', data);
      
      toast.success('Feedback submitted!');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to submit feedback: ' + error.message);
      return { data: null, error };
    }
  },

  async updateFeedback(feedbackId: number, data: {
    rating?: number;
    comment?: string;
    cleanliness?: number;
    communication?: number;
    reliability?: number;
  }) {
    try {
      const response = await api.put(`/feedback/update/${feedbackId}`, data);
      
      toast.success('Feedback updated!');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to update feedback: ' + error.message);
      return { data: null, error };
    }
  },

  async deleteFeedback(feedbackId: number) {
    try {
      await api.delete(`/feedback/${feedbackId}`);
      
      toast.success('Feedback deleted!');
      return { data: true, error: null };
    } catch (error: any) {
      toast.error('Failed to delete feedback: ' + error.message);
      return { data: null, error };
    }
  },

  async checkFeedbackExists(toUserId: number) {
    try {
      const response = await api.get(`/feedback/check/${toUserId}`);
      return { data: response.data.data, error: null };
    } catch (error: any) {
      return { data: { exists: false, feedback: null }, error };
    }
  }
};
