import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

const MinimalStepNavigation = ({ 
  currentStep, 
  completedSteps = [], 
  onStepClick, 
  campaignCompleted = false 
}) => {
  const steps = [
    { id: 1, title: 'Campagne' },
    { id: 2, title: 'Upload' },
    { id: 3, title: 'Critères' },
    { id: 4, title: 'Paires' },
    { id: 5, title: 'Envoi' }
  ];

  const getStepStatus = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return 'completed';
    } else if (stepId === currentStep) {
      return 'current';
    } else if (stepId < currentStep || completedSteps.some(completed => completed > stepId)) {
      return 'accessible';
    } else {
      return 'pending';
    }
  };

  // Removed click functionality - steps are now purely visual

  const getStepStyles = (status, stepId) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white shadow-xl shadow-green-500/30',
          title: 'text-green-600 font-semibold'
        };
      case 'current':
        return {
          circle: 'bg-gradient-to-br from-[#E8C4A0] to-[#DDB892] border-[#D4A574] text-[#8B6F47] shadow-xl shadow-[#E8C4A0]/40 ring-4 ring-[#E8C4A0]/25',
          title: 'text-[#8B6F47] font-bold'
        };
      case 'accessible':
        return {
          circle: 'bg-gradient-to-br from-white to-warmGray-50 border-warmGray-300 text-warmGray-600 shadow-md',
          title: 'text-warmGray-600 font-medium'
        };
      case 'pending':
      default:
        return {
          circle: 'bg-gradient-to-br from-warmGray-100 to-warmGray-200 border-warmGray-300 text-warmGray-400 shadow-sm',
          title: 'text-warmGray-400'
        };
    }
  };

  const getConnectorStyles = (stepId) => {
    if (stepId >= steps.length) return '';
    
    const nextStepCompleted = completedSteps.includes(stepId + 1);
    const currentStepCompleted = completedSteps.includes(stepId);
    
    if (nextStepCompleted || (currentStepCompleted && stepId + 1 === currentStep)) {
      return 'bg-green-500';
    } else if (stepId < currentStep) {
      return 'bg-[#E8C4A0]';
    } else {
      return 'bg-warmGray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-6">
      {/* Progress Bar */}
      <div className="relative">
        {/* Background Line - stops before last step */}
        <div
          className="absolute top-5 h-1 bg-warmGray-200 rounded-full"
          style={{
            left: '20px',
            right: '20px',
            width: 'calc(100% - 40px - 80px)' // Stops before last circle
          }}
        ></div>

        {/* Progress Line - modern gradient */}
        <div
          className="absolute top-5 h-1 bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] rounded-full transition-all duration-700 ease-out"
          style={{
            left: '20px',
            width: `${Math.min(((Math.max(...completedSteps, currentStep - 1)) / (steps.length - 1)) * (100 - 8), 100 - 8)}%`
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const styles = getStepStyles(status, step.id);
            
            return (
              <div
                key={step.id}
                className="flex flex-col items-center space-y-1"
              >
                {/* Step Circle */}
                <div
                  className={`
                    w-12 h-12 rounded-full border-3 flex items-center justify-center
                    transition-all duration-500 relative
                    step-circle ${status}
                    ${styles.circle}
                  `}
                >
                  {status === 'completed' ? (
                    <CheckIcon className="h-6 w-6 drop-shadow-sm" />
                  ) : (
                    <span className="text-sm font-bold drop-shadow-sm">{step.id}</span>
                  )}

                  {/* Glow effect for current step */}
                  {status === 'current' && (
                    <div className="absolute inset-0 rounded-full bg-[#E8C4A0] opacity-20 animate-pulse"></div>
                  )}
                </div>

                {/* Step Title */}
                <span
                  className={`
                    text-xs transition-all duration-300 font-medium
                    ${styles.title}
                  `}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default MinimalStepNavigation;
