import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  StarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { evaluationService } from '../services/evaluationService';
import { campaignService } from '../services/campaignService';
import { SkeletonTitle, SkeletonStats, SkeletonEvaluationCard } from '../components/ui/Skeleton';

const CampaignEvaluationsView = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvaluationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load evaluation data first (faster)
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

        // Load campaign details separately (can be cached)
        try {
          const campaignResponse = await campaignService.getCampaign(campaignId);
          setCampaign(campaignResponse);
        } catch (campaignErr) {
          // Campaign data is less critical, continue without it
          console.warn('Failed to load campaign details:', campaignErr);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
      </div>
    );
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-warmGray-200 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-warmGray-200 rounded animate-pulse"></div>
            </div>
            <SkeletonTitle size="medium" />
          </div>

          {/* Stats Skeleton */}
          <SkeletonStats />

          {/* Evaluations Skeleton */}
          <div className="bg-white rounded-xl border border-warmGray-200 p-6">
            <SkeletonTitle size="small" className="mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonEvaluationCard key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/campaigns')}
              className="mt-4 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center space-x-2 text-warmGray-600 hover:text-warmGray-800 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Campaigns</span>
          </button>

          <h1 className="text-xl font-semibold text-warmGray-800">
            {campaign?.title} - Feedback
          </h1>
        </div>

        {/* Compact Stats */}
        {statistics && (
          <div className="bg-white rounded-lg border border-warmGray-200 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-warmGray-800">{evaluations.length}</p>
                <p className="text-sm text-warmGray-500">Feedback</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <p className="text-2xl font-bold text-warmGray-800">
                    {statistics.average_rating ? statistics.average_rating.toFixed(1) : 'N/A'}
                  </p>
                  {statistics.average_rating && (
                    <div className="flex items-center ml-2">
                      {renderStars(Math.round(statistics.average_rating))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-warmGray-500">Avg Rating</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-warmGray-800">{statistics.response_rate || 0}%</p>
                <p className="text-sm text-warmGray-500">Response Rate</p>
              </div>
            </div>
          </div>
        )}

        {/* Individual Evaluations */}
        <div className="bg-white rounded-xl border border-warmGray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-warmGray-800 mb-4">
            Individual Feedback
          </h2>
          
          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-warmGray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-warmGray-600 mb-2">No feedback yet</h3>
              <p className="text-warmGray-500">Evaluations will appear here once participants submit their feedback.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="bg-warmGray-50 border border-warmGray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-warmGray-800 mb-1">
                        {evaluation.employee_name}
                      </h4>
                      <p className="text-sm text-warmGray-600">
                        Coffee meeting with {evaluation.partner_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-warmGray-500">
                        {formatDate(evaluation.submitted_at)}
                      </p>
                    </div>
                  </div>
                  
                  {evaluation.rating && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        {renderStars(evaluation.rating)}
                        <span className="text-sm font-medium text-warmGray-700">
                          ({evaluation.rating}/5)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {evaluation.comment && (
                    <div className="bg-white rounded-lg p-4 border border-warmGray-200">
                      <p className="text-warmGray-700 text-sm leading-relaxed italic">
                        "{evaluation.comment}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignEvaluationsView;
