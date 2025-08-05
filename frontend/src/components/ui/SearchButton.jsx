import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const SearchButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Mock search results
  const mockResults = [
    {
      id: 1,
      type: 'campaign',
      title: 'Q1 Team Building Campaign',
      description: 'Coffee meetings for cross-department collaboration',
      icon: UserGroupIcon,
      url: '/campaigns/1'
    },
    {
      id: 2,
      type: 'user',
      title: 'John Doe',
      description: 'Software Engineer - Engineering Department',
      icon: UserGroupIcon,
      url: '/users/1'
    },
    {
      id: 3,
      type: 'evaluation',
      title: 'December Evaluations',
      description: 'Recent coffee meeting evaluations',
      icon: DocumentTextIcon,
      url: '/evaluations'
    }
  ];

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        const filtered = mockResults.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {!isOpen ? (
        /* Search Button - Closed State */
        <button
          onClick={handleOpen}
          className="p-2 rounded-full hover:bg-gray-100/50 transition-all duration-200 focus:outline-none"
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-600" />
        </button>
      ) : (
        /* Search Input - Open State */
        <div className="flex items-center">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search campaigns, users, evaluations..."
              className="w-64 md:w-80 pl-10 pr-10 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 border border-gray-200 text-sm"
            />
            
            {/* Search Icon */}
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Search Results Dropdown */}
          {(searchQuery.trim() || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 backdrop-blur-sm max-h-80 overflow-y-auto">
              {isSearching ? (
                /* Loading State */
                <div className="px-4 py-8 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-[#E8C4A0] border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                /* Results */
                <div className="py-2">
                  {searchResults.map((result) => {
                    const IconComponent = result.icon;
                    return (
                      <button
                        key={result.id}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                        onClick={() => {
                          // Handle navigation
                          console.log('Navigate to:', result.url);
                          handleClose();
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#E8C4A0] rounded-lg flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-[#8B6F47]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.description}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 capitalize">
                            {result.type}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* No Results */
                <div className="px-4 py-8 text-center">
                  <MagnifyingGlassIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try different keywords
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchButton;
