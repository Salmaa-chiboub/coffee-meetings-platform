import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  // Check if user is on profile page
  const isOnProfilePage = location.pathname.startsWith('/settings');

  // Sync with sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }

    // Listen for sidebar state changes
    const handleSidebarToggle = (event) => {
      setIsExpanded(event.detail.isExpanded);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  // Handle profile click
  const handleProfileClick = () => {
    navigate('/settings');
  };

  // Custom Coffee Cup Icon Component
  const CoffeeCupIcon = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );

  return (
    <header
      className={`bg-white shadow-sm border-b border-warmGray-200 transition-all duration-300 ease-in-out ${
        // Desktop: adjust margin based on sidebar state, mobile: full width
        isExpanded ? 'lg:ml-80' : 'lg:ml-20'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 30
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Branding */}
          <div className="flex items-center space-x-3 ml-16 lg:ml-0">
            {/* Coffee Cup Logo */}
            <div className="flex items-center justify-center w-10 h-10 bg-[#E8C4A0] rounded-xl shadow-sm">
              <CoffeeCupIcon className="w-6 h-6 text-[#8B6F47]" />
            </div>

            {/* Platform Title */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-warmGray-800 leading-tight">
                CoffeeMeet
              </h1>
              <p className="text-xs text-warmGray-500 leading-tight hidden sm:block">
                Employee Coffee Meeting Platform
              </p>
            </div>
          </div>

          {/* Right Side - User Profile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleProfileClick}
              className={`flex items-center space-x-3 rounded-full px-3 sm:px-4 py-2 transition-all duration-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E8C4A0] focus:ring-offset-2 transform hover:scale-[1.02] ${
                isOnProfilePage
                  ? 'bg-[#E8C4A0] hover:bg-[#DDB892] shadow-md'
                  : 'bg-warmGray-50 hover:bg-warmGray-100'
              }`}
              title={isOnProfilePage ? 'Currently viewing Profile & Settings' : 'Go to Profile & Settings'}
            >
              {/* User Avatar */}
              <div className="flex items-center justify-center w-8 h-8 bg-[#E8C4A0] rounded-full shadow-sm">
                <span className="text-[#8B6F47] font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>

              {/* User Info - Hidden on mobile, visible on larger screens */}
              <div className="hidden md:flex flex-col text-right">
                <span className={`text-sm font-medium leading-tight ${
                  isOnProfilePage ? 'text-[#8B6F47]' : 'text-warmGray-800'
                }`}>
                  {user?.name || 'User Name'}
                </span>
                <span className={`text-xs leading-tight ${
                  isOnProfilePage ? 'text-[#8B6F47]/70' : 'text-warmGray-500'
                }`}>
                  {user?.email || 'user@example.com'}
                </span>
              </div>

              {/* Dropdown Arrow - Hidden on mobile */}
              <ChevronDownIcon className={`w-4 h-4 hidden sm:block ${
                isOnProfilePage ? 'text-[#8B6F47]' : 'text-warmGray-400'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
