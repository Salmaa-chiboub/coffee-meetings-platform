import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  UserCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { globalSearchService } from '../../services/searchService';

const SearchButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Handle search with proper authentication
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      globalSearchService.globalSearch(searchQuery.trim(), { limit: 10 })
        .then((results) => {
          // Transform results to match expected format
          const campaignResults = results.campaigns.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description || c.objective || '',
            type: 'campaign',
            url: `/campaigns/${c.id}/workflow`,
          }));

          const employeeResults = results.employees.map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            type: 'employee',
            url: `/employees/${e.id}`,
          }));

          const evaluationResults = results.evaluations.map(evaluation => ({
            id: evaluation.id,
            title: `${evaluation.employee_name} ↔ ${evaluation.partner_name}`,
            description: evaluation.comment || `Rating: ${evaluation.rating}/5 - ${evaluation.campaign_title}`,
            campaign_title: evaluation.campaign_title,
            rating: evaluation.rating,
            type: 'evaluation',
            url: `/campaigns/${evaluation.campaign_id}/feedback`,
          }));

          const allResults = [...campaignResults, ...employeeResults, ...evaluationResults];
          setSearchResults(allResults);
        })
        .catch((error) => {
          console.error('Search error:', error);
          setSearchResults([]);
        })
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

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

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={`relative w-full transition-all duration-300 ${isFocused ? 'drop-shadow-lg' : ''}`} ref={containerRef}>
      <div className="flex items-center w-full">
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isMobile ? "Rechercher..." : "Rechercher campagnes, employés, commentaires..."}
            className={`transition-all duration-300 w-[200px] sm:w-[280px] md:w-[320px] lg:w-[360px] max-w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gradient-to-r from-white to-[#FDF9F5] rounded-full border text-gray-600 placeholder-gray-400 focus:outline-none text-xs sm:text-sm ${
              isFocused
                ? 'border-[#E6C19A] ring-2 ring-[#F3E3CE]/60 shadow-[0_6px_24px_0_rgba(230,193,154,0.20)] scale-[1.01]'
                : 'border-[#EED2B3] shadow-[0_3px_12px_0_rgba(238,210,179,0.15)] hover:shadow-[0_4px_16px_0_rgba(238,210,179,0.20)]'
            } active:shadow-[0_2px_8px_0_rgba(238,210,179,0.25)] active:scale-[0.999]`}
          />
          <MagnifyingGlassIcon className={`absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
            isFocused ? 'text-[#D2A26F] scale-105' : 'text-[#E6C19A]'
          }`} />
        </div>
        {(searchQuery.trim() || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-white to-[#FDF9F5] rounded-xl shadow-[0_6px_24px_0_rgba(238,210,179,0.15)] border border-[#F3E3CE]/40 z-50 backdrop-blur-sm max-h-72 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
            {isSearching ? (
              <div className="px-4 py-6 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-[#EED2B3] border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 font-medium">Recherche en cours...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result) => {
                  let IconComponent = UserGroupIcon;
                  if (result.type === 'employee') IconComponent = UserCircleIcon;
                  if (result.type === 'evaluation') IconComponent = StarIcon;
                  return (
                    <button
                      key={result.id}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-[#F3E3CE]/30 hover:to-[#FDF9F5]/50 transition-all duration-200 border-b border-[#F3E3CE]/30 last:border-b-0 group"
                      onClick={() => {
                        window.location.href = result.url || '/';
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#EED2B3] to-[#E6C19A] rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-[#B69155] transition-colors duration-200">
                            {result.title || result.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {result.type === 'campaign' ? result.description : result.type === 'employee' ? result.email : result.description}
                          </p>
                        </div>
                        <span className="text-xs text-[#D2A26F] capitalize font-medium bg-[#F3E3CE]/40 px-2 py-1 rounded-full">
                          {result.type === 'campaign' ? 'campagne' : result.type === 'employee' ? 'employé' : result.type === 'evaluation' ? 'évaluation' : result.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F3E3CE]/30 to-[#EED2B3]/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MagnifyingGlassIcon className="w-5 h-5 text-[#D2A26F]" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Aucun résultat trouvé</p>
                <p className="text-xs text-gray-400 mt-1">
                  Essayez des mots-clés différents
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
