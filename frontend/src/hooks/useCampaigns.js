import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '../services/campaignService';

// Query keys
export const campaignKeys = {
  all: ['campaigns'],
  lists: () => [...campaignKeys.all, 'list'],
  list: (filters) => [...campaignKeys.lists(), { filters }],
  details: () => [...campaignKeys.all, 'detail'],
  detail: (id) => [...campaignKeys.details(), id],
  matches: (id) => [...campaignKeys.detail(id), 'matches'],
};

// Get all campaigns with enhanced caching and pagination support
export const useCampaigns = (params = {}) => {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignService.getCampaigns(params),
    // Enhanced caching for campaigns list
    staleTime: 30 * 1000, // 30s TTL for fresher data with short cache
    cacheTime: 5 * 60 * 1000, // 5 minutes in memory
    // Keep previous data while fetching new data (for pagination)
    keepPreviousData: true,
    // Refetch on mount only if data is stale
    refetchOnMount: 'stale',
    // Allow manual invalidation via queryClient.invalidateQueries
  });
};

// Get single campaign
export const useCampaign = (id) => {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignService.getCampaign(id),
    enabled: !!id,
  });
};

// Get campaign matches
export const useCampaignMatches = (campaignId) => {
  return useQuery({
    queryKey: campaignKeys.matches(campaignId),
    queryFn: () => campaignService.getCampaignMatches(campaignId),
    enabled: !!campaignId,
  });
};

// Create campaign mutation
export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignData) => {
      console.log('🔍 useCreateCampaign: Starting campaign creation...');

      // Check authentication state before making the request
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      console.log('🔍 useCreateCampaign: Auth tokens check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length
      });

      if (!accessToken && !refreshToken) {
        console.error('❌ useCreateCampaign: No authentication tokens found');
        throw new Error('Authentication required. Please log in again.');
      }

      try {
        const result = await campaignService.createCampaign(campaignData);
        console.log('✅ useCreateCampaign: Campaign creation successful:', result);

        if (!result.success) {
          console.error('❌ useCreateCampaign: API returned error:', result.error);
          throw result.error;
        }

        console.log('🔍 useCreateCampaign: Returning campaign data:', result.data);
        console.log('🔍 useCreateCampaign: Campaign data keys:', Object.keys(result.data || {}));
        console.log('🔍 useCreateCampaign: Campaign ID from data:', result.data?.id);

        return result.data;
      } catch (error) {
        console.error('❌ useCreateCampaign: Campaign creation failed:', error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
          console.error('❌ useCreateCampaign: Authentication failed during campaign creation');
          // Trigger logout event
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ useCreateCampaign: Invalidating campaign queries...');
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
    onError: (error) => {
      console.error('❌ useCreateCampaign: Mutation error:', error);
    }
  });
};

// Update campaign mutation
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => campaignService.updateCampaign(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
};

// Delete campaign mutation
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: campaignService.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
};

// Upload employee data mutation
export const useUploadEmployeeData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, file }) => 
      campaignService.uploadEmployeeData(campaignId, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: campaignKeys.detail(variables.campaignId) 
      });
    },
  });
};

// Confirm matches mutation
export const useConfirmMatches = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: campaignService.confirmMatches,
    onSuccess: (data, campaignId) => {
      queryClient.invalidateQueries({ 
        queryKey: campaignKeys.detail(campaignId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: campaignKeys.matches(campaignId) 
      });
    },
  });
};
