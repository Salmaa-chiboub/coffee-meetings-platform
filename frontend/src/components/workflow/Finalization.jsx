import React, { useState, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { matchingService } from '../../services/matchingService';
import { WORKFLOW_STEPS } from '../../services/workflowService';

const Finalization = ({ campaignId, campaign, workflowState, onComplete, onError }) => {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pairsSummary, setPairsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load pairs summary
  useEffect(() => {
    const loadPairsSummary = async () => {
      try {
        setLoading(true);
        
        // Get step data from workflow state
        const stepData = workflowState?.step_data;
        const pairsData = stepData?.[WORKFLOW_STEPS.GENERATE_PAIRS];
        const finalizationData = stepData?.[WORKFLOW_STEPS.CONFIRM_SEND];

        if (pairsData) {
          setPairsSummary({
            pairs_count: pairsData.pairs_count || 0,
            total_possible: pairsData.total_possible || 0,
            criteria_used: pairsData.criteria_used || [],
            pairs: pairsData.pairs || []
          });
        } else {
          // Fallback: try to get from matching history
          const history = await matchingService.getMatchingHistory(campaignId);
          setPairsSummary({
            pairs_count: history.pairs?.length || 0,
            total_possible: history.total_possible || 0,
            criteria_used: history.criteria_used || [],
            pairs: history.pairs || []
          });
        }

        // Check if step 5 (finalization) is already completed
        const isStep5Completed = workflowState?.completed_steps?.includes(WORKFLOW_STEPS.CONFIRM_SEND);
        if (isStep5Completed && (finalizationData?.campaign_completed || finalizationData)) {
          setConfirmed(true);
        }

      } catch (error) {
        onError('Failed to load pairs summary');
      } finally {
        setLoading(false);
      }
    };

    loadPairsSummary();
  }, [campaignId, workflowState, onError]);

  // Confirm and send pairs
  const handleConfirmAndSend = async () => {
    try {
      setConfirming(true);
      onError(null);

      // Check if already confirmed to prevent multiple confirmations
      if (confirmed) {
        console.log('Campaign already confirmed, skipping...');
        return;
      }

      // Confirm pairs with backend
      const result = await matchingService.confirmPairs(campaignId, pairsSummary?.pairs || []);
      
      if (result.success) {
        setConfirmed(true);
        
        // Complete the workflow
        await onComplete(WORKFLOW_STEPS.CONFIRM_SEND, {
          confirmed_pairs: result.confirmed_pairs || pairsSummary?.pairs_count || 0,
          emails_sent: result.emails_sent || 0,
          confirmation_timestamp: new Date().toISOString(),
          campaign_completed: true
        });
      } else {
        onError(result.error || 'Échec de la confirmation des paires');
      }
    } catch (error) {
      onError(error.message || 'Échec de la confirmation et de l\'envoi des paires');
    } finally {
      setConfirming(false);
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

  if (confirmed) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl border border-warmGray-200 p-6 shadow-md text-center">
            {/* Success Icon and Title */}
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-6">
              Campagne Terminée avec Succès !
            </h2>

            {/* Compact Statistics */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-green-800">{pairsSummary?.pairs_count || 0}</p>
                  <p className="text-sm text-green-600">Paires Confirmées</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-800">{(pairsSummary?.pairs_count || 0) * 2}</p>
                  <p className="text-sm text-green-600">Emails Envoyés</p>
                </div>
              </div>
            </div>

            {/* Next Steps - Compact */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Suivant :</span> Les employés recevront des invitations et pourront donner leur avis après leurs rencontres.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => window.location.href = '/app/campaigns'}
              className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
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
      <div className="max-w-full mx-auto px-4">
        <div className="bg-white rounded-xl border border-warmGray-200 p-6 shadow-md">
          {/* Header avec icône et titre principal */}
          <div className="text-center mb-6">
            <PaperAirplaneIcon className="h-12 w-12 text-[#E8C4A0] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-warmGray-800 mb-2">
              Finaliser et Envoyer les Invitations
            </h2>
            <p className="text-warmGray-600 text-sm">
              Examinez votre campagne et envoyez les invitations de rencontres café aux employés
            </p>
          </div>

          {/* Campaign Summary - Compact */}
          <div className="bg-warmGray-50 rounded-lg p-4 mb-6">
            <h3 className="text-base font-semibold text-warmGray-800 mb-3">Résumé de la Campagne</h3>
          
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-warmGray-800">{pairsSummary?.pairs_count || 0}</p>
                <p className="text-xs text-warmGray-600">Paires Finales</p>
              </div>
              <div>
                <p className="text-lg font-bold text-warmGray-800">{(pairsSummary?.pairs_count || 0) * 2}</p>
                <p className="text-xs text-warmGray-600">Employés</p>
              </div>
              <div>
                <p className="text-lg font-bold text-warmGray-800">{(pairsSummary?.pairs_count || 0) * 2}</p>
                <p className="text-xs text-warmGray-600">Emails à Envoyer</p>
              </div>
              <div>
                <p className="text-lg font-bold text-warmGray-800">{pairsSummary?.criteria_used?.length || 0}</p>
                <p className="text-xs text-warmGray-600">Critères Appliqués</p>
              </div>
            </div>
          </div>

          {/* Warning if no pairs */}
          {(!pairsSummary || pairsSummary.pairs_count === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Aucune paire disponible</p>
                  <p className="text-xs text-yellow-600">Veuillez d'abord générer les paires d'employés</p>
                </div>
              </div>
            </div>
          )}



          {/* Confirm Button */}
          <div className="text-center pt-6 border-t border-warmGray-100">
            <button
              onClick={handleConfirmAndSend}
              disabled={confirming || !pairsSummary || pairsSummary.pairs_count === 0}
              className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm"
            >
              {confirming ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47]"></div>
                  <span>Confirmation et envoi...</span>
                </div>
              ) : (
                'Confirmer et Envoyer les Invitations'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finalization;
