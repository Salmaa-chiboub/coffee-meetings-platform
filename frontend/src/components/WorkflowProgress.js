import React from 'react';
import { useWorkflowStatus } from '../hooks/useCampaigns';

const workflowSteps = [
  { id: 1, title: 'Créer la campagne' },
  { id: 2, title: 'Charger les employés' },
  { id: 3, title: 'Définir les critères' },
  { id: 4, title: 'Générer les paires' },
  { id: 5, title: 'Confirmer et envoyer' },
];

export const WorkflowProgress = ({ campaignId }) => {
  const { 
    data: workflowStatus,
    isLoading,
    isError,
    error 
  } = useWorkflowStatus(campaignId);

  if (isLoading) return <div>Chargement du workflow...</div>;
  if (isError) return <div>Erreur: {error.message}</div>;

  const completedSteps = workflowStatus?.completed_steps || [];
  const currentStep = workflowStatus?.current_step || 1;

  return (
    <div className="py-4">
      <div className="relative">
        {/* Ligne de progression */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all"
          style={{ 
            width: `${((currentStep - 1) / (workflowSteps.length - 1)) * 100}%`
          }}
        />

        {/* Étapes */}
        <div className="relative flex justify-between">
          {workflowSteps.map((step) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center ${
                step.id === currentStep
                  ? 'text-blue-600'
                  : completedSteps.includes(step.id)
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.id === currentStep
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-100 border-2 border-green-600'
                    : 'bg-gray-100 border-2 border-gray-400'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <span className="mt-2 text-xs text-center">{step.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 13l4 4L19 7" 
    />
  </svg>
);
