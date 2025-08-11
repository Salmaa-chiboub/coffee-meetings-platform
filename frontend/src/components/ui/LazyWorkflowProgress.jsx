import React from 'react';
import {
  DocumentTextIcon,
  UserGroupIcon,
  CheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const LazyWorkflowProgress = ({ workflowState, completedSteps }) => {
  const workflowSteps = [
    { step: 'Campagne Créée', icon: DocumentTextIcon, color: 'blue-600' },
    { step: 'Employés Ajoutés', icon: UserGroupIcon, color: 'green-600' },
    { step: 'Critères Définis', icon: ChartBarIcon, color: 'purple-600' },
    { step: 'Paires Générées', icon: UserGroupIcon, color: 'yellow-600' },
    { step: 'Invitations Envoyées', icon: CheckIcon, color: 'pink-600' }
  ];

  return (
    <div className="bg-white rounded-xl border border-warmGray-200 p-4 sm:p-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-warmGray-900">Progression du Workflow</h3>
        <span className="text-xs sm:text-sm text-warmGray-500 self-start sm:self-auto">
          {completedSteps}/5 étapes terminées
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {workflowSteps.map((item, index) => {
          const isCompleted = workflowState?.completed_steps?.includes(index + 1);
          const IconComponent = item.icon;
          return (
            <div key={index} className="text-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-warmGray-200 flex items-center justify-center mx-auto mb-2 transition-all duration-200 ${
                isCompleted ? 'bg-green-100 border-green-200' : 'bg-warmGray-50'
              }`}>
                {isCompleted ? (
                  <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                ) : (
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-warmGray-400" />
                )}
              </div>
              <p className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                isCompleted ? 'text-green-800' : 'text-warmGray-500'
              }`}>
                {item.step}
              </p>
              {isCompleted && (
                <div className="w-6 h-0.5 bg-green-500 mx-auto mt-1 rounded-full opacity-75"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LazyWorkflowProgress;
