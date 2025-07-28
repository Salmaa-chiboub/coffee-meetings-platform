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

// Get all campaigns
export const useCampaigns = (params = {}) => {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignService.getCampaigns(params),
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
    mutationFn: campaignService.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
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
