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

export interface Connection {
  id: number;
  requesterId: number;
  receiverId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
  receiver?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
}

export const connectionsService = {
  async getSentConnections() {
    try {
      const response = await api.get('/connections/sent');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load sent connections: ' + error.message);
      return { data: null, error };
    }
  },

  async getReceivedConnections() {
    try {
      const response = await api.get('/connections/received');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load received connections: ' + error.message);
      return { data: null, error };
    }
  },

  async sendConnectionRequest(receiverId: number) {
    try {
      const response = await api.post('/connections/request', {
        receiverId
      });

      toast.success('Connection request sent!');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to send connection request: ' + error.message);
      return { data: null, error };
    }
  },

  async acceptConnection(connectionId: number) {
    try {
      const response = await api.put(`/connections/accept/${connectionId}`);

      toast.success('Connection accepted!');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to accept connection: ' + error.message);
      return { data: null, error };
    }
  },

  async rejectConnection(connectionId: number) {
    try {
      const response = await api.put(`/connections/reject/${connectionId}`);

      toast.success('Connection rejected!');
      return { data: response.data.data, error: null };
    } catch (error: any) {
      toast.error('Failed to reject connection: ' + error.message);
      return { data: null, error };
    }
  },

  async getConnectionStatus(targetUserId: number) {
    try {
      const response = await api.get(`/connections/status/${targetUserId}`);
      return { data: response.data.data.status, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  async deleteConnection(connectionId: number) {
    try {
      await api.delete(`/connections/${connectionId}`);

      toast.success('Connection deleted!');
      return { data: true, error: null };
    } catch (error: any) {
      toast.error('Failed to delete connection: ' + error.message);
      return { data: null, error };
    }
  }
};