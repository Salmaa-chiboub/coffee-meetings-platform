import React, { useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useCampaigns, preFetchCampaignData } from '../hooks/useOptimizedQueries';
import { useQueryClient } from '@tanstack/react-query';
import { selectors } from '../utils/dataNormalization';

// Composant optimisé pour les cartes de campagne
const CampaignCard = React.memo(({ campaign, workflow }) => {
  const queryClient = useQueryClient();

  // Préchargement des données au hover
  const handleMouseEnter = useCallback(() => {
    preFetchCampaignData(queryClient, campaign.id);
  }, [queryClient, campaign.id]);

  return (
    <div
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={handleMouseEnter}
    >
      <h3 className="text-lg font-semibold">{campaign.title}</h3>
      <p className="text-gray-600">{campaign.description}</p>
      <div className="mt-2 flex justify-between text-sm text-gray-500">
        <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
        <span>{campaign.employee_count} employés</span>
        <span>{campaign.pairs_count} paires</span>
      </div>
      {workflow && (
        <div className="mt-2 flex items-center">
          <div className="h-2 flex-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${(workflow.completed_steps.length / 5) * 100}%`,
              }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">
            Étape {workflow.current_step}/5
          </span>
        </div>
      )}
    </div>
  );
});

// Liste optimisée des campagnes
export const OptimizedCampaignList = () => {
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useCampaigns();

  // Chargement de la page suivante quand on arrive en bas
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Memoization des données normalisées
  const normalizedData = useMemo(() => {
    if (!data) return null;
    
    return data.flatData;
  }, [data]);

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-4">
      {Object.values(normalizedData.campaigns).map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          workflow={normalizedData.workflows[campaign.workflow_state_id]}
        />
      ))}
      
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <div>Chargement de plus de campagnes...</div>}
      </div>
    </div>
  );
};

// Export du composant mémorisé
export default React.memo(OptimizedCampaignList);
