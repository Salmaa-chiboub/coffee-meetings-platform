import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCircleIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import SearchBar from '../ui/SearchBar';
import SearchResults from '../ui/SearchResults';
import { globalSearchService } from '../../services/searchService';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ campaigns: [], employees: [], total: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Escape key closes search results
      if (event.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearchResults]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    navigate('/settings');
    setIsDropdownOpen(false);
  };

  // Handle search functionality
  const handleSearchChange = async (value) => {
    setSearchTerm(value);

    if (!value || value.trim().length < 2) {
      setSearchResults({ campaigns: [], employees: [], total: 0 });
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const results = await globalSearchService.globalSearch(value.trim(), {
        limit: 8,
        includeCampaigns: true,
        includeEmployees: true
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ campaigns: [], employees: [], total: 0, error: 'Search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (value) => {
    if (value && value.trim()) {
      // If there are results, navigate to the first one
      if (searchResults.campaigns.length > 0) {
        navigate(`/campaigns/${searchResults.campaigns[0].id}/workflow`);
      } else if (searchResults.employees.length > 0) {
        console.log('Navigate to employee:', searchResults.employees[0]);
      }
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (result) => {
    setShowSearchResults(false);
    setSearchTerm('');
  };

  const handleCloseSearch = () => {
    setShowSearchResults(false);
  };

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
          {/* Left Side - Search Bar */}
          <div className="flex-1 max-w-md ml-16 lg:ml-0 relative" ref={searchRef}>
            <SearchBar
              placeholder="Search campaigns, employees..."
              value={searchTerm}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              size="md"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <SearchResults
                results={searchResults}
                isLoading={isSearching}
                query={searchTerm}
                onResultClick={handleSearchResultClick}
                onClose={handleCloseSearch}
              />
            )}
          </div>

          {/* Right Side - User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group flex items-center space-x-2 rounded-xl px-2 sm:px-3 py-1.5 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E8C4A0] focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#E8C4A0]/60 to-cream/70 hover:from-[#E8C4A0]/70 hover:to-cream/80 border border-[#E8C4A0]/40 backdrop-blur-sm"
              title={`${user?.name || 'User'} - Click to open menu`}
            >
              {/* User Avatar with Ring - Smaller */}
              <div className="relative">
                <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-md overflow-hidden ring-1 ring-white/50 group-hover:ring-white/70 transition-all duration-300">
                  {user?.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt={`${user?.name || 'User'}'s profile`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`flex items-center justify-center w-full h-full bg-gradient-to-br from-[#E8C4A0] to-[#DDB892] ${
                      user?.profile_picture_url ? 'hidden' : 'flex'
                    }`}
                  >
                    <span className="text-[#8B6F47] font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                {/* Online Status Indicator - Smaller */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full shadow-sm"></div>
              </div>

              {/* User Name - Compact */}
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <span className="text-sm font-medium leading-tight text-[#8B6F47] truncate">
                  {user?.name || 'User Name'}
                </span>
                <span className="text-xs text-[#8B6F47]/70 leading-tight">
                  {user?.role === 'hr_manager' ? 'HR Manager' : 'User'}
                </span>
              </div>

              {/* Mobile: Show first name only */}
              <div className="flex sm:hidden flex-col text-left">
                <span className="text-sm font-medium leading-tight text-[#8B6F47]">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </div>

              {/* Dropdown Arrow - Smaller */}
              <ChevronDownIcon className={`w-3.5 h-3.5 text-[#8B6F47]/60 transition-all duration-300 group-hover:text-[#8B6F47] ${
                isDropdownOpen ? 'rotate-180 scale-110' : ''
              }`} />
            </button>

            {/* Simplified Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-[#E8C4A0]/30 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                {/* Role Info Only */}
                <div className="px-4 py-2 border-b border-[#E8C4A0]/20">
                  <p className="text-xs text-[#8B6F47]/70 text-center">
                    {user?.role === 'hr_manager' ? 'HR Manager' : 'User'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-3 text-sm text-warmGray-700 hover:bg-gradient-to-r hover:from-[#E8C4A0]/10 hover:to-cream/10 hover:text-[#8B6F47] transition-all duration-200 group"
                  >
                    <UserIcon className="w-4 h-4 mr-3 text-[#8B6F47]/60 group-hover:text-[#8B6F47] transition-colors" />
                    <span className="font-medium">Profile & Settings</span>
                  </button>

                  <div className="mx-4 my-2 border-t border-[#E8C4A0]/20"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-warmGray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50 hover:text-red-600 transition-all duration-200 group"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
