import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { savedProfilesService } from '../services/savedProfiles';
import type { SavedProfile } from '../services/savedProfiles';
import { connectionsService } from '../services/connections';
import { feedbackService } from '../services/feedback';
import toast from 'react-hot-toast';
import { 
  Bookmark, 
  MapPin, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  UserPlus, 
  MessageCircle,
  Star,
  Trash2,
  Eye,
  User,
  X
} from 'lucide-react';

const SavedProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatuses, setConnectionStatuses] = useState<Map<number, string>>(new Map());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SavedProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 5,
    comment: '',
    cleanliness: 5,
    communication: 5,
    reliability: 5
  });

  useEffect(() => {
    loadSavedProfiles();
  }, []);

  const loadSavedProfiles = async () => {
    try {
      setLoading(true);
      const { data } = await savedProfilesService.getSavedProfiles();
      setSavedProfiles(data || []);
      
      // Check connection statuses
      if (data) {
        data.forEach((profile: SavedProfile) => {
          checkConnectionStatus(profile.userId);
        });
      }
    } catch (error: any) {
      toast.error('Failed to load saved profiles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async (userId: number) => {
    try {
      const { data } = await connectionsService.getConnectionStatus(userId);
      if (data) {
        setConnectionStatuses(prev => new Map(prev).set(userId, data));
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleConnect = async (userId: number) => {
    try {
      await connectionsService.sendConnectionRequest(userId);
      setConnectionStatuses(prev => new Map(prev).set(userId, 'pending'));
      toast.success('Connection request sent!');
    } catch (error: any) {
      toast.error('Failed to send connection request: ' + error.message);
    }
  };

  const handleMessageUser = (userId: number) => {
    // Navigate to messages page with the user ID as a parameter
    navigate(`/messages?userId=${userId}`);
  };

  const handleUnsave = async (profileId: number) => {
    try {
      await savedProfilesService.unsaveProfile(profileId);
      setSavedProfiles(prev => prev.filter(p => p.id !== profileId));
      toast.success('Profile unsaved!');
    } catch (error: any) {
      toast.error('Failed to unsave profile: ' + error.message);
    }
  };

  const handleViewProfile = (profileId: number) => {
    const profile = savedProfiles.find(p => p.profile?.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
      setShowProfileModal(true);
    }
  };

  const handleFeedback = (profile: SavedProfile) => {
    setSelectedProfile(profile);
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!selectedProfile?.userId) return;
    
    try {
      await feedbackService.createFeedback({
        toUserId: selectedProfile.userId,
        rating: feedback.rating,
        comment: feedback.comment,
        cleanliness: feedback.cleanliness,
        communication: feedback.communication,
        reliability: feedback.reliability
      });
      
      setShowFeedbackModal(false);
      setSelectedProfile(null);
      setFeedback({
        rating: 5,
        comment: '',
        cleanliness: 5,
        communication: 5,
        reliability: 5
      });
    } catch (error: any) {
      toast.error('Failed to submit feedback: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bookmark className="h-8 w-8 mr-3 text-primary-600" />
            Saved Profiles
          </h1>
          <p className="text-gray-600 mt-2">
            {savedProfiles.length} saved profile{savedProfiles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {savedProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved profiles</h3>
            <p className="text-gray-500">Start exploring and save profiles you're interested in!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedProfiles.map((savedProfile) => {
              const profile = savedProfile.profile;
              if (!profile) return null;
              
              return (
                <div key={savedProfile.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                  {/* Profile Image */}
                  <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                    {profile.profilePhotoUrl ? (
                      <img
                        src={profile.profilePhotoUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Eye className="h-20 w-20 text-white opacity-80" />
                      </div>
                    )}
                    
                    {/* Unsave Button */}
                    <button
                      onClick={() => handleUnsave(profile.id)}
                      className="absolute top-3 right-3 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full shadow-lg hover:bg-opacity-30 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Profile Info */}
                  <div className="p-6">
                    {/* Name and Age */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h3>
                      <p className="text-gray-600 font-medium">{profile.age} years old</p>
                    </div>

                    {/* Key Info */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-3 text-blue-500" />
                        <span className="font-medium">{profile.location}</span>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{profile.bio}</p>
                    </div>

                    {/* Action Button */}
                    <div>
                      <button
                        onClick={() => handleViewProfile(profile.id)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Leave Feedback</h3>
              <p className="text-gray-600 mb-4">Rate your experience with {selectedProfile.profile?.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                        className={`h-6 w-6 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className="h-full w-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cleanliness</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedback(prev => ({ ...prev, cleanliness: star }))}
                        className={`h-5 w-5 ${star <= (feedback.cleanliness || 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className="h-full w-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Communication</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedback(prev => ({ ...prev, communication: star }))}
                        className={`h-5 w-5 ${star <= (feedback.communication || 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className="h-full w-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reliability</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedback(prev => ({ ...prev, reliability: star }))}
                        className={`h-5 w-5 ${star <= (feedback.reliability || 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className="h-full w-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                  <textarea
                    value={feedback.comment}
                    onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Share your experience..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile View Modal */}
        {showProfileModal && selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedProfile.profile?.profilePhotoUrl ? (
                      <img
                        src={selectedProfile.profile.profilePhotoUrl}
                        alt={selectedProfile.profile.name}
                        className="w-16 h-16 rounded-full object-cover mr-4 border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 border-4 border-white shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">{selectedProfile.profile?.name}</h2>
                      <p className="text-blue-100">{selectedProfile.profile?.age} years old</p>
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
                            <p className="text-gray-900 font-medium">{selectedProfile.profile?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Age</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.profile?.age} years old</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <MapPin className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Location</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.profile?.location}</p>
                          </div>
                        </div>

                        {selectedProfile.profile?.profession && (
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                              <Briefcase className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Profession</p>
                              <p className="text-gray-900 font-medium">{selectedProfile.profile.profession}</p>
                            </div>
                          </div>
                        )}

                        {selectedProfile.profile?.budget && (
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <DollarSign className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Budget</p>
                              <p className="text-gray-900 font-medium">${selectedProfile.profile.budget.toLocaleString()}/month</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* About Section */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedProfile.profile?.bio}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Actions</h3>
                      <div className="space-y-4">
                        {(() => {
                          const connectionStatus = connectionStatuses.get(selectedProfile.userId);
                          if (connectionStatus === 'pending') {
                            return (
                              <button
                                disabled
                                className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                              >
                                <UserPlus className="h-5 w-5 mr-2" />
                                Connection Pending
                              </button>
                            );
                          } else if (connectionStatus === 'accepted') {
                            return (
                              <div className="space-y-3">
                                <button 
                                  onClick={() => handleMessageUser(selectedProfile.userId)}
                                  className="w-full flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                  <MessageCircle className="h-5 w-5 mr-2" />
                                  Start Chatting
                                </button>
                                <button
                                  onClick={() => handleFeedback(selectedProfile)}
                                  className="w-full flex items-center justify-center px-6 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                  <Star className="h-5 w-5 mr-2" />
                                  Leave Feedback
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <button
                                onClick={() => handleConnect(selectedProfile.userId)}
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <UserPlus className="h-5 w-5 mr-2" />
                                Connect
                              </button>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedProfiles;
