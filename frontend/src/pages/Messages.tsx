import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { messagingService } from '../services/messaging';
import type { ChatRoom, Message } from '../services/messaging';
import { connectionsService } from '../services/connections';
import { authService } from '../services/auth';
import { MessageCircle, Send, User, Lock, UserCheck, Clock } from 'lucide-react';

const Messages: React.FC = () => {
  console.log('🔄 Messages component loaded - version 2.0');
  const [searchParams] = useSearchParams();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');
  const [canMessage, setCanMessage] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allChatUsers, setAllChatUsers] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Initialize the component
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Starting Messages initialization...');
        setError(null);
        
        // Load current user
        const { user } = await authService.getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
          console.log('✅ Current user loaded:', user.id);
          
          // Load all people you can chat with (after current user is set)
          await loadAllChatUsers();
        }
        
        // Load chat rooms
        const { data: chatData, error: chatError } = await messagingService.getChatRooms();
        if (chatError) {
          console.error('❌ Chat rooms error:', chatError);
          setChatRooms([]); // Ensure it's always an array
        } else {
          const rooms = Array.isArray(chatData) ? chatData : [];
          setChatRooms(rooms);
          console.log('✅ Chat rooms loaded:', rooms.length);
        }
        
        // Test backend connectivity
        await testBackendConnection();
        
        setLoading(false);
        console.log('✅ Messages initialization complete');
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError('Failed to load messages');
        setLoading(false);
      }
    };
    
    init();
  }, []);

  // Reload chat users when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      loadAllChatUsers();
    }
  }, [currentUserId]);

  // WebSocket-based real-time messaging
  useEffect(() => {
    if (!selectedChat || !currentUserId) return;

    console.log('🔌 Setting up real-time messaging for user:', selectedChat.user2Id);
    
    // Subscribe to real-time messages for this conversation
    const setupSubscription = async () => {
      const unsubscribe = await messagingService.subscribeToMessages(selectedChat.user2Id, (newMessage) => {
        console.log('📨 New message received:', newMessage);
        
        // Add the new message to the current messages
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
        });
      });
      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    setupSubscription().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      console.log('🔌 Cleaning up real-time messaging subscription');
      if (unsubscribe) unsubscribe();
    };
  }, [selectedChat, currentUserId]);

  const loadAllChatUsers = async () => {
    try {
      console.log('👥 Loading all chat users...');
      
      if (!currentUserId) {
        console.log('⚠️ Current user ID not available yet');
        return;
      }
      
      // Get accepted connections
      const { data: sentConnections } = await connectionsService.getSentConnections();
      const { data: receivedConnections } = await connectionsService.getReceivedConnections();
      
      console.log('📊 Sent connections:', sentConnections?.length || 0);
      console.log('📊 Received connections:', receivedConnections?.length || 0);
      
      const acceptedConnections = [
        ...(sentConnections || []).filter((c: any) => c.status === 'accepted'),
        ...(receivedConnections || []).filter((c: any) => c.status === 'accepted')
      ];
      
      console.log('✅ Accepted connections:', acceptedConnections.length);
      
      // Extract unique users from accepted connections
      const users = acceptedConnections.map((conn: any) => {
        const user = conn.requesterId === currentUserId ? conn.receiver : conn.requester;
        return {
          id: user.id,
          name: user.profile?.name || 'Unknown User',
          email: user.email,
          profilePhotoUrl: user.profile?.profilePhotoUrl,
          location: user.profile?.location,
          isFromConnection: true
        };
      });
      
      // Remove duplicates
      const uniqueUsers = users.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      setAllChatUsers(uniqueUsers);
      console.log('✅ All chat users loaded:', uniqueUsers.length);
    } catch (error) {
      console.error('❌ Error loading chat users:', error);
      setAllChatUsers([]);
    }
  };

  const testBackendConnection = async () => {
    try {
      console.log('🔌 Testing backend connection...');
      const response = await fetch(`${import.meta.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Backend is running and accessible');
      } else {
        console.log('⚠️ Backend responded with status:', response.status);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      console.log('💡 Make sure your backend server is running on port 5000');
    }
  };

  // Handle URL parameter for direct user messaging
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && chatRooms.length > 0) {
      const targetChat = chatRooms.find(chat => 
        chat.user1Id === parseInt(userId) || chat.user2Id === parseInt(userId)
      );
      if (targetChat) {
        setSelectedChat(targetChat);
        console.log('✅ Chat selected from URL:', targetChat);
      }
    } else if (userId && chatRooms.length === 0 && !loading) {
      // Create temporary chat for new conversation
      const tempChat: ChatRoom = {
        id: -1,
        user1Id: currentUserId || 1,
        user2Id: parseInt(userId),
        otherUser: {
          id: parseInt(userId),
          name: 'User',
          profilePhotoUrl: null
        }
      };
      setSelectedChat(tempChat);
      console.log('✅ Temporary chat created:', tempChat);
    }
  }, [searchParams, chatRooms, loading, currentUserId]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      console.log('📨 Loading messages for chat:', selectedChat.id);
      loadMessages(selectedChat.user2Id);
      checkConnectionStatus(selectedChat.user2Id);
    }
  }, [selectedChat, allChatUsers]);

  const checkConnectionStatus = async (userId: number) => {
    try {
      console.log('🔍 Checking connection status for user:', userId);
      
      // If user appears in allChatUsers (left sidebar), they should be messageable
      // This ensures consistency with the sidebar population logic
      const isInChatUsers = allChatUsers.some(user => user.id === userId);
      const hasUserIdParam = searchParams.get('userId');
      const isFromUrl = hasUserIdParam && parseInt(hasUserIdParam) === userId;

      if (isInChatUsers || isFromUrl) {
        console.log('✅ User found in chat users or from URL, allowing messaging');
        setCanMessage(true);
        setConnectionStatus('accepted');
      } else {
        // Try to get connection status from API
        const { data, error } = await connectionsService.getConnectionStatus(userId);
        if (error) {
          console.error('❌ Connection status error:', error);
          setConnectionStatus('unknown');
          setCanMessage(false);
          return;
        }

        const status = data || 'unknown';
        setConnectionStatus(status);
        setCanMessage(status === 'accepted');
      }

      console.log('✅ Connection status:', connectionStatus, 'Can message:', canMessage);
    } catch (error) {
      console.error('❌ Connection status check failed:', error);
      setConnectionStatus('unknown');
      setCanMessage(false);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      console.log('📨 Loading messages for user:', userId);
      const { data, error } = await messagingService.getMessages(userId);
      if (error) {
        console.error('❌ Load messages error:', error);
        setMessages([]);
        return;
      }
      
      // Ensure data is an array
      console.log('🔍 Raw messages data:', data, 'Type:', typeof data);
      let messagesArray = [];
      if (Array.isArray(data)) {
        messagesArray = data;
        console.log('✅ Data is array, length:', data.length);
      } else if (data && Array.isArray(data.data)) {
        messagesArray = data.data;
        console.log('✅ Data.data is array, length:', data.data.length);
      } else if (data && Array.isArray(data.messages)) {
        messagesArray = data.messages;
        console.log('✅ Data.messages is array, length:', data.messages.length);
      } else {
        console.log('⚠️ Data is not an array, setting empty array');
      }
      
      setMessages(messagesArray);
      console.log('✅ Messages loaded:', messagesArray.length);
    } catch (error) {
      console.error('❌ Load messages failed:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSendingMessage(true);

    try {
      console.log('📤 Sending message:', messageContent);
      console.log('📤 To user ID:', selectedChat.user2Id);
      console.log('📤 Current user ID:', currentUserId);

      // Optimistically add the message to the UI immediately
      const tempMessage = {
        id: Date.now(), // Temporary ID
        senderId: currentUserId!,
        receiverId: selectedChat.user2Id,
        content: messageContent,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);

      const { data, error } = await messagingService.sendMessage(
        selectedChat.user2Id,
        messageContent
      );

      console.log('📤 Send response:', { data, error });

      if (!error && data?.success) {
        // WebSocket will handle real-time updates, no need to reload
        console.log('✅ Message sent successfully');
      } else {
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setNewMessage(messageContent); // Restore the message content
        console.error('❌ Send message error:', error);
      }
    } catch (error) {
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
      setNewMessage(messageContent); // Restore the message content
      console.error('❌ Send message failed:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Empty state
  const hasUserIdParam = searchParams.get('userId');
  if ((!allChatUsers || allChatUsers.length === 0) && !hasUserIdParam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No connections yet
          </h2>
          <p className="text-gray-600 mb-8">
            Start connecting with people to begin messaging!
          </p>
          <Link to="/discover" className="btn-primary">
            Start Discovering
          </Link>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <div className="card h-full overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                  <Link to="/discover" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    New Chat
                  </Link>
                </div>
              </div>
              <div className="space-y-2 overflow-y-auto p-4">
                {(!allChatUsers || allChatUsers.length === 0) ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">No connections yet</p>
                    <p className="text-gray-400 text-sm">
                      Start connecting with people to begin messaging!
                    </p>
                  </div>
                ) : (
                  (allChatUsers || []).map((user) => {
                    // Find existing chat for this user
                    const existingChat = (chatRooms || []).find(chat => 
                      chat.user1Id === user.id || chat.user2Id === user.id
                    );
                    
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          if (existingChat) {
                            setSelectedChat(existingChat);
                          } else {
                            // Create temporary chat for new conversation
                            const tempChat: ChatRoom = {
                              id: -1,
                              user1Id: currentUserId || 1,
                              user2Id: user.id,
                              otherUser: user
                            };
                            setSelectedChat(tempChat);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 border ${
                          selectedChat?.user2Id === user.id
                            ? 'bg-primary-50 border-primary-200 shadow-sm'
                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          {user.profilePhotoUrl ? (
                            <img
                              src={user.profilePhotoUrl}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mr-3 flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {user.name}
                              </p>
                              {existingChat?.lastMessage && (
                                <span className="text-xs text-gray-400">
                                  {new Date(existingChat.lastMessage.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {existingChat?.lastMessage ? (
                              <p className="text-sm text-gray-600 truncate">
                                {existingChat.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">
                                Start a conversation
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <div className="card h-full flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center p-4 border-b border-gray-200">
                  {selectedChat.otherUser?.profilePhotoUrl ? (
                    <img
                      src={selectedChat.otherUser.profilePhotoUrl}
                      alt={selectedChat.otherUser.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedChat.otherUser?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.otherUser?.location || 'Unknown Location'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {connectionStatus === 'accepted' ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : connectionStatus === 'pending' ? (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    ) : connectionStatus === 'rejected' ? (
                      <div className="flex items-center space-x-1 text-red-600">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm font-medium">Rejected</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">No Connection</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium mb-2">No messages yet</p>
                      <p className="text-gray-400 text-sm">
                        Start the conversation by sending your first message!
                      </p>
                    </div>
                  ) : (
                    Array.isArray(messages) ? messages.map((message) => {
                      const isOwnMessage = message.senderId === currentUserId;
                      const isTemporaryMessage = message.id > 1000000000000; // Temporary messages have timestamp IDs
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? isTemporaryMessage 
                                  ? 'bg-primary-400 text-white opacity-75'
                                  : 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`text-xs mt-1 flex items-center ${
                              isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                              {isTemporaryMessage && (
                                <span className="ml-2 text-xs">Sending...</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium mb-2">Loading messages...</p>
                      </div>
                    )
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  {canMessage || connectionStatus === 'accepted' ? (
                    <form onSubmit={handleSendMessage}>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={sendingMessage ? "Sending message..." : "Type a message..."}
                          disabled={sendingMessage}
                          className="flex-1 input-field"
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newMessage.trim()}
                          className="btn-primary flex items-center disabled:opacity-50"
                        >
                          {sendingMessage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-gray-600">
                        {connectionStatus === 'pending' ? (
                          <>
                            <Clock className="h-5 w-5" />
                            <span>Connection pending - messaging not available yet</span>
                          </>
                        ) : connectionStatus === 'rejected' ? (
                          <>
                            <Lock className="h-5 w-5" />
                            <span>Connection rejected - messaging not available</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-5 w-5" />
                            <span>Connection required to message this user</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Start a Conversation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Select a conversation from the left to start chatting, or discover new people to connect with.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Link to="/discover" className="btn-primary w-full flex items-center justify-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Discover People
                    </Link>
                    
                    <Link to="/dashboard" className="btn-secondary w-full flex items-center justify-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      View Connections
                    </Link>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      💡 <strong>Tip:</strong> Only accepted connections can message each other. 
                      Start by connecting with people you'd like to chat with!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('❌ Messages component error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">Something went wrong. Please reload the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default Messages;