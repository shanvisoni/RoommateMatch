import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profile';
import toast from 'react-hot-toast';
import { 
  User, 
  Home, 
  Heart, 
  Camera, 
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CreateProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    age: '',
    pronouns: '',
    bio: '',
    location: '',
    profilePhoto: null as File | null,
    profilePhotoUrl: '',
    
    // Living Preferences
    budgetMin: '',
    budgetMax: '',
    housingType: '',
    
    // Lifestyle
    occupation: '',
    socialness: '',
    smoking: '',
    drinking: '',
    pets: '',
    cooking: '',
    
    // Personality & Interests
    interests: [] as string[],
    perfectWeekend: '',
    decompressMethod: '',
    lookingForInRoommate: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🚀 Starting profile creation...');
      const profileData = {
        name: formData.name,
        age: parseInt(formData.age),
        bio: formData.bio,
        location: formData.location,
        gender: formData.pronouns,
        profession: formData.occupation,
        budget: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
        smoking: formData.smoking === 'yes',
        drinking: formData.drinking,
        pets: formData.pets === 'yes',
        socialLevel: formData.socialness || 'moderate',
        cooking: formData.cooking,
        profilePhotoUrl: formData.profilePhotoUrl
      };

      console.log('📝 Profile data to send:', profileData);
      console.log('📸 Profile photo URL being sent:', profileData.profilePhotoUrl);
      
      // Validate required fields before sending
      if (!profileData.name || !profileData.bio || !profileData.location || !profileData.age) {
        throw new Error('Please fill in all required fields');
      }
      
      if (profileData.bio.length < 5) {
        throw new Error('Bio must be at least 5 characters long');
      }
      
      const result = await profileService.createProfile(profileData);
      console.log('✅ Profile creation result:', result);
      
      // Debug: Check if profile was actually created
      if (result.data) {
        console.log('🎯 Profile created successfully with ID:', result.data.id);
      } else {
        console.error('❌ Profile creation failed - no data returned');
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast.success('Profile created successfully!');
      console.log('🎉 Redirecting to dashboard...');
      
      // Trigger auth state refresh to update navbar
      if ((window as any).refreshAuthState) {
        (window as any).refreshAuthState();
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Profile creation failed:', error);
      toast.error('Failed to create profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      // Check if bio is long enough before submitting
      if (formData.bio.length < 5) {
        toast.error('Bio must be at least 5 characters long');
        return;
      }
      // On step 3, create the profile instead of going to step 4
      handleSubmit(new Event('submit') as any);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const steps = [
    { number: 1, title: 'Personal', icon: User, color: 'blue' },
    { number: 2, title: 'Living Preferences', icon: Home, color: 'green' },
    { number: 3, title: 'Lifestyle', icon: Heart, color: 'purple' }
  ];

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 mt-2">Let's start with the basics about you</p>
      </div>

      {/* Profile Photo */}
      <div className="text-center">
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
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Or paste image URL</label>
          <input
            type="url"
            name="profilePhotoUrl"
            value={formData.profilePhotoUrl}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/your-photo.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Imgur</a> or <a href="https://photos.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Photos</a> and paste the link here
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your age"
            min="18"
            max="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns</label>
          <select
            name="pronouns"
            value={formData.pronouns}
            onChange={handleInputChange}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Software Engineer, Student"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., New York, NY or Brooklyn, NY"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio * 
          <span className="text-sm text-gray-500 ml-2">
            ({formData.bio.length}/500 characters, minimum 5)
          </span>
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows={4}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formData.bio.length > 0 && formData.bio.length < 5 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
          placeholder="Tell us about yourself, your interests, and what you're looking for in a roommate..."
          required
        />
        {formData.bio.length > 0 && formData.bio.length < 5 && (
          <p className="text-red-500 text-sm mt-1">
            Bio must be at least 5 characters long
          </p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Home className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Living Preferences</h2>
        <p className="text-gray-600 mt-2">Tell us about your housing preferences</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Housing Type</label>
          <select
            name="housingType"
            value={formData.housingType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="no-preference">No Preference</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (Min)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="500"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (Max)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="2000"
                min="0"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Lifestyle & Preferences</h2>
        <p className="text-gray-600 mt-2">Tell us about your lifestyle preferences</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Level</label>
            <select
              name="socialness"
              value={formData.socialness}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              name="pets"
              value={formData.pets}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select option</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cooking</label>
            <select
              name="cooking"
              value={formData.cooking}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
            <select
              name="smoking"
              value={formData.smoking}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select option</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drinking</label>
            <select
              name="drinking"
              value={formData.drinking}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select option</option>
              <option value="no">Non-drinker</option>
              <option value="occasionally">Occasionally</option>
              <option value="socially">Socially</option>
              <option value="regularly">Regularly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Profile</h1>
          <p className="text-gray-600">Help us find your perfect roommate match</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepInfo, index) => {
              const Icon = stepInfo.icon;
              const isActive = step === stepInfo.number;
              const isCompleted = step > stepInfo.number;
              
              return (
                <div key={stepInfo.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    isActive 
                      ? `bg-${stepInfo.color}-600 border-${stepInfo.color}-600 text-white` 
                      : isCompleted
                      ? `bg-${stepInfo.color}-100 border-${stepInfo.color}-600 text-${stepInfo.color}-600`
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 rounded ${
                      isCompleted ? `bg-${stepInfo.color}-600` : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of {steps.length}: {steps[step - 1].title}
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading || formData.bio.length < 5}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProfileForm;