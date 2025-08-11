import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import MinimalStepNavigation from '../components/workflow/MinimalStepNavigation';
import { workflowService, WORKFLOW_STEPS } from '../services/workflowService';
import { campaignService } from '../services/campaignService';
import { SkeletonWorkflow } from '../components/ui/Skeleton';
import '../styles/workflow-animations.css';

// Lazy load step components
const ExcelUpload = lazy(() => import('../components/workflow/ExcelUpload'));
const CriteriaSelection = lazy(() => import('../components/workflow/CriteriaSelection'));
const PairGeneration = lazy(() => import('../components/workflow/PairGeneration'));
const Finalization = lazy(() => import('../components/workflow/Finalization'));

const CampaignWorkflow = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();

  console.log('🔍 CampaignWorkflow - Campaign ID from params:', campaignId);

  // Safe date formatting function
  const formatCampaignDate = (dateString) => {
    console.log('🔍 formatCampaignDate: Input:', { dateString, type: typeof dateString });

    if (!dateString) {
      console.warn('⚠️ formatCampaignDate: No date provided');
      return 'N/A';
    }

    try {
      // Handle different date formats
      let date;

      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try parsing the string
        date = new Date(dateString);
      } else {
        console.warn('⚠️ formatCampaignDate: Unexpected date type:', typeof dateString);
        return 'Invalid Date';
      }

      if (isNaN(date.getTime())) {
        console.warn('⚠️ formatCampaignDate: Invalid date after parsing:', dateString);
        return 'Invalid Date';
      }

      const formatted = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      console.log('✅ formatCampaignDate: Successfully formatted:', { input: dateString, output: formatted });
      return formatted;
    } catch (error) {
      console.error('❌ formatCampaignDate: Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  // Redirect to campaigns list if no valid campaign ID
  useEffect(() => {
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
      console.log('❌ Invalid campaign ID detected:', campaignId);
      console.log('💡 This can happen if you refresh the page or access the URL directly');
      console.log('🔄 Redirecting to campaigns list...');

      // Add a small delay to prevent immediate redirect in case of React double-rendering
      const timer = setTimeout(() => {
        navigate('/app/campaigns', { replace: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [campaignId, navigate]);
  
  // State management
  const [campaign, setCampaign] = useState(null);
  const [workflowState, setWorkflowState] = useState(null);
  const [currentStep, setCurrentStep] = useState(2); // Start from step 2 (Excel Upload)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignCompleted, setCampaignCompleted] = useState(false);

  // Load campaign and workflow state
  useEffect(() => {
    // Don't load data if campaign ID is invalid
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔍 CampaignWorkflow.loadData: Starting data load for campaign:', campaignId);

        // Check authentication state before making API calls
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        console.log('🔍 CampaignWorkflow.loadData: Auth state:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          campaignId
        });

        // Load campaign details
        console.log('🔍 CampaignWorkflow.loadData: Loading campaign details...');
        const campaignResponse = await campaignService.getCampaign(campaignId);
        console.log('🔍 CampaignWorkflow.loadData: Campaign response:', campaignResponse);

        // Extract campaign data from the response
        const campaignData = campaignResponse.success ? campaignResponse.data : campaignResponse;
        console.log('🔍 CampaignWorkflow.loadData: Extracted campaign data:', campaignData);
        console.log('🔍 CampaignWorkflow.loadData: Date values:', {
          start_date: campaignData?.start_date,
          end_date: campaignData?.end_date,
          start_date_type: typeof campaignData?.start_date,
          end_date_type: typeof campaignData?.end_date
        });
        setCampaign(campaignData);

        // Load workflow state
        console.log('🔍 CampaignWorkflow.loadData: Loading workflow state...');
        const workflowData = await workflowService.getCampaignWorkflowStatus(campaignId);
        console.log('🔍 CampaignWorkflow.loadData: Workflow data loaded:', workflowData);
        setWorkflowState(workflowData);

        // Set current step based on workflow state
        // If step 5 is completed, ensure we stay on step 5
        const isStep5Completed = workflowData.completed_steps.includes(5);
        if (isStep5Completed) {
          setCurrentStep(5);
        } else {
          setCurrentStep(workflowData.current_step);
        }

        // Check if campaign is completed (step 5 completed)
        const isCompleted = isStep5Completed && workflowData.step_data['5']?.campaign_completed;
        setCampaignCompleted(isCompleted);

      } catch (err) {
        console.error('❌ CampaignWorkflow.loadData: Error loading data:', err);

        // Check if it's an authentication error
        if (err.message?.includes('Authentication') || err.message?.includes('401') || err.status === 401) {
          console.error('❌ CampaignWorkflow.loadData: Authentication error detected, redirecting to login');
          navigate('/login');
          return;
        }

        setError(err.message || 'Failed to load campaign data');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      loadData();
    }
  }, [campaignId]);

  // Handle step navigation
  const handleStepChange = async (stepNumber) => {
    try {
      // Validate step access
      const validation = await workflowService.validateWorkflowStep(campaignId, stepNumber);
      
      if (!validation.can_access) {
        setError(`Cannot access step ${stepNumber}. Please complete previous steps first.`);
        return;
      }
      
      setCurrentStep(stepNumber);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to navigate to step');
    }
  };

  // Handle step completion
  const handleStepComplete = async (stepNumber, stepData = {}) => {
    try {
      const updatedWorkflow = await workflowService.updateWorkflowStep(
        campaignId, 
        stepNumber, 
        true, 
        stepData
      );
      
      setWorkflowState(updatedWorkflow);

      // Check if campaign is completed after this step
      if (stepNumber === 5 && stepData.campaign_completed) {
        setCampaignCompleted(true);
      }

      // Move to next step if not at the end
      if (stepNumber < 5) {
        setCurrentStep(stepNumber + 1);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to complete step');
    }
  };

  // Handle going back to previous step
  const handlePreviousStep = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle going back to campaigns list
  const handleBackToCampaigns = () => {
    navigate('/app/campaigns');
  };

  // Step loading component
  const StepLoader = () => (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-warmGray-200 p-8 shadow-md">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-warmGray-200 rounded-full mx-auto animate-pulse"></div>
            <div className="w-64 h-8 bg-warmGray-200 rounded mx-auto animate-pulse"></div>
            <div className="w-96 h-4 bg-warmGray-200 rounded mx-auto animate-pulse"></div>
            <div className="w-32 h-10 bg-warmGray-200 rounded mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    const stepProps = {
      campaignId,
      campaign,
      workflowState,
      onComplete: handleStepComplete,
      onError: setError,
    };

    return (
      <Suspense fallback={<StepLoader />}>
        {(() => {
          switch (currentStep) {
            case WORKFLOW_STEPS.UPLOAD_EMPLOYEES:
              return <ExcelUpload {...stepProps} />;
            case WORKFLOW_STEPS.DEFINE_CRITERIA:
              return <CriteriaSelection {...stepProps} />;
            case WORKFLOW_STEPS.GENERATE_PAIRS:
              return <PairGeneration {...stepProps} />;
            case WORKFLOW_STEPS.CONFIRM_SEND:
              return <Finalization {...stepProps} />;
            default:
              return (
                <div className="text-center py-12">
                  <p className="text-warmGray-600">Étape invalide</p>
                </div>
              );
          }
        })()}
      </Suspense>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-32 h-5 bg-warmGray-200 rounded animate-pulse"></div>
          <div className="text-right">
            <div className="w-48 h-6 bg-warmGray-200 rounded animate-pulse mb-1"></div>
            <div className="w-32 h-3 bg-warmGray-100 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Step Navigation Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-4">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center space-y-1">
                <div className="w-10 h-10 bg-warmGray-200 rounded-full animate-pulse"></div>
                <div className="w-12 h-3 bg-warmGray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <SkeletonWorkflow />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleBackToCampaigns}
            className="mt-4 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-full transition-all duration-200"
          >
            Retour aux Campagnes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToCampaigns}
            className="flex items-center space-x-2 text-warmGray-600 hover:text-warmGray-800 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Retour aux Campagnes</span>
          </button>
        </div>

        {/* Campaign Title in Header */}
        {campaign && (
          <div className="text-right">
            <h1 className="text-xl font-bold text-warmGray-800">
              {campaign.title}
            </h1>
            <div className="flex items-center space-x-4 text-xs text-warmGray-500 mt-0.5">
              <span>{formatCampaignDate(campaign.start_date)}</span>
              <span>→</span>
              <span>{formatCampaignDate(campaign.end_date)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step Navigation */}
      {workflowState && (
        <MinimalStepNavigation
          currentStep={currentStep}
          completedSteps={workflowState.completed_steps}
          onStepClick={handleStepChange}
          campaignCompleted={campaignCompleted}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="transition-all duration-500 ease-in-out">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {!campaignCompleted && (
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep <= 2}
            className="flex items-center space-x-2 px-4 py-2 border border-warmGray-300 hover:border-warmGray-400 text-warmGray-600 hover:text-warmGray-800 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </button>
        </div>
      )}


    </div>
  );
};

export default CampaignWorkflow;
