import React from 'react';
import { 
  CheckCircleIcon, 
  DocumentTextIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const StepNavigation = ({ currentStep, completedSteps = [], onStepClick, campaignCompleted = false }) => {
  const steps = [
    {
      id: 1,
      title: 'Campaign Created',
      icon: DocumentTextIcon,
      description: 'Campaign details defined'
    },
    {
      id: 2,
      title: 'Upload Employees',
      icon: CloudArrowUpIcon,
      description: 'Import employee data'
    },
    {
      id: 3,
      title: 'Define Criteria',
      icon: Cog6ToothIcon,
      description: 'Set matching rules'
    },
    {
      id: 4,
      title: 'Generate Pairs',
      icon: UserGroupIcon,
      description: 'Create employee pairs'
    },
    {
      id: 5,
      title: 'Finalize & Send',
      icon: PaperAirplaneIcon,
      description: 'Confirm and notify'
    }
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

  const getStepStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          container: 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100',
          icon: 'text-green-600',
          title: 'text-green-800',
          description: 'text-green-600',
          connector: 'bg-green-300'
        };
      case 'current':
        return {
          container: 'bg-[#E8C4A0]/20 border-[#E8C4A0] ring-2 ring-[#E8C4A0]/30',
          icon: 'text-[#8B6F47]',
          title: 'text-[#8B6F47] font-semibold',
          description: 'text-[#8B6F47]',
          connector: 'bg-warmGray-300'
        };
      case 'accessible':
        return {
          container: 'bg-white border-warmGray-300 cursor-pointer hover:bg-warmGray-50',
          icon: 'text-warmGray-500',
          title: 'text-warmGray-700',
          description: 'text-warmGray-500',
          connector: 'bg-warmGray-300'
        };
      case 'pending':
      default:
        return {
          container: 'bg-warmGray-50 border-warmGray-200',
          icon: 'text-warmGray-400',
          title: 'text-warmGray-500',
          description: 'text-warmGray-400',
          connector: 'bg-warmGray-200'
        };
    }
  };

  const handleStepClick = (stepId, status) => {
    // Disable navigation if campaign is completed
    if (campaignCompleted) {
      return;
    }

    if ((status === 'accessible' || status === 'completed') && onStepClick) {
      onStepClick(stepId);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-warmGray-800">Campaign Workflow</h2>
        {campaignCompleted && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
            ✅ Completed
          </span>
        )}
      </div>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-warmGray-200 hidden md:block">
          <div 
            className="h-full bg-[#E8C4A0] transition-all duration-500"
            style={{ 
              width: `${((Math.max(...completedSteps, 0)) / 5) * 100}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const styles = getStepStyles(status);
            const IconComponent = step.icon;
            const isCompleted = status === 'completed';
            const isClickable = !campaignCompleted && (status === 'accessible' || status === 'completed');

            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.id, status)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  ${styles.container}
                  ${isClickable ? 'transform hover:scale-105' : ''}
                `}
              >
                {/* Step Number/Icon */}
                <div className="flex items-center justify-center mb-3">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-green-100' : 'bg-cream'}
                  `}>
                    {isCompleted ? (
                      <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
                    ) : (
                      <IconComponent className={`h-6 w-6 ${styles.icon}`} />
                    )}
                  </div>
                </div>

                {/* Step Content */}
                <div className="text-center">
                  <h3 className={`text-sm font-medium mb-1 ${styles.title}`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs ${styles.description}`}>
                    {step.description}
                  </p>
                </div>

                {/* Step Number Badge */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border-2 border-warmGray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-warmGray-600">
                    {step.id}
                  </span>
                </div>

                {/* Connector Line for Mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-warmGray-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t border-warmGray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-warmGray-600">
            Progress: {completedSteps.length} of 5 steps completed
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-warmGray-200 rounded-full h-2">
              <div 
                className="bg-[#E8C4A0] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.length / 5) * 100}%` }}
              />
            </div>
            <span className="text-warmGray-600 font-medium">
              {Math.round((completedSteps.length / 5) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepNavigation;
