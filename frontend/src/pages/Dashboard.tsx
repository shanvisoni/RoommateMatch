import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile';
import type { Profile } from '../services/profile';
import { matchingService } from '../services/matching';
import { savedProfilesService } from '../services/savedProfiles';
import { connectionsService } from '../services/connections';
import type { Connection } from '../services/connections';
import { User, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, MessageSquare, ArrowUpRight, Trash2, Eye, X, MapPin, Calendar, Briefcase, DollarSign, Home, ChefHat, Users, Cigarette, Wine } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    matches: 0,
    messages: 0,
    savedProfiles: 0,
    connections: 0,
    pendingConnections: 0
  });
  const [loading, setLoading] = useState(true);
  const [sentConnections, setSentConnections] = useState<Connection[]>([]);
  const [receivedConnections, setReceivedConnections] = useState<Connection[]>([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [activeStatus, setActiveStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Load user profile
      console.log('🔍 Getting profile...');
      const { data: profileData, error: profileError } = await profileService.getProfile();
      console.log('📋 Profile response:', { profileData, profileError });
      
      if (profileError && profileError.message === 'Profile not found') {
        console.log('ℹ️ No profile found - user needs to create one');
        setProfile(null);
      } else if (profileData) {
        setProfile(profileData);
        console.log('✅ Profile loaded:', profileData.name);
      } else {
        setProfile(null);
      }

      // Load stats
      const { data: allProfiles } = await profileService.getAllProfiles();
      const { data: matches } = await matchingService.getMatches();
      const { data: savedProfiles } = await savedProfilesService.getSavedProfiles();
      
      // Load connections
      console.log('🔗 Loading connections...');
      const { data: sentConnectionsData, error: sentError } = await connectionsService.getSentConnections();
      const { data: receivedConnectionsData, error: receivedError } = await connectionsService.getReceivedConnections();
      
      if (sentError) {
        console.error('❌ Error loading sent connections:', sentError);
      } else {
        console.log('✅ Sent connections loaded:', sentConnectionsData?.length || 0);
      }
      
      if (receivedError) {
        console.error('❌ Error loading received connections:', receivedError);
      } else {
        console.log('✅ Received connections loaded:', receivedConnectionsData?.length || 0);
      }

      setSentConnections(sentConnectionsData || []);
      setReceivedConnections(receivedConnectionsData || []);

      const pendingConnections = receivedConnectionsData?.filter((c: Connection) => c.status === 'pending').length || 0;
      const acceptedConnections = sentConnectionsData?.filter((c: Connection) => c.status === 'accepted').length || 0;

      console.log('📊 Stats:', {
        pending: pendingConnections,
        accepted: acceptedConnections,
        totalSent: sentConnectionsData?.length || 0,
        totalReceived: receivedConnectionsData?.length || 0
      });

      setStats({
        totalUsers: allProfiles?.length || 0,
        matches: matches?.length || 0,
        messages: 0, // TODO: Implement message count
        savedProfiles: savedProfiles?.length || 0,
        connections: acceptedConnections,
        pendingConnections
      });
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConnection = async (connectionId: number) => {
    try {
      setConnectionLoading(true);
      const { error } = await connectionsService.acceptConnection(connectionId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Connection accepted!');
      
      // Update the local state immediately for better UX
      setReceivedConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: 'accepted' }
            : conn
        )
      );
      
      // Also update sent connections if this affects the other user's view
      setSentConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: 'accepted' }
            : conn
        )
      );
      
      // Reload data to ensure consistency
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to accept connection: ' + error.message);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleRejectConnection = async (connectionId: number) => {
    try {
      setConnectionLoading(true);
      const { error } = await connectionsService.rejectConnection(connectionId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Connection rejected!');
      
      // Update the local state immediately for better UX
      setReceivedConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: 'rejected' }
            : conn
        )
      );
      
      // Also update sent connections if this affects the other user's view
      setSentConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: 'rejected' }
            : conn
        )
      );
      
      // Reload data to ensure consistency
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to reject connection: ' + error.message);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleMessageUser = (userId: number) => {
    console.log('Navigating to messages with userId:', userId);
    // Navigate to messages page with the user ID as a parameter
    navigate(`/messages?userId=${userId}`);
  };

  const handleViewProfile = async (userId: number) => {
    try {
      console.log('🔍 Loading profile for userId:', userId);
      const { data: profileData, error } = await profileService.getProfile(userId);
      
      if (error) {
        console.error('❌ Failed to load profile:', error);
        toast.error('Failed to load profile');
        return;
      }
      
      if (profileData) {
        console.log('✅ Profile loaded:', profileData);
        setSelectedProfile(profileData);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleWithdrawConnection = async (connectionId: number) => {
    try {
      setConnectionLoading(true);
      const { error } = await connectionsService.rejectConnection(connectionId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Connection request withdrawn!');
      
      // Update the local state immediately for better UX
      setSentConnections(prev => 
        prev.filter(conn => conn.id !== connectionId)
      );
      
      // Reload data to ensure consistency
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to withdraw connection: ' + error.message);
    } finally {
      setConnectionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get filtered connections based on active tab and status
  const getFilteredConnections = () => {
    const connections = activeTab === 'sent' ? sentConnections : receivedConnections;
    let filtered = connections.filter(conn => conn.status === activeStatus);
    
    if (searchTerm) {
      filtered = filtered.filter(conn => {
        const user = activeTab === 'sent' ? conn.receiver : conn.requester;
        const name = user?.profile?.name || '';
        const email = user?.email || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               email.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  };

  // Get status counts for current tab
  const getStatusCounts = () => {
    const connections = activeTab === 'sent' ? sentConnections : receivedConnections;
    return {
      pending: connections.filter(c => c.status === 'pending').length,
      accepted: connections.filter(c => c.status === 'accepted').length,
      rejected: connections.filter(c => c.status === 'rejected').length,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to RoomieMatch!
          </h2>
          <p className="text-gray-600 mb-8">
            Let's create your profile to get started finding your perfect roommate.
          </p>
          <Link
            to="/create-profile"
            className="btn-primary"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening in your roommate search.
          </p>
        </div>


        {/* Connection Management */}
        <div className="card mb-8">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Requests
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Received Requests
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex space-x-1 mb-6">
            {(() => {
              const counts = getStatusCounts();
              return (
                <>
                  <button
                    onClick={() => setActiveStatus('pending')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Pending ({counts.pending})
                  </button>
                  <button
                    onClick={() => setActiveStatus('accepted')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeStatus === 'accepted'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Accepted ({counts.accepted})
                  </button>
                  <button
                    onClick={() => setActiveStatus('rejected')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeStatus === 'rejected'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Rejected ({counts.rejected})
                  </button>
                </>
              );
            })()}
          </div>

          {/* Connection Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'sent' ? 'Sent To' : 'Requested By'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Connected On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredConnections().length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <User className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-lg font-medium">No {activeStatus} requests found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {activeTab === 'sent' 
                            ? 'You haven\'t sent any connection requests yet.' 
                            : 'No one has sent you connection requests yet.'
                          }
                        </p>
                        {activeTab === 'sent' && (
                          <Link 
                            to="/discover" 
                            className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium"
                          >
                            Start connecting →
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFilteredConnections().map((connection) => {
                    const user = activeTab === 'sent' ? connection.receiver : connection.requester;
                    return (
                      <tr key={connection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user?.profile?.profilePhotoUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profile.profilePhotoUrl}
                                  alt={user.profile.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user?.profile?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(connection.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                            {getStatusIcon(connection.status)}
                            <span className="ml-1 capitalize">{connection.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* View Profile Button - Always available */}
                            <button
                              onClick={() => handleViewProfile(activeTab === 'sent' ? connection.receiverId : connection.requesterId)}
                              className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </button>
                            
                            {/* Status-specific actions */}
                            {activeTab === 'received' && connection.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleAcceptConnection(connection.id)}
                                  disabled={connectionLoading}
                                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectConnection(connection.id)}
                                  disabled={connectionLoading}
                                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </button>
                              </>
                            ) : activeTab === 'received' && connection.status === 'accepted' ? (
                              <button
                                onClick={() => handleMessageUser(connection.requesterId)}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </button>
                            ) : activeTab === 'sent' && connection.status === 'accepted' ? (
                              <button
                                onClick={() => handleMessageUser(connection.receiverId)}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </button>
                            ) : activeTab === 'sent' && connection.status === 'pending' ? (
                              <>
                                <button
                                  disabled
                                  className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-600 rounded-md cursor-not-allowed text-sm"
                                >
                                  <ArrowUpRight className="h-4 w-4 mr-1" />
                                  Follow Up
                                </button>
                                <button
                                  onClick={() => handleWithdrawConnection(connection.id)}
                                  disabled={connectionLoading}
                                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Withdraw
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Results Summary */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {getFilteredConnections().length} of {activeTab === 'sent' ? sentConnections.length : receivedConnections.length} {activeTab === 'sent' ? 'sent' : 'received'} requests
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity & Notifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.pendingConnections > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Connection Requests</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    You have {stats.pendingConnections} pending connection request{stats.pendingConnections !== 1 ? 's' : ''}.
                  </p>
                  <Link to="/messages" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                    View Requests →
                  </Link>
                </div>
              )}
              
              {stats.savedProfiles > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Saved Profiles</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    You have {stats.savedProfiles} saved profile{stats.savedProfiles !== 1 ? 's' : ''} to review.
                  </p>
                  <Link to="/saved" className="text-yellow-600 hover:text-yellow-500 text-sm font-medium">
                    View Saved →
                  </Link>
                </div>
              )}
              
              {stats.connections > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Active Connections</h4>
                  <p className="text-green-700 text-sm mb-3">
                    You have {stats.connections} active connection{stats.connections !== 1 ? 's' : ''}.
                  </p>
                  <Link to="/messages" className="text-green-600 hover:text-green-500 text-sm font-medium">
                    Start Chatting →
                  </Link>
                </div>
              )}
              
              {stats.matches > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">New Matches</h4>
                  <p className="text-red-700 text-sm mb-3">
                    You have {stats.matches} new match{stats.matches !== 1 ? 'es' : ''}!
                  </p>
                  <Link to="/messages" className="text-red-600 hover:text-red-500 text-sm font-medium">
                    View Matches →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile View Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {selectedProfile.profilePhotoUrl && !selectedProfile.profilePhotoUrl.startsWith('blob:') ? (
                    <img
                      src={selectedProfile.profilePhotoUrl}
                      alt={selectedProfile.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 border-4 border-white shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProfile.name}</h2>
                    <p className="text-blue-100">{selectedProfile.age} years old</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Age</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.age} years old</p>
                        </div>
                      </div>

                      {selectedProfile.gender && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Gender</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.gender}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <MapPin className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Location</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.location}</p>
                        </div>
                      </div>

                      {selectedProfile.profession && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                            <Briefcase className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Profession</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.profession}</p>
                          </div>
                        </div>
                      )}

                      {selectedProfile.budget && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Budget</p>
                            <p className="text-gray-900 font-medium">${selectedProfile.budget.toLocaleString()}/month</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProfile.bio}</p>
                  </div>
                </div>

                {/* Lifestyle & Preferences */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Lifestyle & Preferences</h3>
                    <div className="space-y-4">
                      {selectedProfile.socialLevel && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Social Level</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.socialLevel.replace('_', ' ')}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Home className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Pets</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.pets ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <Cigarette className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Smoking</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.smoking ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {selectedProfile.drinking && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <Wine className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Drinking</p>
                            <p className="text-gray-900 font-medium">
                              {selectedProfile.drinking === 'no' ? 'Non-drinker' : 
                               selectedProfile.drinking === 'occasionally' ? 'Occasionally' :
                               selectedProfile.drinking === 'socially' ? 'Socially' :
                               selectedProfile.drinking === 'regularly' ? 'Regularly' : selectedProfile.drinking}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedProfile.cooking && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                            <ChefHat className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Cooking</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.cooking}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
