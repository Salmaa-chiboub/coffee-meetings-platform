import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const SearchResults = ({ 
  results, 
  isLoading, 
  query, 
  onResultClick, 
  onClose,
  className = "" 
}) => {
  const navigate = useNavigate();

  if (!query || query.length < 2) {
    return null;
  }

  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
    }

    // Navigate based on result type
    if (result.type === 'campaign') {
      navigate(`/app/campaigns/${result.id}/workflow`);
    } else if (result.type === 'employee') {
      // For now, just close the search - could navigate to employee detail page
      console.log('Employee selected:', result);
    }

    if (onClose) {
      onClose();
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'campaign':
        return <FolderIcon className="h-4 w-4 text-[#E8C4A0]" />;
      case 'employee':
        return <UserIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-warmGray-400" />;
    }
  };

  const getStatusIcon = (campaign) => {
    if (!campaign.end_date) return null;
    
    const endDate = new Date(campaign.end_date);
    const now = new Date();
    
    if (endDate < now) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" title="Terminée" />;
    } else {
      return <ClockIcon className="h-4 w-4 text-blue-500" title="Active" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-warmGray-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-warmGray-200 z-50 max-h-96 overflow-y-auto ${className}`}>
      {isLoading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8C4A0] mx-auto"></div>
          <p className="text-sm text-warmGray-500 mt-2">Searching...</p>
        </div>
      ) : (
        <>
          {/* Search Header */}
          <div className="px-4 py-3 border-b border-warmGray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warmGray-600">
                Search results for "<span className="font-medium text-warmGray-800">{query}</span>"
              </p>
              <span className="text-xs text-warmGray-500">
                {results.total} result{results.total !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Results */}
          <div className="py-2">
            {results.total === 0 ? (
              <div className="px-4 py-6 text-center">
                <MagnifyingGlassIcon className="h-8 w-8 text-warmGray-300 mx-auto mb-2" />
                <p className="text-sm text-warmGray-500">No results found</p>
                <p className="text-xs text-warmGray-400 mt-1">
                  Try searching for campaigns, employees, or other terms
                </p>
              </div>
            ) : (
              <>
                {/* Campaigns Section */}
                {results.campaigns.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-medium text-warmGray-500 uppercase tracking-wide">
                      Campaigns ({results.campaigns.length})
                    </div>
                    {results.campaigns.map((campaign) => (
                      <button
                        key={`campaign-${campaign.id}`}
                        onClick={() => handleResultClick(campaign)}
                        className="w-full px-4 py-3 text-left hover:bg-warmGray-50 transition-colors duration-150 border-l-2 border-transparent hover:border-[#E8C4A0]"
                      >
                        <div className="flex items-start space-x-3">
                          {getResultIcon('campaign')}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warmGray-900 truncate">
                              {highlightMatch(campaign.title, query)}
                            </p>
                            {campaign.description && (
                              <p className="text-xs text-warmGray-500 mt-1 line-clamp-2">
                                {highlightMatch(campaign.description, query)}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              {getStatusIcon(campaign)}
                              <span className="text-xs text-warmGray-400">
                                {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                              </span>
                              {campaign.employees_count > 0 && (
                                <span className="text-xs text-warmGray-400">
                                  • {campaign.employees_count} employees
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Employees Section */}
                {results.employees.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-warmGray-500 uppercase tracking-wide">
                      Employees ({results.employees.length})
                    </div>
                    {results.employees.map((employee) => (
                      <button
                        key={`employee-${employee.id}`}
                        onClick={() => handleResultClick(employee)}
                        className="w-full px-4 py-3 text-left hover:bg-warmGray-50 transition-colors duration-150 border-l-2 border-transparent hover:border-blue-400"
                      >
                        <div className="flex items-center space-x-3">
                          {getResultIcon('employee')}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warmGray-900 truncate">
                              {highlightMatch(employee.name, query)}
                            </p>
                            <p className="text-xs text-warmGray-500 truncate">
                              {highlightMatch(employee.email, query)}
                            </p>
                            {employee.arrival_date && (
                              <p className="text-xs text-warmGray-400 mt-1">
                                Joined {formatDate(employee.arrival_date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-warmGray-100 bg-warmGray-50">
            <p className="text-xs text-warmGray-500 text-center">
              Press <kbd className="px-1 py-0.5 bg-warmGray-200 rounded text-xs">Enter</kbd> to search or 
              <kbd className="px-1 py-0.5 bg-warmGray-200 rounded text-xs ml-1">Esc</kbd> to close
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;
