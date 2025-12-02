import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { profileService } from '../../services/profile';
import { LogOut, Home, Users, MessageCircle, User as UserIcon, Bookmark, ChevronDown } from 'lucide-react';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getUser = async () => {
    // Check if user is authenticated
    if (authService.isAuthenticated()) {
      const storedUser = authService.getStoredUser();
      setUser(storedUser);
      
      // Don't check profile if we're on create-profile page
      if (storedUser && location.pathname !== '/create-profile') {
        try {
          const response = await profileService.getProfile();
          setHasProfile(!!response.data);
        } catch (error: any) {
          // If it's a 404 error, user just doesn't have a profile yet
          if (error.response?.status === 404) {
            setHasProfile(false);
          } else {
            console.error('Error checking profile:', error);
            setHasProfile(false);
          }
        }
      } else if (storedUser && location.pathname === '/create-profile') {
        // On create-profile page, assume no profile yet
        setHasProfile(false);
      }
    } else {
      setUser(null);
      setHasProfile(false);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    getUser();
  }, [location.pathname]);

  // Global function to refresh auth state
  useEffect(() => {
    (window as any).refreshAuthState = () => {
      getUser();
    };
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    const handleStorageChange = () => {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getStoredUser();
        setUser(storedUser);
      } else {
        setUser(null);
        setHasProfile(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setHasProfile(false);
    setShowUserMenu(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  if (loading) {
    return (
      <nav className="bg-[#1f3256] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-white/20 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="bg-[#1f3256] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">RoomieMatch</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-[#1f3256] px-4 py-2 rounded-md text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-[#1f3256] text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">RoomieMatch</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-white bg-white/10' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              
              {hasProfile ? (
                <>
                  <Link
                    to="/discover"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/discover') 
                        ? 'text-white bg-white/10' 
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Discover
                  </Link>
                  
                  <Link
                    to="/messages"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/messages') 
                        ? 'text-white bg-white/10' 
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </Link>
                  
                  <Link
                    to="/saved"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/saved') 
                        ? 'text-white bg-white/10' 
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Saved
                  </Link>
                </>
              ) : (
                <Link
                  to="/create-profile"
                  className="flex items-center px-4 py-2 bg-white text-[#1f3256] rounded-md text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Create Profile
                </Link>
              )}
            </div>

            {/* User Menu */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#1f3256]"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-medium">{user.email}</span>
                  <ChevronDown className="h-4 w-4 text-white/80" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="h-4 w-4 mr-3" />
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;