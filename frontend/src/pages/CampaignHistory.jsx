import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { campaignService } from '../services/campaignService';
import { workflowService } from '../services/workflowService';
import { SkeletonCampaignHistory } from '../components/ui/Skeleton';
import { matchingService } from '../services/matchingService';

const CampaignHistory = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [workflowState, setWorkflowState] = useState(null);
  const [pairsData, setPairsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCampaignHistory = async () => {
      try {
        setLoading(true);
        
        // Load campaign details
        const campaignData = await campaignService.getCampaign(campaignId);
        setCampaign(campaignData);
        
        // Load workflow state
        const workflowData = await workflowService.getCampaignWorkflowStatus(campaignId);
        console.log('🔍 DEBUG: Workflow data:', workflowData);
        setWorkflowState(workflowData);
        
        // Load pairs data from multiple sources
        try {
          // Try to get confirmed pairs from history first
          const pairsHistory = await matchingService.getMatchingHistory(campaignId);
          console.log('🔍 DEBUG: Pairs history:', pairsHistory);

          if (pairsHistory.pairs && pairsHistory.pairs.length > 0) {
            console.log('✅ DEBUG: Using pairs from history');
            setPairsData(pairsHistory);
          } else {
            // Fallback to workflow state data (step 4)
            const step4Data = workflowData.step_data['4'];
            console.log('🔍 DEBUG: Step 4 data:', step4Data);

            if (step4Data && step4Data.pairs) {
              console.log('✅ DEBUG: Using pairs from workflow step 4');
              console.log('🔍 DEBUG: Step 4 pairs structure:', step4Data.pairs);
              setPairsData({
                pairs: step4Data.pairs,
                pairs_count: step4Data.pairs_count || step4Data.pairs.length,
                total_possible: step4Data.total_possible || 0,
                criteria_used: step4Data.criteria_used || []
              });
            } else {
              console.log('❌ DEBUG: No pairs found in step 4 data');
            }
          }
        } catch (pairsError) {
          console.warn('❌ DEBUG: Could not load pairs data:', pairsError);
          // Try to get from workflow state as fallback
          const step4Data = workflowData.step_data['4'];
          if (step4Data && step4Data.pairs) {
            console.log('✅ DEBUG: Using pairs from workflow step 4 (fallback)');
            setPairsData({
              pairs: step4Data.pairs,
              pairs_count: step4Data.pairs_count || step4Data.pairs.length,
              total_possible: step4Data.total_possible || 0,
              criteria_used: step4Data.criteria_used || []
            });
          }
        }
        
      } catch (err) {
        setError(err.message || 'Failed to load campaign history');
      } finally {
        // Add a small delay to see the skeleton (remove in production)
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    if (campaignId) {
      loadCampaignHistory();
    }
  }, [campaignId]);

  const handleBackToCampaigns = () => {
    navigate('/campaigns');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  if (loading) {
    return <SkeletonCampaignHistory />;
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
              Back to Campaigns
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
            <span>Back to Campaigns</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <span className="text-green-800 font-medium">Campaign Completed</span>
            </div>

            <button
              onClick={() => navigate(`/campaigns/${campaignId}/feedback`)}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] hover:from-[#DDB892] hover:to-[#D4A574] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>View Feedback</span>
            </button>
          </div>
        </div>

        {/* Campaign Overview Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-8 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-warmGray-800 mb-2">
              {campaign?.title}
            </h1>
            {campaign?.description && (
              <p className="text-warmGray-600 text-lg">
                {campaign.description}
              </p>
            )}
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-warmGray-500 mb-1">Duration</p>
              <p className="font-semibold text-warmGray-800">
                {campaign && `${formatDate(campaign.start_date)} - ${formatDate(campaign.end_date)}`}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-warmGray-500 mb-1">Participants</p>
              <p className="font-semibold text-warmGray-800">
                {workflowState?.step_data?.['2']?.employees_count || campaign?.employees_count || 0} employees
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <EnvelopeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-warmGray-500 mb-1">Pairs Created</p>
              <p className="font-semibold text-warmGray-800">
                {pairsData?.pairs_count || pairsData?.pairs?.length || 0} pairs
              </p>
            </div>
          </div>



          {/* Workflow Steps Summary */}
          <div className="border-t border-warmGray-200 pt-6">
            <h3 className="text-lg font-semibold text-warmGray-800 mb-4">Résumé du Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { id: 1, title: 'Campagne Créée', icon: DocumentTextIcon, color: 'blue' },
                { id: 2, title: 'Employés Téléchargés', icon: UserGroupIcon, color: 'green' },
                { id: 3, title: 'Critères Définis', icon: Cog6ToothIcon, color: 'purple' },
                { id: 4, title: 'Paires Générées', icon: UserGroupIcon, color: 'orange' },
                { id: 5, title: 'Invitations Envoyées', icon: EnvelopeIcon, color: 'pink' }
              ].map((step) => {
                const isCompleted = workflowState?.completed_steps?.includes(step.id);
                const IconComponent = step.icon;
                
                return (
                  <div key={step.id} className="text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      isCompleted 
                        ? 'bg-green-100' 
                        : 'bg-warmGray-100'
                    }`}>
                      {isCompleted ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <IconComponent className="h-5 w-5 text-warmGray-400" />
                      )}
                    </div>
                    <p className={`text-xs font-medium ${
                      isCompleted ? 'text-green-800' : 'text-warmGray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pairs Details */}
        {pairsData && pairsData.pairs && pairsData.pairs.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-warmGray-800 mb-4">
              Generated Pairs ({pairsData.pairs.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pairsData.pairs.map((pair, index) => {
                console.log(`🔍 DEBUG: Pair ${index + 1} structure:`, pair);
                return (
                <div key={index} className="bg-warmGray-50/70 backdrop-blur-sm border border-warmGray-100/50 rounded-lg p-4 hover:bg-warmGray-50/90 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[#8B6F47]">{index + 1}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="font-medium text-warmGray-800 text-sm">
                            {pair.employee_1?.name ||
                             pair.employee1_name ||
                             pair.employee1?.name ||
                             pair.employee_1_name ||
                             `Employee ${pair.employee1_id || pair.employee_1_id || '1'}`}
                          </p>
                        </div>
                        <div className="text-warmGray-400">
                          <span className="text-lg font-medium">×</span>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-warmGray-800 text-sm">
                            {pair.employee_2?.name ||
                             pair.employee2_name ||
                             pair.employee2?.name ||
                             pair.employee_2_name ||
                             `Employee ${pair.employee2_id || pair.employee_2_id || '2'}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    {pair.matching_score && (
                      <div className="text-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700">
                            {Math.round(pair.matching_score * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Applied Criteria */}
        {pairsData?.criteria_used && pairsData.criteria_used.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-warmGray-800 mb-4">Applied Matching Criteria</h3>
            <div className="flex flex-wrap gap-2">
              {pairsData.criteria_used.map((criteria, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                >
                  {criteria.attribute_key}: {criteria.rule === 'same' ? 'Same' : 'Different'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignHistory;
