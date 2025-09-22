import React, { useState, useEffect } from 'react';
import { messagingService, ChatRoom, Message } from '../services/messaging';
// Removed supabase import - using axios now
import { MessageCircle, Send, User } from 'lucide-react';

const Messages: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.user2_id);
      subscribeToMessages(selectedChat.user2_id);
    }
  }, [selectedChat]);

  const loadChatRooms = async () => {
    try {
      const { data, error } = await messagingService.getChatRooms();
      if (error) {
        console.error('Failed to load chat rooms:', error);
        return;
      }
      setChatRooms(data || []);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await messagingService.getMessages(userId);
      if (error) {
        console.error('Failed to load messages:', error);
        return;
      }
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (userId: string) => {
    return messagingService.subscribeToMessages(userId, (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { error } = await messagingService.sendMessage(
        selectedChat.user2_id,
        newMessage.trim()
      );
      
      if (!error) {
        setNewMessage('');
        // Reload messages to get the latest
        loadMessages(selectedChat.user2_id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No messages yet
          </h2>
          <p className="text-gray-600 mb-8">
            Start matching with potential roommates to begin conversations!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <div className="card h-full overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
              <div className="space-y-2 overflow-y-auto">
                {chatRooms.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                      selectedChat?.id === chat.id
                        ? 'bg-primary-100 border border-primary-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {chat.other_user?.profile_photo_url ? (
                        <img
                          src={chat.other_user.profile_photo_url}
                          alt={chat.other_user.name}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.other_user?.name || 'Unknown User'}
                        </p>
                        {chat.last_message && (
                          <p className="text-xs text-gray-500 truncate">
                            {chat.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <div className="card h-full flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center p-4 border-b border-gray-200">
                  {selectedChat.other_user?.profile_photo_url ? (
                    <img
                      src={selectedChat.other_user.profile_photo_url}
                      alt={selectedChat.other_user.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedChat.other_user?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.other_user?.location || 'Unknown Location'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === 1; // TODO: Get current user ID
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 input-field"
                    />
                    <button
                      type="submit"
                      className="btn-primary flex items-center"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
