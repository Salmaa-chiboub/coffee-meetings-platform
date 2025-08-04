import React, { useRef, useCallback } from 'react';
import { useInfiniteCampaigns } from '../hooks/useCampaigns';
import { useInView } from 'react-intersection-observer';

export const CampaignList = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading,
    isError,
    error 
  } = useInfiniteCampaigns();

  // Intersection Observer pour le infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  // Charger plus de données quand l'élément devient visible
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-4">
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.results.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
            />
          ))}
        </React.Fragment>
      ))}
      
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <div>Chargement de plus de campagnes...</div>}
      </div>
    </div>
  );
};

const CampaignCard = ({ campaign }) => {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold">{campaign.title}</h3>
      <p className="text-gray-600">{campaign.description}</p>
      <div className="mt-2 flex justify-between text-sm text-gray-500">
        <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
        <span>{campaign.employee_count} employés</span>
        <span>{campaign.pairs_count} paires</span>
      </div>
      {campaign.workflow_state && (
        <div className="mt-2 flex items-center">
          <div className="h-2 flex-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${(campaign.workflow_state.completed_steps.length / 5) * 100}%`
              }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">
            Étape {campaign.workflow_state.current_step}/5
          </span>
        </div>
      )}
    </div>
  );
};
