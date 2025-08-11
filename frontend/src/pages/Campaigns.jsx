import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCampaigns } from '../hooks/useCampaigns';
import { useDebouncedSearch } from '../hooks/useDebounce';
import { campaignService } from '../services/campaignService';

// Utilitaires de tri et performance intégrés
import CampaignCard from '../components/campaigns/CampaignCard';
import { SkeletonCard, SkeletonTitle, SkeletonButton } from '../components/ui/Skeleton';
import Skeleton from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import VirtualScrollList from '../components/ui/VirtualScrollList';

const CampaignsList = React.memo(() => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState([{ field: 'created_at', direction: 'desc' }]);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'incomplete'
  const [campaignsWithStatus, setCampaignsWithStatus] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
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

  // Prepare query parameters for campaigns - charger toutes les campagnes pour pagination côté client
  const queryParams = useMemo(() => ({
    page: 1, // Toujours page 1 pour récup��rer toutes les données
    page_size: 1000, // Grande taille pour récupérer toutes les campagnes
    // Pas de paramètre search - on utilise JavaScript côté client pour filtrer
  }), []);

  const { data: campaignsResponse, isLoading, error } = useCampaigns(queryParams);

  // Extract campaigns and pagination info
  const campaigns = campaignsResponse?.data || [];
  const pagination = campaignsResponse?.pagination;

  // Use server-provided workflow_status to avoid N+1 calls
  useEffect(() => {
    if (!Array.isArray(campaigns)) return;
    if (campaigns.length === 0) {
      setCampaignsWithStatus([]);
      return;
    }
    setStatusLoading(true);
    const campaignsWithWorkflow = campaigns.map(c => {
      const ws = c.workflow_status;
      const steps = ws?.completed_steps || [];
      const isCompleted = [1,2,3,4,5].every(s => steps.includes(s));
      return { ...c, workflow_status: ws, isCompleted };
    });
    setCampaignsWithStatus(campaignsWithWorkflow);
    setStatusLoading(false);
  }, [campaigns]);

  // Ajout de la fonction de suppression
  const handleDeleteCampaign = async (campaignId) => {
    try {
      const result = await campaignService.deleteCampaign(campaignId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression de la campagne');
      }

      // Mise à jour de l'état local après la suppression
      setCampaignsWithStatus(prev => prev.filter(camp => camp.id !== campaignId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(error.message);
    }
  };

  // Filtrage et tri côté client avec JavaScript (pas de requêtes HTTP)
  const filteredAndSortedCampaigns = useMemo(() => {
    // Filtrage et tri des campagnes
    let result = campaignsWithStatus;

    // Filtrage par recherche
    if (debouncedSearchTerm.trim()) {
      result = result.filter(campaign =>
        campaign.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filtrage par statut (completed/incomplete)
    if (statusFilter !== 'all') {
      result = result.filter(campaign => {
        return statusFilter === 'completed' ? campaign.isCompleted : !campaign.isCompleted;
      });
    }

    // Appliquer le tri côté client
    if (sortConfig.length > 0) {
      result = result.sort((a, b) => {
        const config = sortConfig[0];
        const field = config.field;
        const direction = config.direction === 'desc' ? -1 : 1;

        if (a[field] < b[field]) return -1 * direction;
        if (a[field] > b[field]) return 1 * direction;
        return 0;
      });
    }

    return result;
  }, [campaignsWithStatus, debouncedSearchTerm, sortConfig, statusFilter]);

  // Pagination côté client pour les résultats filtrés
  const pageSize = useVirtualScrolling ? 50 : 6;
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
    navigate('/app/campaigns/create');
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
      console.log('🔍 Campaign clicked:', campaign);
      console.log('🔍 Campaign ID:', campaign.id);

      if (!campaign.id) {
        console.error('❌ Campaign ID is missing!', campaign);
        return;
      }

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
        navigate(`/app/campaigns/${campaign.id}/history`);
      } else {
        // Workflow incomplete - go to workflow page to continue
        navigate(`/app/campaigns/${campaign.id}/workflow`);
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
      // Fallback to workflow if there's an error
      navigate(`/app/campaigns/${campaign.id}/workflow`);
    }
  };

  if (isLoading || statusLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Title, description and button skeleton */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <SkeletonTitle size="large" variant="text" />
            <Skeleton width="w-96" height="h-5" rounded="rounded" variant="light" />
          </div>
          <SkeletonButton size="medium" variant="card" />
        </div>

        {/* Campaign listing card skeleton */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          {/* Search and filters skeleton */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton width="w-80" height="h-12" rounded="rounded-lg" variant="light" />
            <div className="flex items-center gap-4">
              <Skeleton width="w-40" height="h-10" rounded="rounded-lg" variant="light" />
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
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
    <div className="max-w-7xl mx-auto space-y-3">
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

      {/* Campaign listing card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        {/* Search and filters with Add Campaign button */}
        <div className="flex items-center justify-between mb-6">
          {/* Search bar on the left */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-warmGray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des campagnes..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-2 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200 text-sm"
              />
              <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
                Rechercher des Campagnes
              </label>
            </div>
          </div>

          {/* Status Filter and Performance controls */}
          <div className="ml-4 flex items-center gap-4">
            {/* Status Filter */}
            <div className="min-w-[160px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-4 border-2 border-warmGray-400 rounded-full focus:outline-none focus:border-warmGray-600 transition-all duration-200 bg-white text-warmGray-700 text-sm"
              >
                <option value="all">Toutes les Campagnes</option>
                <option value="completed">Terminées</option>
                <option value="incomplete">En Cours</option>
              </select>
            </div>


          </div>
        </div>

        {paginatedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            {campaignsWithStatus.length === 0 ? (
              <div>
                <div className="w-16 h-16 bg-[#E8C4A0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-8 w-8 text-[#8B6F47]" />
                </div>
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  Aucune campagne pour le moment
                </h3>
                <p className="text-warmGray-600 mb-6">
                  Créez votre première campagne de rencontres café pour commencer
                </p>
                <button
                  onClick={handleCreateCampaign}
                  className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Créer la Première Campagne
                </button>
              </div>
            ) : (
              <div>
                <MagnifyingGlassIcon className="h-16 w-16 text-warmGray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  Aucune campagne trouvée
                </h3>
                <p className="text-warmGray-600">
                  Essayez d'ajuster vos termes de recherche
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
                onDelete={handleDeleteCampaign}
              />
            ))}
          </div>
        )}

        {/* Pagination côté client - affichée si nécessaire */}
        {totalPages > 1 && (
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
  return <CampaignsList />;
};

export default Campaigns;
