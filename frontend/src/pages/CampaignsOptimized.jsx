import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { campaignService } from '../services/campaignService';
import CampaignCard from '../components/campaigns/CampaignCard';
import { LazyLoadingGrid } from '../components/ui/LazyLoadingContainer';
import useLazyLoading from '../hooks/useLazyLoading';
import { useDebounce } from '../hooks/useDebounce';

const CampaignsOptimized = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch function for lazy loading
  const fetchCampaigns = useCallback(async (page, pageSize) => {
    const filters = {};
    
    // Add search filter
    if (debouncedSearchTerm.trim()) {
      filters.search = debouncedSearchTerm.trim();
    }
    
    // Add status filter
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }

    return await campaignService.getCampaignsPaginated(page, pageSize, filters);
  }, [debouncedSearchTerm, statusFilter]);

  // Lazy loading hook with optimized configuration
  const {
    data: campaigns,
    loading,
    loadingMore,
    error,
    hasMore,
    isEmpty,
    isFirstLoad,
    refresh,
    sentinelRef
  } = useLazyLoading({
    fetchData: fetchCampaigns,
    contentType: 'campaigns',
    resetTrigger: `${debouncedSearchTerm}-${statusFilter}` // Reset when filters change
  });

  // Handle campaign creation
  const handleCreateCampaign = useCallback(() => {
    navigate('/campaigns/create');
  }, [navigate]);

  // Handle campaign view
  const handleViewCampaign = useCallback((campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  }, [navigate]);

  // Handle search change
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  // Empty state component
  const EmptyState = useMemo(() => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <PlusIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm || statusFilter !== 'all' ? 'Aucune campagne trouvée' : 'Aucune campagne pour le moment'}
      </h3>
      <p className="text-gray-500 mb-6">
        {searchTerm || statusFilter !== 'all'
          ? 'Essayez d\'ajuster votre recherche ou vos filtres'
          : 'Commencez par créer votre première campagne'
        }
      </p>
      {(!searchTerm && statusFilter === 'all') && (
        <button
          onClick={handleCreateCampaign}
          className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-full transition-colors"
        >
          Créer une Campagne
        </button>
      )}
    </div>
  ), [searchTerm, statusFilter, handleCreateCampaign]);

  // Loading skeleton
  const LoadingSkeleton = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto p-2 lg:p-4">
        {/* Title, description and Add Campaign button */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-warmGray-800">
              Campagnes de Rencontres Café
            </h1>
            <p className="text-warmGray-600 mt-0.5">
              Gérez vos campagnes de rencontres café et suivez la participation des employés
            </p>
          </div>
          
          {/* Add Campaign Button */}
          <button
            onClick={handleCreateCampaign}
            className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Ajouter une Campagne</span>
          </button>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg border border-warmGray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-warmGray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des campagnes..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-3 border-2 border-warmGray-300 rounded-lg focus:outline-none focus:border-warmGray-500 transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="ml-4 flex items-center gap-4">
              <div className="min-w-[160px]">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full py-2 px-4 border-2 border-warmGray-400 rounded-full focus:outline-none focus:border-warmGray-600 transition-all duration-200 bg-white text-warmGray-700 text-sm"
                >
                  <option value="all">Toutes les Campagnes</option>
                  <option value="completed">Terminées</option>
                  <option value="incomplete">En Cours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Grid with Lazy Loading */}
        <LazyLoadingGrid
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          isEmpty={isEmpty}
          isFirstLoad={isFirstLoad}
          onRetry={refresh}
          sentinelRef={sentinelRef}
          emptyState={EmptyState}
          loadingState={LoadingSkeleton}
          columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          gap="gap-6"
          loadMoreText="Loading more campaigns..."
          endText="You've seen all campaigns"
        >
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onView={() => handleViewCampaign(campaign.id)}
            />
          ))}
        </LazyLoadingGrid>
      </div>
    </div>
  );
};

export default CampaignsOptimized;
