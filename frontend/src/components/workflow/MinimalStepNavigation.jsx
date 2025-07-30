import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

const MinimalStepNavigation = ({ 
  currentStep, 
  completedSteps = [], 
  onStepClick, 
  campaignCompleted = false 
}) => {
  const steps = [
    { id: 1, title: 'Campaign' },
    { id: 2, title: 'Upload' },
    { id: 3, title: 'Criteria' },
    { id: 4, title: 'Pairs' },
    { id: 5, title: 'Send' }
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

  const handleStepClick = (stepId, status) => {
    if (campaignCompleted) return;
    
    if ((status === 'accessible' || status === 'completed') && onStepClick) {
      onStepClick(stepId);
    }
  };

  const getStepStyles = (status, stepId) => {
    const isClickable = !campaignCompleted && (status === 'accessible' || status === 'completed');
    
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-500 border-green-500 text-white shadow-lg',
          title: 'text-green-600 font-medium',
          clickable: isClickable
        };
      case 'current':
        return {
          circle: 'bg-[#E8C4A0] border-[#E8C4A0] text-[#8B6F47] shadow-lg ring-4 ring-[#E8C4A0]/20',
          title: 'text-[#8B6F47] font-semibold',
          clickable: false
        };
      case 'accessible':
        return {
          circle: 'bg-white border-warmGray-300 text-warmGray-600 hover:border-[#E8C4A0] hover:text-[#8B6F47]',
          title: 'text-warmGray-600 hover:text-[#8B6F47]',
          clickable: isClickable
        };
      case 'pending':
      default:
        return {
          circle: 'bg-warmGray-100 border-warmGray-200 text-warmGray-400',
          title: 'text-warmGray-400',
          clickable: false
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
    <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-4">

      {/* Progress Bar */}
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-warmGray-200 rounded-full"></div>

        {/* Progress Line */}
        <div
          className="absolute top-5 left-5 h-0.5 bg-[#E8C4A0] progress-fill rounded-full"
          style={{
            width: `${((Math.max(...completedSteps, currentStep - 1)) / (steps.length - 1)) * 100}%`
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
                <button
                  onClick={() => handleStepClick(step.id, status)}
                  disabled={!styles.clickable}
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center
                    step-circle ${status}
                    ${styles.circle}
                    ${styles.clickable ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {status === 'completed' ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-xs font-semibold">{step.id}</span>
                  )}
                </button>

                {/* Step Title */}
                <span
                  className={`
                    text-xs transition-all duration-300
                    ${styles.title}
                    ${styles.clickable ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => styles.clickable && handleStepClick(step.id, status)}
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
