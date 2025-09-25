import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profile';
import { matchingService } from '../../services/matching';
import { savedProfilesService } from '../../services/savedProfiles';
import { connectionsService } from '../../services/connections';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Filter,
  User,
  Home,
  Music,
  ChefHat,
  Bookmark,
  BookmarkCheck,
  UserPlus,
  MessageCircle,
  Star,
  Eye,
  Phone,
  Mail,
  X,
  CheckCircle,
  UserCheck,
  Globe,
  Clock,
  Coffee,
  Gamepad2,
  BookOpen,
  Dumbbell,
  Car,
  Plane,
  Heart,
  Users
} from 'lucide-react';

interface Profile {
  id: number;
  userId: number;
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
  workFromHome?: boolean;
  guests?: string;
  music?: string;
  cooking?: string;
}

const DiscoveryPage: React.FC = () => {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [savedProfiles, setSavedProfiles] = useState<Set<number>>(new Set());
  const [connectionStatuses, setConnectionStatuses] = useState<Map<number, string>>(new Map());
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profilesPerPage = 6;
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    budgetMin: '',
    budgetMax: '',
    profession: '',
    smoking: '',
    drinking: '',
    pets: '',
    cleanliness: '',
    socialLevel: '',
    workFromHome: '',
    guests: '',
    music: '',
    cooking: ''
  });

  // Auto-filter profiles when search or gender filter changes
  useEffect(() => {
    let filtered = allProfiles;

    // Apply gender filter
    if (filters.gender) {
      filtered = filtered.filter(profile => profile.gender === filters.gender);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm) ||
        profile.location.toLowerCase().includes(searchTerm) ||
        (profile.profession && profile.profession.toLowerCase().includes(searchTerm))
      );
    }

    setProfiles(filtered);
    setCurrentPage(0); // Reset to first page when filtering
  }, [filters.gender, filters.search, allProfiles]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await profileService.getAllProfiles();
      const profilesData = response.data || [];
      console.log('🔍 Discovery profiles received:', profilesData.length);
      console.log('📸 First few profile photo URLs:', profilesData.slice(0, 3).map(p => ({ name: p.name, profilePhotoUrl: p.profilePhotoUrl })));
      setAllProfiles(profilesData);
      setProfiles(profilesData);

      // Check saved and connection statuses for each profile
      profilesData.forEach(profile => {
        checkSavedStatus(profile.id);
        checkConnectionStatus(profile.userId);
      });
    } catch (error: any) {
      toast.error('Failed to load profiles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (profileId: number) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
      setShowProfileModal(true);
    }
  };

  const handleSaveProfile = async (profileId: number) => {
    try {
      const isSaved = savedProfiles.has(profileId);
      if (isSaved) {
        await savedProfilesService.unsaveProfile(profileId);
        setSavedProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
      } else {
        await savedProfilesService.saveProfile(profileId);
        setSavedProfiles(prev => new Set(prev).add(profileId));
      }
    } catch (error: any) {
      toast.error('Failed to save/unsave profile: ' + error.message);
    }
  };

  const handleConnect = async (userId: number) => {
    try {
      await connectionsService.sendConnectionRequest(userId);
      setConnectionStatuses(prev => new Map(prev).set(userId, 'pending'));
    } catch (error: any) {
      toast.error('Failed to send connection request: ' + error.message);
    }
  };

  const checkSavedStatus = async (profileId: number) => {
    try {
      const { data } = await savedProfilesService.checkIfSaved(profileId);
      if (data) {
        setSavedProfiles(prev => new Set(prev).add(profileId));
      }
    } catch (error) {
      // Silently fail for saved status check
    }
  };

  const checkConnectionStatus = async (userId: number) => {
    try {
      const { data } = await connectionsService.getConnectionStatus(userId);
      if (data) {
        setConnectionStatuses(prev => new Map(prev).set(userId, data));
      }
    } catch (error) {
      // Silently fail for connection status check
    }
  };

  const applyFilters = () => {
    let filtered = profiles;

    if (filters.location) {
      filtered = filtered.filter(p =>
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender);
    }

    if (filters.ageMin) {
      filtered = filtered.filter(p => p.age >= parseInt(filters.ageMin));
    }

    if (filters.ageMax) {
      filtered = filtered.filter(p => p.age <= parseInt(filters.ageMax));
    }

    if (filters.budgetMin) {
      filtered = filtered.filter(p => p.budget && p.budget >= parseInt(filters.budgetMin));
    }

    if (filters.budgetMax) {
      filtered = filtered.filter(p => p.budget && p.budget <= parseInt(filters.budgetMax));
    }

    if (filters.profession) {
      filtered = filtered.filter(p =>
        p.profession?.toLowerCase().includes(filters.profession.toLowerCase())
      );
    }

    if (filters.smoking) {
      filtered = filtered.filter(p => p.smoking === (filters.smoking === 'true'));
    }

    if (filters.drinking) {
      filtered = filtered.filter(p => p.drinking === filters.drinking);
    }

    if (filters.pets) {
      filtered = filtered.filter(p => p.pets === (filters.pets === 'true'));
    }

    if (filters.cleanliness) {
      filtered = filtered.filter(p => p.cleanliness === filters.cleanliness);
    }

    if (filters.socialLevel) {
      filtered = filtered.filter(p => p.socialLevel === filters.socialLevel);
    }

    if (filters.workFromHome) {
      filtered = filtered.filter(p => p.workFromHome === (filters.workFromHome === 'true'));
    }

    if (filters.guests) {
      filtered = filtered.filter(p => p.guests === filters.guests);
    }

    if (filters.music) {
      filtered = filtered.filter(p => p.music === filters.music);
    }

    if (filters.cooking) {
      filtered = filtered.filter(p => p.cooking === filters.cooking);
    }

    setProfiles(filtered);
    setCurrentPage(0);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      gender: '',
      ageMin: '',
      ageMax: '',
      budgetMin: '',
      budgetMax: '',
      profession: '',
      smoking: '',
      drinking: '',
      pets: '',
      cleanliness: '',
      socialLevel: '',
      workFromHome: '',
      guests: '',
      music: '',
      cooking: ''
    });
    loadProfiles();
    setCurrentPage(0);
    setShowFilters(false);
  };

  // Calculate pagination
  const totalPages = Math.ceil(profiles.length / profilesPerPage);
  const startIndex = currentPage * profilesPerPage;
  const endIndex = startIndex + profilesPerPage;
  const currentProfiles = profiles.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  // Don't return early for empty profiles - show the header and search bar

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            {/* Left Section - Title */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Discover Roommates</h1>
              <p className="text-blue-100">Find your perfect living companion</p>
            </div>
            
            {/* Center Section - Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name, profession, or location..."
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-white border-opacity-30 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70 focus:border-opacity-50 focus:ring-2 focus:ring-white focus:ring-opacity-30"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Right Section - Gender Filter */}
            <div className="flex-1 flex justify-end">
              <select
                value={filters.gender}
                onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                className="px-4 py-3 rounded-lg border border-white border-opacity-30 bg-white bg-opacity-20 backdrop-blur-sm text-white focus:border-opacity-50 focus:ring-2 focus:ring-white focus:ring-opacity-30"
              >
                <option value="" className="text-gray-800">Any Gender</option>
                <option value="he/him" className="text-gray-800">He/Him</option>
                <option value="she/her" className="text-gray-800">She/Her</option>
                <option value="they/them" className="text-gray-800">They/Them</option>
                <option value="other" className="text-gray-800">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>


      {/* Profiles Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No roommates found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.gender 
                  ? "Try adjusting your search or filters to find more roommates." 
                  : "No roommates available at the moment. Check back later!"}
              </p>
              {(filters.search || filters.gender) && (
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, search: '', gender: '' }));
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search & Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProfiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              {/* Profile Image */}
              <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                {profile.profilePhotoUrl && !profile.profilePhotoUrl.startsWith('blob:') ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-20 w-20 text-white opacity-80" />
                  </div>
                )}
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
          ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center space-x-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                    currentPage === i
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Next
            </button>
          </div>
        )}
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
                          <Heart className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Smoking</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.smoking ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {selectedProfile.drinking && (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <Coffee className="h-5 w-5 text-indigo-600" />
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

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-8">
                <button
                  onClick={() => handleSaveProfile(selectedProfile.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                    savedProfiles.has(selectedProfile.id)
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {savedProfiles.has(selectedProfile.id) ? (
                    <BookmarkCheck className="h-5 w-5 mr-2" />
                  ) : (
                    <Bookmark className="h-5 w-5 mr-2" />
                  )}
                  {savedProfiles.has(selectedProfile.id) ? 'Unsave' : 'Save Profile'}
                </button>

                {(() => {
                  const connectionStatus = connectionStatuses.get(selectedProfile.userId);
                  if (connectionStatus === 'pending') {
                    return (
                      <button
                        disabled
                        className="flex items-center px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Connection Pending
                      </button>
                    );
                  } else if (connectionStatus === 'accepted') {
                    return (
                      <button className="flex items-center px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Start Chatting
                      </button>
                    );
                  } else {
                    return (
                      <button
                        onClick={() => handleConnect(selectedProfile.userId)}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
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
      )}
    </div>
  );
};

export default DiscoveryPage;