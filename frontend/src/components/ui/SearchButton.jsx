import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  UserCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const SearchButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // No mock data. Will use real API data.

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

  // Handle search with real API (campaigns and employees)
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      Promise.all([
        fetch(`/campaigns/?search=${encodeURIComponent(searchQuery)}`, { credentials: 'include' }).then(res => res.json()),
        fetch(`/employees/?search=${encodeURIComponent(searchQuery)}`, { credentials: 'include' }).then(res => res.json())
      ])
        .then(([campaigns, employees]) => {
          // Adjust if your API returns results in a different property
          const campaignResults = (campaigns.results || campaigns || []).map(c => ({
            id: c.id,
            title: c.title,
            description: c.description || c.objective || '',
            type: 'campaign',
            url: `/campaigns/${c.id}/workflow`,
          }));
          const employeeResults = (employees.results || employees || []).map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            type: 'employee',
            url: `/employees/${e.id}`,
          }));
          setSearchResults([...campaignResults, ...employeeResults]);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
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
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center w-full">
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search campaigns, employees..."
            className="transition-all duration-300 w-[480px] max-w-full pl-12 pr-4 py-3 bg-white rounded-full border-2 border-[#E8C4A0] shadow-[0_2px_8px_0_rgba(232,196,160,0.15)] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8C4A0]/40 text-base focus:shadow-[0_8px_32px_0_rgba(232,196,160,0.30)]"
            style={{ boxShadow: '0 2px 8px 0 rgba(232,196,160,0.15)' }}
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#E8C4A0]" />
        </div>
        {(searchQuery.trim() || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 backdrop-blur-sm max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-[#E8C4A0] border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result) => {
                  // You may need to adjust the rendering below to match your real API response structure
                  return (
                    <button
                      key={result.id}
                      className="w-full px-4 py-3 text-left hover:bg-[#E8C4A0]/10 transition-colors border-b border-gray-50 last:border-b-0"
                      onClick={() => {
                        // Handle navigation
                        // You may want to use result.url or build a URL from result data
                        window.location.href = result.url || '/';
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#E8C4A0] rounded-lg flex items-center justify-center">
                          {result.type === 'campaign' ? (
                            <UserGroupIcon className="w-4 h-4 text-[#8B6F47]" />
                          ) : (
                            <UserCircleIcon className="w-4 h-4 text-[#8B6F47]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {result.title || result.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {result.type === 'campaign' ? result.description : result.email}
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
    </div>
  );
};

export default SearchButton;
