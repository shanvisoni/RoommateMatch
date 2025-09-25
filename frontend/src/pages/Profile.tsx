import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileService, type Profile as ProfileType } from '../services/profile';
import { 
  User, 
  MapPin, 
  Calendar, 
  Edit3, 
  Camera, 
  Briefcase, 
  DollarSign, 
  Home, 
  Music, 
  ChefHat, 
  Star, 
  Heart, 
  Users, 
  Save,
  X,
  Coffee,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    location: '',
    profilePhotoUrl: '',
    profilePhoto: null as File | null,
    gender: '',
    profession: '',
    budget: '',
    moveInDate: '',
    smoking: '',
    pets: '',
    socialLevel: '',
    drinking: '',
    cooking: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await profileService.getProfile();
      if (error) {
        if (error.message === 'Profile not found') {
          console.log('No profile found - user needs to create one');
          setProfile(null);
        } else {
          console.error('Failed to load profile:', error);
        }
        return;
      }
      
      if (data) {
        console.log('📸 Profile data received:', data);
        console.log('📸 Profile photo URL:', data.profilePhotoUrl);
        setProfile(data);
        const formDataToSet = {
          name: data.name,
          age: data.age.toString(),
          bio: data.bio,
          location: data.location,
          profilePhotoUrl: data.profilePhotoUrl || '',
          profilePhoto: null,
          gender: data.gender || '',
          profession: data.profession || '',
          budget: data.budget ? data.budget.toString() : '',
          moveInDate: data.moveInDate ? new Date(data.moveInDate).toISOString().split('T')[0] : '',
          smoking: data.smoking ? 'yes' : 'no',
          pets: data.pets ? 'yes' : 'no',
          socialLevel: data.socialLevel || '',
          drinking: data.drinking || '',
          cooking: data.cooking || ''
        };
        console.log('📝 Form data being set:', formDataToSet);
        console.log('📝 Profile photo URL in form data:', formDataToSet.profilePhotoUrl);
        setFormData(formDataToSet);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const profileData = {
        name: formData.name,
        age: parseInt(formData.age),
        bio: formData.bio,
        location: formData.location,
        profilePhotoUrl: formData.profilePhotoUrl,
        gender: formData.gender || undefined,
        profession: formData.profession || undefined,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        moveInDate: formData.moveInDate || undefined,
        smoking: formData.smoking === 'yes',
        pets: formData.pets === 'yes',
        socialLevel: formData.socialLevel || undefined,
        drinking: formData.drinking || undefined,
        cooking: formData.cooking || undefined
      };

      if (profile) {
        // Update existing profile
        const { data, error } = await profileService.updateProfile(profileData);
        
        if (!error && data) {
          setProfile(data);
          setEditing(false);
          toast.success('Profile updated successfully!');
        } else {
          toast.error('Failed to update profile');
        }
      } else {
        // Create new profile
        const { data, error } = await profileService.createProfile(profileData);
        
        if (!error && data) {
          setProfile(data);
          setEditing(false);
          toast.success('Profile created successfully!');
        } else {
          toast.error('Failed to create profile');
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving your profile');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        profilePhoto: file,
        profilePhotoUrl: previewUrl 
      }));

      // Upload the file to the server
      try {
        const { data: uploadedUrl, error } = await profileService.uploadProfilePhoto(file);
        if (uploadedUrl && !error) {
          setFormData(prev => ({ 
            ...prev, 
            profilePhotoUrl: uploadedUrl 
          }));
          // Clean up the blob URL
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast.error('Failed to upload photo');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Profile Found
          </h2>
          <p className="text-gray-600 mb-8">
            You need to create a profile first to view and edit it.
          </p>
          <Link
            to="/create-profile"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-blue-100">Manage your profile information and preferences</p>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Edit3 className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {editing ? (
          /* Edit Form */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              {/* Profile Photo Section */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  {formData.profilePhotoUrl && !formData.profilePhotoUrl.startsWith('blob:') ? (
                    <img
                      src={formData.profilePhotoUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-blue-100 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto flex items-center justify-center border-4 border-blue-100 shadow-lg">
                      <User className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">Click the camera icon to upload from computer, or paste an image URL below</p>
                
                {/* Image URL Input */}
                <div className="mt-4 max-w-md mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or paste image URL</label>
                  <input
                    type="url"
                    value={formData.profilePhotoUrl}
                    onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/your-photo.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Imgur</a> or <a href="https://photos.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Photos</a> and paste the link here
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="18"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select pronouns</option>
                      <option value="he/him">He/Him</option>
                      <option value="she/her">She/Her</option>
                      <option value="they/them">They/Them</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Student, Engineer, Artist"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 800"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Tell us about yourself, your lifestyle, and what you're looking for in a roommate..."
                    required
                  />
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Lifestyle & Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Social Level</label>
                    <select
                      value={formData.socialLevel}
                      onChange={(e) => setFormData({ ...formData, socialLevel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select level</option>
                      <option value="love-to-host">Love to Host</option>
                      <option value="very-social">Very Social</option>
                      <option value="social">Social</option>
                      <option value="moderate">Moderate</option>
                      <option value="homebody">Homebody</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pets</label>
                    <select
                      value={formData.pets}
                      onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select option</option>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
                    <select
                      value={formData.smoking}
                      onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select option</option>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Drinking</label>
                    <select
                      value={formData.drinking}
                      onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select option</option>
                      <option value="no">Non-drinker</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="socially">Socially</option>
                      <option value="regularly">Regularly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cooking</label>
                    <select
                      value={formData.cooking}
                      onChange={(e) => setFormData({ ...formData, cooking: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {profile ? 'Update Profile' : 'Create Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex items-center px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Profile Display */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-center text-white">
                  {profile?.profilePhotoUrl && !profile.profilePhotoUrl.startsWith('blob:') ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="h-16 w-16 text-white" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mb-2">{profile?.name || 'Not provided'}</h2>
                  <p className="text-blue-100">{profile?.age ? `${profile.age} years old` : 'Age not provided'}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-5 w-5 mr-3 text-blue-500" />
                      <span className="font-medium">{profile?.location || 'Location not provided'}</span>
                    </div>
                    {profile?.profession && (
                      <div className="flex items-center text-gray-700">
                        <Briefcase className="h-5 w-5 mr-3 text-green-500" />
                        <span className="font-medium">{profile.profession}</span>
                      </div>
                    )}
                    {profile?.budget && (
                      <div className="flex items-center text-gray-700">
                        <DollarSign className="h-5 w-5 mr-3 text-yellow-500" />
                        <span className="font-medium">${profile.budget.toLocaleString()}/month</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-5 w-5 mr-3 text-purple-500" />
                      <span className="font-medium">
                        Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About Me</h3>
                <p className="text-gray-700 leading-relaxed">{profile?.bio || 'No bio provided'}</p>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-gray-900 font-medium">{profile?.name || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Age</p>
                      <p className="text-gray-900 font-medium">{profile?.age ? `${profile.age} years old` : 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <UserCheck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pronouns</p>
                      <p className="text-gray-900 font-medium">{profile?.gender || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                      <Briefcase className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Profession</p>
                      <p className="text-gray-900 font-medium">{profile?.profession || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Lifestyle & Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile?.cleanliness && (
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                        <Star className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cleanliness</p>
                        <p className="text-gray-900 font-medium">{profile.cleanliness.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}

                  {profile?.socialLevel && (
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Social Level</p>
                        <p className="text-gray-900 font-medium">{profile.socialLevel.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                      <Heart className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Smoking</p>
                      <p className="text-gray-900 font-medium">{profile?.smoking ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <Home className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pets</p>
                      <p className="text-gray-900 font-medium">{profile?.pets ? 'Yes' : 'No'}</p>
                    </div>
                  </div>


                  {profile?.drinking && (
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                        <Coffee className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Drinking</p>
                        <p className="text-gray-900 font-medium">
                          {profile.drinking === 'no' ? 'Non-drinker' : 
                           profile.drinking === 'occasionally' ? 'Occasionally' :
                           profile.drinking === 'socially' ? 'Socially' :
                           profile.drinking === 'regularly' ? 'Regularly' : profile.drinking}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile?.cooking && (
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                        <ChefHat className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cooking</p>
                        <p className="text-gray-900 font-medium">
                          {profile.cooking === 'yes' ? 'Yes' : 
                           profile.cooking === 'no' ? 'No' : 
                           profile.cooking}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile?.guests && (
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Guests</p>
                        <p className="text-gray-900 font-medium">{profile.guests}</p>
                      </div>
                    </div>
                  )}

                  {profile?.music && (
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mr-4">
                        <Music className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Music</p>
                        <p className="text-gray-900 font-medium">{profile.music}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
