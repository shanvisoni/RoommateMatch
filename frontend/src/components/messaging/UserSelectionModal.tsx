import React from 'react';
import { X, User, MessageCircle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  location?: string;
}

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (userId: number) => void;
  title?: string;
  description?: string;
}

const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
  title = "Select a person to message",
  description = "Choose who you'd like to start a conversation with"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User List */}
        <div className="max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-6 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users available to message</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user.id);
                    onClose();
                  }}
                  className="w-full flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex-shrink-0">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <h4 className="text-sm font-semibold text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.location && (
                      <p className="text-xs text-gray-400 mt-1">{user.location}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Only users with accepted connections can be messaged
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSelectionModal;
