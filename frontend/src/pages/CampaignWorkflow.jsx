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
  
  // State management
  const [campaign, setCampaign] = useState(null);
  const [workflowState, setWorkflowState] = useState(null);
  const [currentStep, setCurrentStep] = useState(2); // Start from step 2 (Excel Upload)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignCompleted, setCampaignCompleted] = useState(false);

  // Load campaign and workflow state
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load campaign details
        const campaignData = await campaignService.getCampaign(campaignId);
        setCampaign(campaignData);
        
        // Load workflow state
        const workflowData = await workflowService.getCampaignWorkflowStatus(campaignId);
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
                  <p className="text-warmGray-600">Invalid step</p>
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
            Back to Campaigns
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
            <span>Back to Campaigns</span>
          </button>
        </div>

        {/* Campaign Title in Header */}
        {campaign && (
          <div className="text-right">
            <h1 className="text-xl font-bold text-warmGray-800">
              {campaign.title}
            </h1>
            <div className="flex items-center space-x-4 text-xs text-warmGray-500 mt-0.5">
              <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
              <span>→</span>
              <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
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
