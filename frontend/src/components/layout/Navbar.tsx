import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { profileService } from '../../services/profile';
import { LogOut, Home, Users, MessageCircle, User as UserIcon, Bookmark, ChevronDown, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden mr-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>

            <Link to="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white hidden sm:block">RoomieMatch</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4 md:space-x-8">
            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard')
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
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/discover')
                      ? 'text-white bg-white/10'
                      : 'text-white/80 hover:text-white'
                      }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Discover
                  </Link>

                  <Link
                    to="/messages"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/messages')
                      ? 'text-white bg-white/10'
                      : 'text-white/80 hover:text-white'
                      }`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </Link>

                  <Link
                    to="/saved"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/saved')
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
                  <span className="text-white font-medium hidden md:block">{user.email}</span>
                  <ChevronDown className="h-4 w-4 text-white/80" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="md:hidden px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  </div>
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

      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-[#1f3256] z-50 md:hidden shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <span className="text-xl font-bold text-white">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Sidebar Links */}
              <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/dashboard')
                    ? 'bg-blue-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>

                {hasProfile ? (
                  <>
                    <Link
                      to="/discover"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/discover')
                        ? 'bg-blue-600 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Users className="h-5 w-5 mr-3" />
                      Discover
                    </Link>

                    <Link
                      to="/messages"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/messages')
                        ? 'bg-blue-600 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <MessageCircle className="h-5 w-5 mr-3" />
                      Messages
                    </Link>

                    <Link
                      to="/saved"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive('/saved')
                        ? 'bg-blue-600 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Bookmark className="h-5 w-5 mr-3" />
                      Saved Profiles
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/create-profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <UserIcon className="h-5 w-5 mr-3" />
                    Create Profile
                  </Link>
                )}
              </div>

              {/* User Info Footer */}
              <div className="p-4 border-t border-white/10 bg-[#162440]">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs text-blue-300 hover:text-blue-200"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 border border-white/20 rounded-lg text-sm text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;