import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { normalizeData, hasDataChanged } from '../utils/dataNormalization';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gestionnaire d'erreur global pour axios
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Clés de cache pour React Query
export const queryKeys = {
  campaigns: 'campaigns',
  campaignDetail: (id) => ['campaign', id],
  workflowStatus: (id) => ['workflow', id],
  employees: (campaignId) => ['employees', campaignId],
};

// Hook optimisé pour les campagnes avec mise en cache intelligente
export const useCampaigns = (options = {}) => {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: [queryKeys.campaigns],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/campaigns/aggregated_campaigns/', {
        params: { page: pageParam }
      });
      return normalizeData(data.results);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    // Éviter les re-rendus inutiles
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      flatData: data.pages.reduce((acc, page) => ({
        campaigns: { ...acc.campaigns, ...page.campaigns },
        workflows: { ...acc.workflows, ...page.workflows },
        employees: { ...acc.employees, ...page.employees },
        pairs: { ...acc.pairs, ...page.pairs },
      }), { campaigns: {}, workflows: {}, employees: {}, pairs: {} }),
    }),
    // Options de cache optimisées
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// Hook optimisé pour le détail d'une campagne
export const useCampaignDetail = (id, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.campaignDetail(id),
    queryFn: async () => {
      // Vérifier si les données sont déjà en cache
      const cachedData = queryClient.getQueryData(queryKeys.campaigns);
      if (cachedData?.flatData?.campaigns[id]) {
        return cachedData.flatData.campaigns[id];
      }

      const { data } = await api.get(`/campaigns/${id}/`);
      return normalizeData([data]).campaigns[id];
    },
    // Éviter les requêtes inutiles
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Hook optimisé pour le statut du workflow
export const useWorkflowStatus = (campaignId) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.workflowStatus(campaignId),
    queryFn: async () => {
      // Vérifier le cache
      const cachedData = queryClient.getQueryData(queryKeys.campaigns);
      if (cachedData?.flatData?.workflows[campaignId]) {
        return cachedData.flatData.workflows[campaignId];
      }

      const { data } = await api.get(`/campaigns/${campaignId}/workflow-status/`);
      return data;
    },
    enabled: !!campaignId,
    staleTime: 60 * 1000, // 1 minute pour les workflows
  });
};

// Préchargement intelligent des données
export const preFetchCampaignData = async (queryClient, campaignId) => {
  await Promise.all([
    queryClient.prefetchQuery(queryKeys.campaignDetail(campaignId)),
    queryClient.prefetchQuery(queryKeys.workflowStatus(campaignId)),
  ]);
};
