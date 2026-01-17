import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profile';
import { savedProfilesService } from '../../services/savedProfiles';
import { connectionsService } from '../../services/connections';
import toast from 'react-hot-toast';
import {
  MapPin,
  User,
  Heart,
  Eye
} from 'lucide-react';
import ProfileViewModal from '../modals/ProfileViewModal';

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
  const navigate = useNavigate();
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
    socialLevel: '',
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

  // Refresh connection statuses when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && allProfiles.length > 0) {
        // Re-check connection statuses when user returns to the page
        allProfiles.forEach((profile: Profile) => {
          checkConnectionStatus(profile.userId);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [allProfiles]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await profileService.getAllProfiles();
      const profilesData = response.data || [];
      console.log('🔍 Discovery profiles received:', profilesData.length);
      console.log('📸 First few profile photo URLs:', profilesData.slice(0, 3).map((p: Profile) => ({ name: p.name, profilePhotoUrl: p.profilePhotoUrl })));
      setAllProfiles(profilesData);
      setProfiles(profilesData);

      // Check saved and connection statuses for each profile
      profilesData.forEach((profile: Profile) => {
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
    const profile = profiles.find((p: Profile) => p.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
      setShowProfileModal(true);
      // Check connection status when opening the modal to ensure it's up-to-date
      checkConnectionStatus(profile.userId);
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
      toast.success('Connection request sent!');
    } catch (error: any) {
      toast.error('Failed to send connection request: ' + error.message);
    }
  };

  const handleMessageUser = (userId: number) => {
    // Navigate to messages page with the user ID as a parameter
    navigate(`/messages?userId=${userId}`);
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
          <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
            {/* Left Section - Title */}
            <div className="flex-1 w-full text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">Discover Roommates</h1>
              <p className="text-blue-100">Find your perfect living companion</p>
            </div>

            {/* Center Section - Search Bar */}
            <div className="flex-1 w-full max-w-md md:mx-8">
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
            <div className="flex-1 w-full flex justify-center md:justify-end">
              <select
                value={filters.gender}
                onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full md:w-auto px-4 py-3 rounded-lg border border-white border-opacity-30 bg-white bg-opacity-20 backdrop-blur-sm text-white focus:border-opacity-50 focus:ring-2 focus:ring-white focus:ring-opacity-30 appearance-none cursor-pointer"
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
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${currentPage === i
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
        <ProfileViewModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={selectedProfile}
          connectionStatus={connectionStatuses.get(selectedProfile.userId)}
          onConnect={handleConnect}
          onMessage={handleMessageUser}
          onSave={handleSaveProfile}
          isSaved={savedProfiles.has(selectedProfile.id)}
          showSaveButton={true}
          showFeedbackButton={false}
        />
      )}
    </div>
  );
};

export default DiscoveryPage;