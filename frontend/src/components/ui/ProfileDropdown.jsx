import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-1 rounded-full hover:bg-gray-100/50 transition-all duration-200 focus:outline-none"
      >
        {/* Profile Picture */}
        <div className="relative">
          <img
            src={user?.profile_picture || "/default-avatar.svg"}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.target.src = "/default-avatar.svg";
            }}
          />
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ml-1 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 backdrop-blur-sm">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <img
                src={user?.profile_picture || "/default-avatar.svg"}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = "/default-avatar.svg";
                }}
              />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {user?.name || 'User Name'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
              Profil et Paramètres
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
