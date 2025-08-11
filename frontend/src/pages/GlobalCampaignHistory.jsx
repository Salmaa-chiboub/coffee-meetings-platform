import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ClockIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { campaignService } from '../services/campaignService';
import CampaignMetricsChart from '../components/charts/CampaignMetricsChart';
import EvaluationTrendsChart from '../components/charts/EvaluationTrendsChart';
import PerformanceBadge from '../components/ui/PerformanceBadge';
import GlobalEvaluationPerformance from '../components/evaluations/GlobalEvaluationPerformance';
import { LazyLoadingContainer } from '../components/ui/LazyLoadingContainer';
import useLazyLoading from '../hooks/useLazyLoading';
import { exportCampaignHistory } from '../utils/pdfExport';

const GlobalCampaignHistory = () => {
  const navigate = useNavigate();

  // Fetch function for lazy loading with error handling
  const fetchCompletedCampaigns = useCallback(async (page, pageSize) => {
    try {
      console.log('Fetching campaigns:', { page, pageSize });
      const result = await campaignService.getCompletedCampaignsWithDetails(page, pageSize);
      console.log('Campaign service raw result:', result);

      if (!result || !result.success) {
        console.warn('Invalid or unsuccessful response:', result);
        return {
          success: false,
          error: result?.error || 'Failed to fetch campaigns',
          data: [],
          pagination: {
            has_next: false,
            has_previous: false
          }
        };
      }

      console.log('Processing successful response with', result.campaigns?.length || 0, 'campaigns');
      
      return {
        success: true,
        data: result.campaigns || [],
        pagination: result.pagination || {
          has_next: false,
          has_previous: false
        }
      };
    } catch (error) {
      console.error('Error in fetchCompletedCampaigns:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch campaigns',
        data: [],
        pagination: { 
          has_next: false, 
          has_previous: false 
        }
      };
    }
  }, []);

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
    sentinelRef,
    totalItems,
    cacheHits,
    totalRequests
  } = useLazyLoading({
    fetchData: fetchCompletedCampaigns,
    contentType: 'history'
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle campaign view
  const handleViewCampaign = (campaignId) => {
    navigate(`/app/campaigns/${campaignId}/history`);
  };

  // Calculate duration in days
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jours`;
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (campaigns.length === 0) return;
    try {
      const { exportCampaignHistory } = require('../utils/pdfExport');
      exportCampaignHistory(campaigns);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warmGray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-warmGray-200 rounded w-1/3"></div>
            <div className="h-4 bg-warmGray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                  <div className="h-4 bg-warmGray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-warmGray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-warmGray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warmGray-50 p-2 lg:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header outside any background - truly external */}
      <div className="max-w-6xl mx-auto px-2 lg:px-4 pt-2 lg:pt-4">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-warmGray-800 mb-2">
              Historique des Campagnes
            </h1>
            <p className="text-warmGray-600">
              Consultez et gérez les campagnes de rencontres café terminées. Les statistiques ci-dessous reflètent uniquement les campagnes terminées.
            </p>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={campaigns.length === 0}
            className="bg-[#E8C4A0] hover:bg-[#DDB892] disabled:bg-warmGray-300 text-[#8B6F47] disabled:text-warmGray-500 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* Main content area with background */}
      <div className="bg-warmGray-50 min-h-screen">
        <div className="max-w-6xl mx-auto p-2 lg:p-4">

        {/* Summary Stats */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-warmGray-200">
              <div className="flex items-center">
                <div className="p-2 bg-[#E8C4A0] rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-[#8B6F47]" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-warmGray-600">Campagnes Terminées</p>
                  <p className="text-xl font-bold text-warmGray-800">{campaigns.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-warmGray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-warmGray-600">Participants (Terminées)</p>
                  <p className="text-xl font-bold text-warmGray-800">
                    {campaigns.reduce((sum, campaign) => sum + (campaign.participants_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-warmGray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-warmGray-600">Paires (Terminées)</p>
                  <p className="text-xl font-bold text-warmGray-800">
                    {campaigns.reduce((sum, campaign) => sum + (campaign.total_pairs || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Charts Section */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="order-2 xl:order-1">
              <CampaignMetricsChart campaigns={campaigns} />
            </div>
            <div className="order-1 xl:order-2">
              <EvaluationTrendsChart campaigns={campaigns} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {campaigns.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-warmGray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-warmGray-400" />
            </div>
            <h3 className="text-lg font-medium text-warmGray-800 mb-2">Aucune campagne trouvée</h3>
            <p className="text-warmGray-600">
              Aucune campagne terminée disponible pour le moment.
            </p>
          </div>
        )}

        {/* Campaign Table - Desktop */}
        {campaigns.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg border border-warmGray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-warmGray-200">
                <thead className="bg-warmGray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warmGray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warmGray-500 uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warmGray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warmGray-500 uppercase tracking-wider">
                      Paires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warmGray-500 uppercase tracking-wider">
                      Critères
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warmGray-500 uppercase tracking-wider">
                      Terminée
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-warmGray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-warmGray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-warmGray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-warmGray-900">
                              {campaign.title}
                            </div>
                            {campaign.description && (
                              <div className="text-sm text-warmGray-500 mt-1 max-w-xs truncate">
                                {campaign.description}
                              </div>
                            )}
                            <div className="text-xs text-warmGray-400 mt-1">
                              Created: {formatDate(campaign.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-warmGray-900">
                          <CalendarDaysIcon className="h-4 w-4 text-warmGray-400 mr-2" />
                          <div>
                            <div className="font-medium">
                              {calculateDuration(campaign.start_date, campaign.end_date)}
                            </div>
                            <div className="text-xs text-warmGray-500">
                              {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-warmGray-900">
                          <UserGroupIcon className="h-4 w-4 text-warmGray-400 mr-2" />
                          <span className="font-medium">{campaign.participants_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-warmGray-900">
                          <UsersIcon className="h-4 w-4 text-warmGray-400 mr-2" />
                          <span className="font-medium">{campaign.total_pairs || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-warmGray-900">
                          <CogIcon className="h-4 w-4 text-warmGray-400 mr-2" />
                          <span className="font-medium">
                            {Number(campaign.total_criteria_count || campaign.total_criteria) || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-warmGray-900">
                          <ClockIcon className="h-4 w-4 text-warmGray-400 mr-2" />
                          <span>{formatDate(campaign.completion_date)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewCampaign(campaign.id)}
                          className="text-[#8B6F47] hover:text-[#6B5537] transition-colors p-1 hover:bg-[#E8C4A0]/20 rounded"
                          title="View campaign details"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg border border-warmGray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-warmGray-800 mb-1">
                      {campaign.title}
                    </h3>
                    <PerformanceBadge campaign={campaign} />
                  </div>
                  <button
                    onClick={() => handleViewCampaign(campaign.id)}
                    className="text-[#8B6F47] hover:text-[#6B5537] transition-colors p-2 hover:bg-[#E8C4A0]/20 rounded"
                    title="View campaign details"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </button>
                </div>

                {campaign.description && (
                  <p className="text-warmGray-600 text-sm mb-3 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4 text-warmGray-400" />
                    <div>
                      <p className="text-xs text-warmGray-500">Participants</p>
                      <p className="text-sm font-medium text-warmGray-800">
                        {campaign.participants_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-4 w-4 text-warmGray-400" />
                    <div>
                      <p className="text-xs text-warmGray-500">Paires</p>
                      <p className="text-sm font-medium text-warmGray-800">
                        {campaign.total_pairs || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CogIcon className="h-4 w-4 text-warmGray-400" />
                    <div>
                      <p className="text-xs text-warmGray-500">Criteria</p>
                      <p className="text-sm font-medium text-warmGray-800">
                        {campaign.total_criteria || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CalendarDaysIcon className="h-4 w-4 text-warmGray-400" />
                    <div>
                      <p className="text-xs text-warmGray-500">Duration</p>
                      <p className="text-sm font-medium text-warmGray-800">
                        {calculateDuration(campaign.start_date, campaign.end_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-warmGray-500 pt-3 border-t border-warmGray-100">
                  <span>
                    <ClockIcon className="h-3 w-3 inline mr-1" />
                    Terminée: {formatDate(campaign.completion_date)}
                  </span>
                  <span>
                    Créée: {formatDate(campaign.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
        )}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2 text-warmGray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-warmGray-600"></div>
              <span>Chargement de plus de campagnes...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && campaigns.length > 0 && (
          <div className="text-center py-8">
            <div className="text-warmGray-500 text-sm">
              Vous avez atteint la fin de votre historique de campagnes
            </div>
            <div className="text-warmGray-400 text-xs mt-1">
              {campaigns.length} campagnes au total
            </div>
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasMore && !loadingMore && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}

        {/* Global Evaluation Performance Section */}
        <GlobalEvaluationPerformance campaigns={campaigns} />

        </div>
      </div>
    </div>
  );
};

export default GlobalCampaignHistory;
