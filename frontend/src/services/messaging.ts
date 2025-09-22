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

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessage?: Message;
  otherUser: any;
}

export const messagingService = {
  async sendMessage(receiverId: number, content: string) {
    try {
      const response = await api.post('/messaging/send', {
        receiverId,
        content
      });
      
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
      return { data: null, error };
    }
  },

  async getMessages(userId: number) {
    try {
      const response = await api.get(`/messaging/messages/${userId}`);
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load messages: ' + error.message);
      return { data: null, error };
    }
  },

  async getChatRooms() {
    try {
      const response = await api.get('/messaging/chat-rooms');
      return { data: response.data, error: null };
    } catch (error: any) {
      toast.error('Failed to load chat rooms: ' + error.message);
      return { data: null, error };
    }
  },

  async subscribeToMessages(userId: number, callback: (message: Message) => void) {
    // TODO: Implement Socket.io real-time messaging
    console.log('Real-time messaging not implemented yet');
    return null;
  }
};
