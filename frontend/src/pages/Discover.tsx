import React, { useState, useEffect } from 'react';
import { profileService } from '../services/profile';
import type { Profile } from '../services/profile';
import { matchingService } from '../services/matching';
import { User, MapPin, Heart, X } from 'lucide-react';

const Discover: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const loadPotentialMatches = async () => {
    try {
      const { data, error } = await matchingService.getPotentialMatches();
      if (error) {
        console.error('Failed to load potential matches:', error);
        return;
      }
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading potential matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId: string) => {
    const { error } = await matchingService.likeUser(userId);
    if (!error) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePass = async (userId: string) => {
    const { error } = await matchingService.passUser(userId);
    if (!error) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No more users to discover!
            </h2>
            <p className="text-gray-600 mb-8">
              You've seen all potential roommates. Check back later for new users!
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                loadPotentialMatches();
              }}
              className="btn-primary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Roommates
          </h1>
          <p className="text-gray-600">
            Swipe right to like, left to pass
          </p>
        </div>

        <div className="card">
          <div className="text-center">
            {/* Profile Photo */}
            {currentUser.profilePhotoUrl ? (
              <img
                src={currentUser.profilePhotoUrl}
                alt={currentUser.name}
                className="w-48 h-48 rounded-full object-cover mx-auto mb-6"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <User className="h-24 w-24 text-gray-600" />
              </div>
            )}

            {/* User Info */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentUser.name}
            </h2>
            <p className="text-gray-600 mb-4">
              {currentUser.age} years old
            </p>
            
            <div className="flex items-center justify-center mb-6">
              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">{currentUser.location}</span>
            </div>

            {/* Bio */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700 text-left">
                {currentUser.bio}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => handlePass(currentUser.user_id)}
                className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => handleLike(currentUser.user_id)}
                className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200"
              >
                <Heart className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {currentIndex + 1} of {users.length} users
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / users.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;
