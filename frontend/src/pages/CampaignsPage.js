import React from 'react';
import { CampaignList } from '../components/CampaignList';
import { usePerformanceMonitoring, useRenderTiming } from '../hooks/usePerformanceMonitoring';

export const CampaignsPage = () => {
  // Monitoring des performances
  const { logError } = usePerformanceMonitoring('campaigns');
  useRenderTiming('CampaignsPage');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes Campagnes</h1>
      
      <ErrorBoundary onError={logError}>
        <CampaignList />
      </ErrorBoundary>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Une erreur s'est produite lors du chargement des campagnes.
          <button 
            onClick={() => window.location.reload()} 
            className="ml-4 text-sm underline"
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
