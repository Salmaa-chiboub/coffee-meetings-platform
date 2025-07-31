import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCampaigns } from '../hooks/useCampaigns';
import { useDebouncedSearch } from '../hooks/useDebounce';

import { sorter, performanceMonitor } from '../utils/dataProcessing';
import CampaignCard from '../components/campaigns/CampaignCard';
import { SkeletonCard, SkeletonTitle, SkeletonButton } from '../components/ui/Skeleton';
import Skeleton from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import VirtualScrollGrid from '../components/ui/VirtualScrollList';
import CampaignCreate from './CampaignCreate';

const CampaignsList = React.memo(() => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState([{ field: 'created_at', direction: 'desc' }]);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  const navigate = useNavigate();

  // Use debounced search for better performance
  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    handleSearchChange
  } = useDebouncedSearch('', 500); // 500ms debounce

  // Reset to first page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchTerm, currentPage]);

  // Prepare query parameters for campaigns (sans search - on fait la recherche côté client)
  const queryParams = useMemo(() => ({
    page: currentPage,
    page_size: useVirtualScrolling ? 50 : 12, // More items for virtual scrolling
    // Pas de paramètre search - on utilise JavaScript côté client pour filtrer
  }), [currentPage, useVirtualScrolling]);

  const { data: campaignsResponse, isLoading, error } = useCampaigns(queryParams);

  // Extract campaigns and pagination info
  const campaigns = campaignsResponse?.data || [];
  const pagination = campaignsResponse?.pagination;

  // Filtrage et tri côté client avec JavaScript (pas de requêtes HTTP)
  const filteredAndSortedCampaigns = useMemo(() => {
    return performanceMonitor.measure('campaigns-filter-sort', () => {
      let result = campaigns;

      // Toujours utiliser le filtrage côté client JavaScript
      if (debouncedSearchTerm.trim()) {
        result = campaigns.filter(campaign =>
          campaign.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          campaign.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }

      // Appliquer le tri côté client
      if (sortConfig.length > 0) {
        result = sorter.sort(result, sortConfig);
      }

      return result;
    });
  }, [campaigns, debouncedSearchTerm, sortConfig]);

  // Pagination côté client pour les résultats filtrés
  const pageSize = useVirtualScrolling ? 50 : 12;
  const totalFilteredItems = filteredAndSortedCampaigns.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCampaigns = filteredAndSortedCampaigns.slice(startIndex, endIndex);

  // Reset à la page 1 quand on change la recherche
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchTerm]);

  const handleCreateCampaign = useCallback(() => {
    navigate('/campaigns/create');
  }, [navigate]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // New performance-optimized handlers
  const handleSortChange = useCallback((field, direction) => {
    setSortConfig([{ field, direction }]);
  }, []);

  const toggleVirtualScrolling = useCallback(() => {
    setUseVirtualScrolling(prev => !prev);
    setCurrentPage(1); // Reset to first page when switching modes
  }, []);

  const handleCampaignClick = async (campaign) => {
    try {
      // Check if campaign workflow is completed
      const { workflowService } = await import('../services/workflowService');
      const workflowData = await workflowService.getCampaignWorkflowStatus(campaign.id);

      // Campaign is completed if all 5 steps are completed
      const isCompleted = workflowData.completed_steps.includes(1) &&
                         workflowData.completed_steps.includes(2) &&
                         workflowData.completed_steps.includes(3) &&
                         workflowData.completed_steps.includes(4) &&
                         workflowData.completed_steps.includes(5);

      if (isCompleted) {
        // All workflow steps completed - go to history page
        navigate(`/campaigns/${campaign.id}/history`);
      } else {
        // Workflow incomplete - go to workflow page to continue
        navigate(`/campaigns/${campaign.id}/workflow`);
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
      // Fallback to workflow if there's an error
      navigate(`/campaigns/${campaign.id}/workflow`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <SkeletonTitle size="large" variant="text" />
          <SkeletonButton size="medium" variant="card" />
        </div>

        {/* Search Skeleton */}
        <Skeleton width="w-full" height="h-12" rounded="rounded-lg" variant="light" />

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">Error loading campaigns: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top horizontal card with search and add button */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        <div className="flex items-center justify-between">
          {/* Search bar on the left */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-warmGray-400" />
              </div>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
              />
              <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
                Search Campaigns
              </label>
            </div>
          </div>

          {/* Performance controls and Add Campaign button */}
          <div className="ml-6 flex items-center gap-3">
            {/* Virtual scrolling toggle for large datasets */}
            {filteredAndSortedCampaigns.length > 20 && (
              <button
                onClick={toggleVirtualScrolling}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  useVirtualScrolling
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={useVirtualScrolling ? 'Disable virtual scrolling' : 'Enable virtual scrolling for better performance'}
              >
                {useVirtualScrolling ? '📊 Virtual' : '📋 Standard'}
              </button>
            )}

            <button
              onClick={handleCreateCampaign}
              className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campaign listing card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-warmGray-800">
            Coffee Meeting Campaigns
          </h1>
          <p className="text-warmGray-600 mt-0.5">
            Manage your coffee meeting campaigns and track employee participation
          </p>
        </div>

        {paginatedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            {campaigns.length === 0 ? (
              <div>
                <div className="w-16 h-16 bg-[#E8C4A0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-8 w-8 text-[#8B6F47]" />
                </div>
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-warmGray-600 mb-6">
                  Create your first coffee meeting campaign to get started
                </p>
                <button
                  onClick={handleCreateCampaign}
                  className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div>
                <MagnifyingGlassIcon className="h-16 w-16 text-warmGray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  No campaigns found
                </h3>
                <p className="text-warmGray-600">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={handleCampaignClick}
              />
            ))}
          </div>
        )}

        {/* Pagination côté client */}
        {totalFilteredItems > pageSize && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFilteredItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
});

const Campaigns = () => {
  return (
    <Routes>
      <Route path="/" element={<CampaignsList />} />
      <Route path="/create" element={<CampaignCreate />} />
    </Routes>
  );
};

export default Campaigns;
