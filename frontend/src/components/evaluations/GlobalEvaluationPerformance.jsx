import React, { useState, useEffect } from 'react';
import { StarIcon, ChartBarIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { dashboardService } from '../../services/dashboardService';

const GlobalEvaluationPerformance = ({ campaigns = [] }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (campaigns.length > 0) {
      calculateStatisticsFromCampaigns();
    } else {
      fetchGlobalStatistics();
    }
  }, [campaigns]);

  const calculateStatisticsFromCampaigns = () => {
    try {
      setLoading(true);

      // Calculer les statistiques à partir des campagnes avec gestion des valeurs nulles
      const totalCampaigns = campaigns.length;
      const totalPairs = campaigns.reduce((sum, campaign) => 
        sum + (Number(campaign.total_pairs) || 0), 0);
      const totalEvaluations = campaigns.reduce((sum, campaign) => 
        sum + (Number(campaign.total_evaluations) || 0), 0);

      // Calculer la note moyenne en excluant les valeurs nulles ou undefined
      const validRatings = campaigns
        .map(c => Number(c.average_rating))
        .filter(rating => !isNaN(rating) && rating !== null);
      
      const avgRating = validRatings.length > 0
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        : 0;

      // Calculer le taux de réponse
      const expectedEvaluations = totalPairs * 2;
      const responseRate = expectedEvaluations > 0 
        ? Math.min(100, (totalEvaluations / expectedEvaluations) * 100)
        : 0;

      setStatistics({
        totalCampaigns,
        totalPairs,
        totalEvaluations,
        averageRating: avgRating,
        responseRate: responseRate,
        performanceLevel: calculatePerformanceLevel(responseRate, avgRating)
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error calculating statistics:', error);
      setError('Échec du calcul des statistiques');
      setLoading(false);
    }
  };

  const calculatePerformanceLevel = (responseRate, avgRating) => {
    if (!responseRate || !avgRating) return 'No Data';
    
    if (responseRate >= 80 && avgRating >= 4) return 'Excellent';
    if (responseRate >= 60 && avgRating >= 3.5) return 'Good';
    if (responseRate >= 40 && avgRating >= 3) return 'Average';
    if (responseRate >= 20 && avgRating >= 2) return 'Below Average';
    return 'Poor';
  };

  const fetchGlobalStatistics = async () => {
    try {
      setLoading(true);
      // Use the same endpoint as dashboard for consistency
      const response = await dashboardService.getOverallEvaluationStats();

      if (response.success) {
        const dashboardData = response.data;

        // Map dashboard data to our statistics format
        const mappedStatistics = {
          total_campaigns: dashboardData.completed_campaigns || 0,
          total_pairs: dashboardData.total_pairs || 0,
          total_evaluations_generated: dashboardData.total_evaluations || 0,
          evaluations_submitted: dashboardData.total_evaluations || 0,
          evaluations_pending: 0, // Calculate if needed
          response_rate: dashboardData.total_pairs > 0 ?
            ((dashboardData.total_evaluations || 0) / ((dashboardData.total_pairs || 0) * 2) * 100) : 0,
          average_rating: dashboardData.average_rating || null,
          total_ratings: dashboardData.total_evaluations || 0,
          global_performance: calculatePerformance(
            dashboardData.total_pairs > 0 ?
              ((dashboardData.total_evaluations || 0) / ((dashboardData.total_pairs || 0) * 2) * 100) : 0,
            dashboardData.average_rating || 0
          )
        };

        setStatistics(mappedStatistics);
        setError(null);
      } else {
        setError('Échec de la récupération des statistiques');
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      // Fallback to calculated statistics from campaigns if available
      if (campaigns.length > 0) {
        calculateStatisticsFromCampaigns();
      } else {
        setStatistics({
          total_campaigns: 0,
          total_pairs: 0,
          total_evaluations_generated: 0,
          evaluations_submitted: 0,
          evaluations_pending: 0,
          response_rate: 0,
          average_rating: null,
          total_ratings: 0,
          global_performance: 'Aucune Donnée'
        });
        setError('Impossible de charger les statistiques');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = (responseRate, avgRating) => {
    if (responseRate >= 80 && avgRating >= 4) {
      return 'Excellent';
    } else if (responseRate >= 60 && avgRating >= 3.5) {
      return 'Good';
    } else if (responseRate >= 40 && avgRating >= 3) {
      return 'Average';
    } else if (responseRate >= 20 && avgRating >= 2) {
      return 'Below Average';
    } else if (responseRate > 0 || avgRating > 0) {
      return 'Poor';
    } else {
      return 'No Data';
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent':
        return { text: 'text-green-600', bg: 'bg-green-100' };
      case 'Good':
        return { text: 'text-blue-600', bg: 'bg-blue-100' };
      case 'Average':
        return { text: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'Below Average':
        return { text: 'text-orange-600', bg: 'bg-orange-100' };
      case 'Poor':
        return { text: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-warmGray-200 p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="bg-white rounded-lg border border-warmGray-200 p-6 mb-8">
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load evaluation statistics
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'No evaluation data available'}
          </p>
          <button
            onClick={fetchGlobalStatistics}
            className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const performanceColors = getPerformanceColor(statistics.global_performance);

  return (
    <div className="bg-white rounded-lg border border-warmGray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-warmGray-800">
          Ma Performance d'Évaluation
        </h3>
        <div className="text-sm text-warmGray-500">
          Basé sur {statistics.total_campaigns} de vos campagnes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {statistics.average_rating ? renderStars(statistics.average_rating) : (
              <span className="text-gray-400">Aucune note</span>
            )}
          </div>
          <div className="text-2xl font-bold text-warmGray-800">
            {statistics.average_rating ? statistics.average_rating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-warmGray-600">Note Moyenne</div>
          <div className="text-xs text-warmGray-500">
            {statistics.total_ratings} notes reçues
          </div>
        </div>

        {/* Response Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-warmGray-800">
            {statistics.response_rate}%
          </div>
          <div className="text-sm text-warmGray-600">Response Rate</div>
          <div className="text-xs text-warmGray-500">
            {statistics.evaluations_submitted}/{statistics.total_evaluations_generated} evaluations
          </div>
        </div>

        {/* Total Pairs */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ChartBarIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-warmGray-800">
            {statistics.total_pairs}
          </div>
          <div className="text-sm text-warmGray-600">Total Pairs</div>
          <div className="text-xs text-warmGray-500">
            across your campaigns
          </div>
        </div>

        {/* Global Performance */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ClockIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${performanceColors.bg} ${performanceColors.text} mb-2`}>
            {statistics.global_performance}
          </div>
          <div className="text-sm text-warmGray-600">Ma Performance</div>
          <div className="text-xs text-warmGray-500">
            évaluation globale
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-6 pt-6 border-t border-warmGray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-warmGray-800">
              {statistics.evaluations_submitted}
            </div>
            <div className="text-xs text-warmGray-500">Soumises</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-warmGray-800">
              {statistics.evaluations_pending}
            </div>
            <div className="text-xs text-warmGray-500">En Attente</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-warmGray-800">
              {statistics.total_campaigns}
            </div>
            <div className="text-xs text-warmGray-500">Campagnes</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-warmGray-800">
              {statistics.total_evaluations_generated}
            </div>
            <div className="text-xs text-warmGray-500">Generated</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalEvaluationPerformance;
