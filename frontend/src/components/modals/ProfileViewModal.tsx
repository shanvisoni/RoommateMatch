import React from 'react';
import {
    X,
    User,
    Calendar,
    MapPin,
    Briefcase,
    DollarSign,
    Users,
    Home,
    Cigarette,
    Wine,
    ChefHat,
    UserPlus,
    MessageCircle,
    Bookmark,
    BookmarkCheck,
    Star
} from 'lucide-react';

interface Profile {
    id: number;
    userId: number; // This might be the user_id of the profile owner
    user_id?: number; // Handling potential inconsistency in naming
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

interface ProfileViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile | null;
    connectionStatus?: string; // 'pending', 'accepted', 'rejected', or undefined
    onConnect?: (userId: number) => void;
    onMessage?: (userId: number) => void;
    onSave?: (profileId: number) => void;
    onFeedback?: (profile: any) => void; // Using any for now to avoid circular deps with SavedProfile
    isSaved?: boolean;
    showSaveButton?: boolean;
    showFeedbackButton?: boolean;
}

const ProfileViewModal: React.FC<ProfileViewModalProps> = ({
    isOpen,
    onClose,
    profile,
    connectionStatus,
    onConnect,
    onMessage,
    onSave,
    onFeedback,
    isSaved = false,
    showSaveButton = true,
    showFeedbackButton = false
}) => {
    if (!isOpen || !profile) return null;

    // Determine the correct user ID to use for actions
    const targetUserId = profile.user_id || profile.userId;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {profile.profilePhotoUrl && !profile.profilePhotoUrl.startsWith('blob:') ? (
                                <img
                                    src={profile.profilePhotoUrl}
                                    alt={profile.name}
                                    className="w-16 h-16 rounded-full object-cover mr-4 border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 border-4 border-white shadow-lg">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold">{profile.name}</h2>
                                <p className="text-blue-100">{profile.age} years old</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
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
                                            <p className="text-gray-900 font-medium">{profile.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <Calendar className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Age</p>
                                            <p className="text-gray-900 font-medium">{profile.age} years old</p>
                                        </div>
                                    </div>

                                    {profile.gender && (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                                                <User className="h-5 w-5 text-pink-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Gender</p>
                                                <p className="text-gray-900 font-medium">{profile.gender}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                            <MapPin className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Location</p>
                                            <p className="text-gray-900 font-medium">{profile.location}</p>
                                        </div>
                                    </div>

                                    {profile.profession && (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                                <Briefcase className="h-5 w-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Profession</p>
                                                <p className="text-gray-900 font-medium">{profile.profession}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile.budget && (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                <DollarSign className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Budget</p>
                                                <p className="text-gray-900 font-medium">${profile.budget.toLocaleString()}/month</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* About Section */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                            </div>
                        </div>

                        {/* Lifestyle & Preferences */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Lifestyle & Preferences</h3>
                                <div className="space-y-4">
                                    {profile.socialLevel && (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                                <Users className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Social Level</p>
                                                <p className="text-gray-900 font-medium">{profile.socialLevel.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                            <Home className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Pets</p>
                                            <p className="text-gray-900 font-medium">{profile.pets ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                            <Cigarette className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Smoking</p>
                                            <p className="text-gray-900 font-medium">{profile.smoking ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>

                                    {profile.drinking && (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                <Wine className="h-5 w-5 text-indigo-600" />
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

                                    {profile.cooking && (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                                <ChefHat className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Cooking</p>
                                                <p className="text-gray-900 font-medium">{profile.cooking}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-8">
                        {showSaveButton && onSave && (
                            <button
                                onClick={() => onSave(profile.id)}
                                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${isSaved
                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {isSaved ? (
                                    <BookmarkCheck className="h-5 w-5 mr-2" />
                                ) : (
                                    <Bookmark className="h-5 w-5 mr-2" />
                                )}
                                {isSaved ? 'Unsave' : 'Save Profile'}
                            </button>
                        )}

                        {(() => {
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
                                    <>
                                        <button
                                            onClick={() => onMessage && onMessage(targetUserId)}
                                            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <MessageCircle className="h-5 w-5 mr-2" />
                                            Start Chatting
                                        </button>
                                        {showFeedbackButton && onFeedback && (
                                            <button
                                                onClick={() => onFeedback(profile)}
                                                className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            >
                                                <Star className="h-5 w-5 mr-2" />
                                                Leave Feedback
                                            </button>
                                        )}
                                    </>
                                );
                            } else {
                                return (
                                    <button
                                        onClick={() => onConnect && onConnect(targetUserId)}
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
    );
};

export default ProfileViewModal;
