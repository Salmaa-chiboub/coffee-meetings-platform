import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  StarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { evaluationService } from '../services/evaluationService';

const CampaignEvaluations = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  
  const [evaluations, setEvaluations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvaluationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load both evaluations and statistics
        const [evaluationsResponse, statisticsResponse] = await Promise.all([
          evaluationService.getCampaignEvaluations(campaignId),
          evaluationService.getCampaignStatistics(campaignId)
        ]);
        
        if (evaluationsResponse.success) {
          setEvaluations(evaluationsResponse.evaluations || []);
        }
        
        if (statisticsResponse.success) {
          setStatistics(statisticsResponse.statistics);
        }
        
      } catch (err) {
        console.error('Error loading evaluation data:', err);
        setError(err.message || 'Failed to load evaluation data');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      loadEvaluationData();
    }
  }, [campaignId]);

  const handleBackToCampaigns = () => {
    navigate('/app/campaigns');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-warmGray-300" />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-warmGray-600">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6F47]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={handleBackToCampaigns}
              className="mt-4 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              Retour aux Campagnes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToCampaigns}
            className="flex items-center space-x-2 text-warmGray-600 hover:text-warmGray-800 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Retour aux Campagnes</span>
          </button>

          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-6 w-6 text-[#E8C4A0]" />
            <span className="text-warmGray-800 font-medium">Résultats d'Évaluation</span>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-warmGray-200 p-4 text-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-warmGray-800">{statistics.total_pairs}</p>
              <p className="text-sm text-warmGray-600">Total Paires</p>
            </div>

            <div className="bg-white rounded-lg border border-warmGray-200 p-4 text-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-warmGray-800">{statistics.evaluations_submitted}</p>
              <p className="text-sm text-warmGray-600">Réponses</p>
            </div>

            <div className="bg-white rounded-lg border border-warmGray-200 p-4 text-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-warmGray-800">{statistics.response_rate}%</p>
              <p className="text-sm text-warmGray-600">Taux de Réponse</p>
            </div>

            <div className="bg-white rounded-lg border border-warmGray-200 p-4 text-center">
              <StarIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-warmGray-800">
                {statistics.average_rating ? statistics.average_rating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-warmGray-600">Note Moyenne</p>
            </div>
          </div>
        )}

        {/* Evaluations List */}
        <div className="bg-white rounded-xl border border-warmGray-200 p-6 shadow-md">
          <h3 className="text-lg font-semibold text-warmGray-800 mb-4">
            Évaluations Individuelles ({evaluations.length})
          </h3>

          {evaluations.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
              <p className="text-warmGray-500">Aucune évaluation soumise pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="bg-warmGray-50 border border-warmGray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="font-medium text-warmGray-800">
                          {evaluation.employee_name}
                        </h4>
                        <span className="text-sm text-warmGray-500">
                          a rencontré {evaluation.partner_name}
                        </span>
                      </div>
                      
                      {evaluation.rating && (
                        <div className="mb-2">
                          {renderStars(evaluation.rating)}
                        </div>
                      )}
                      
                      {evaluation.comment && (
                        <div className="bg-white rounded-lg p-3 mb-2">
                          <p className="text-warmGray-700 text-sm italic">
                            "{evaluation.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-xs text-warmGray-500">
                      {formatDate(evaluation.submitted_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignEvaluations;
