import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { matchingService } from '../../services/matchingService';
import { WORKFLOW_STEPS } from '../../services/workflowService';

const PairGeneration = ({ campaignId, onComplete, onError, workflowState }) => {
  const [pairs, setPairs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [pairStats, setPairStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if pairs already exist - now also refreshes when workflow state changes
  useEffect(() => {
    const checkExistingPairs = async () => {
      try {
        setLoading(true);
        const history = await matchingService.getMatchingHistory(campaignId);
        
        if (history.pairs && history.pairs.length > 0) {
          setPairs(history.pairs);
          setGenerated(true);
          setPairStats({
            total_generated: history.pairs.length,
            total_possible: history.total_possible || 0,
            criteria_used: history.criteria_used || []
          });
        }
      } catch (error) {
        // No existing pairs, that's fine
        console.log('No existing pairs found');
      } finally {
        setLoading(false);
      }
    };

    checkExistingPairs();
  }, [campaignId, workflowState]); // ✅ Now refreshes when workflow state changes

  // Generate pairs
  const handleGeneratePairs = async () => {
    try {
      setGenerating(true);
      onError(null);

      const result = await matchingService.generatePairs(campaignId);
      
      if (result.success) {
        setPairs(result.pairs || []);
        setPairStats({
          total_generated: result.total_generated || 0,
          total_possible: result.total_possible || 0,
          criteria_used: result.criteria_used || []
        });
        setGenerated(true);
      } else {
        onError(result.error || 'Failed to generate pairs');
      }
    } catch (error) {
      onError(error.message || 'Failed to generate pairs');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate pairs
  const handleRegeneratePairs = async () => {
    setGenerated(false);
    setPairs([]);
    setPairStats(null);
    await handleGeneratePairs();
  };

  // Confirm pairs and proceed
  const handleConfirmPairs = async () => {
    try {
      if (pairs.length === 0) {
        onError('No pairs to confirm. Please generate pairs first.');
        return;
      }

      await onComplete(WORKFLOW_STEPS.GENERATE_PAIRS, {
        pairs_count: pairs.length,
        total_possible: pairStats?.total_possible || 0,
        criteria_used: pairStats?.criteria_used || [],
        generation_timestamp: new Date().toISOString(),
        pairs: pairs.map(pair => ({
          employee1_id: pair.employee_1?.id || pair.employee1_id,
          employee2_id: pair.employee_2?.id || pair.employee2_id,
          employee1_name: pair.employee_1?.name || pair.employee1_name,
          employee2_name: pair.employee_2?.name || pair.employee2_name
        }))
      });
    } catch (error) {
      onError(error.message || 'Failed to confirm pairs');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6F47]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-warmGray-200 p-8 shadow-md">
          {/* Header avec icône et titre principal */}
          <div className="text-center mb-6">
            <UserGroupIcon className="h-12 w-12 text-[#E8C4A0] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-warmGray-800 mb-2">
              Generate Employee Pairs
            </h2>
            <p className="text-warmGray-600 text-sm">
              Create final coffee meeting pairs - each employee will be assigned to one pair
            </p>
          </div>

          {/* Generation Controls */}
          {!generated && (
            <div className="text-center mb-6">
              <button
                onClick={handleGeneratePairs}
                disabled={generating}
                className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none shadow-sm"
              >
                {generating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47]"></div>
                    <span>Creating Final Pairs...</span>
                  </div>
                ) : (
                  'Generate Final Pairs'
                )}
              </button>
            </div>
          )}

          {/* Success Notification - Compact */}
          {generated && pairStats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {pairStats.total_generated} pairs generated successfully
                  </span>
                </div>
                {pairStats.criteria_used && pairStats.criteria_used.length > 0 && (
                  <span className="text-xs text-green-600">
                    {pairStats.criteria_used.length} criteria applied
                  </span>
                )}
              </div>
            </div>
          )}



          {/* Pairs List */}
          {pairs.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-warmGray-800">
                  Generated Pairs ({pairs.length})
                </h3>
                <button
                  onClick={handleRegeneratePairs}
                  disabled={generating}
                  className="flex items-center space-x-2 px-4 py-2 border border-warmGray-300 hover:border-warmGray-400 text-warmGray-600 hover:text-warmGray-800 rounded-lg transition-all duration-200"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {pairs.map((pair, index) => (
                  <div key={index} className="bg-warmGray-50 border border-warmGray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-sm font-bold text-[#8B6F47]">{index + 1}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="font-medium text-warmGray-800">
                              {pair.employee_1?.name || pair.employee1_name || 'Unknown Employee'}
                            </p>
                          </div>
                          <div className="text-warmGray-400">
                            <span className="text-xl font-medium">×</span>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-warmGray-800">
                              {pair.employee_2?.name || pair.employee2_name || 'Unknown Employee'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {pair.matching_score && (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-700">
                              {Math.round(pair.matching_score * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">Match</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Pairs Generated */}
          {generated && pairs.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-yellow-800 mb-2">
                No Pairs Generated
              </h3>
              <p className="text-yellow-600 text-sm mb-4">
                Unable to generate pairs with current criteria. Try adjusting matching rules.
              </p>
              <button
                onClick={handleRegeneratePairs}
                className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Confirm Button */}
          {generated && pairs.length > 0 && (
            <div className="text-center pt-6 border-t border-warmGray-100">
              <button
                onClick={handleConfirmPairs}
                className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
              >
                Confirm Pairs & Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PairGeneration;
