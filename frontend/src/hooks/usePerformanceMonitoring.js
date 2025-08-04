import { useEffect } from 'react';
import { performanceMonitor } from './performanceMonitor';

export const usePerformanceMonitoring = (pageName) => {
  useEffect(() => {
    // Enregistrer le chargement de la page
    performanceMonitor.logPageLoad(pageName);

    // Observer les erreurs React
    const errorHandler = (error) => {
      performanceMonitor.logError(error, {
        page: pageName,
        component: error?.source?.tagName || 'Unknown',
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', errorHandler);
    };
  }, [pageName]);

  return {
    logError: performanceMonitor.logError.bind(performanceMonitor),
    logApiCall: performanceMonitor.logApiCall.bind(performanceMonitor),
  };
};

// Hook pour mesurer les temps de rendu des composants
export const useRenderTiming = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      performanceMonitor.logApiCall(
        `component_render_${componentName}`,
        duration,
        'success'
      );
    };
  }, [componentName]);
};
