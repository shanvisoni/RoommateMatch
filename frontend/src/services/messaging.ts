import axios from 'axios';
import { tokenStorage } from '../utils/supabase';
import { socketService } from './socket';
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

export interface Message {
  id: number | string;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isTemporary?: boolean;
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
      console.log('📤 Sending message to user:', receiverId);
      const response = await api.post('/messaging/send', {
        receiverId,
        content
      });
      console.log('📤 Send message API response:', response.data);
      
      // Send message via Socket.io for real-time delivery
      if (response.data && response.data.data) {
        const roomId = `chat_${receiverId}`;
        socketService.sendMessage(roomId, {
          id: response.data.data.id,
          senderId: response.data.data.senderId,
          receiverId: response.data.data.receiverId,
          content: response.data.data.content,
          createdAt: response.data.data.createdAt
        });
      }
      
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('❌ Send message failed:', error);
      if (error.response?.data?.message === 'Connection not accepted') {
        toast.error('You can only message users with accepted connections');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to send message: ' + error.message);
      }
      return { data: null, error };
    }
  },

  async getMessages(userId: number) {
    try {
      console.log('📨 Loading messages for user:', userId);
      const response = await api.get(`/messaging/messages/${userId}`);
      console.log('📨 Get messages API response:', response.data);
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('❌ Get messages failed:', error);
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
    try {
      console.log('🔌 Setting up WebSocket subscription for user:', userId);
      
      // Connect to socket if not already connected
      const socket = socketService.connect();
      
      // Wait a bit for connection to establish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Join the room for this conversation
      const roomId = `chat_${userId}`;
      socketService.joinRoom(roomId);
      
      // Listen for new messages
      socketService.onMessage((data) => {
        console.log('📨 WebSocket message received:', data);
        if (data.senderId === userId || data.receiverId === userId) {
          callback(data);
        }
      });
      
      return () => {
        console.log('🔌 Cleaning up WebSocket subscription for room:', roomId);
        socketService.leaveRoom(roomId);
      };
    } catch (error) {
      console.error('❌ Failed to subscribe to messages:', error);
      return null;
    }
  },

  async canMessageUser(userId: number) {
    try {
      const response = await api.get(`/connections/status/${userId}`);
      const connectionStatus = response.data.data.status;
      return { 
        canMessage: connectionStatus === 'accepted', 
        status: connectionStatus,
        error: null 
      };
    } catch (error: any) {
      return { 
        canMessage: false, 
        status: 'unknown',
        error 
      };
    }
  }
};
