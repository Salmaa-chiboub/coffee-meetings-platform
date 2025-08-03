import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';

// Query keys
export const employeeKeys = {
  all: ['employees'],
  lists: () => [...employeeKeys.all, 'list'],
  list: (filters) => [...employeeKeys.lists(), { filters }],
  details: () => [...employeeKeys.all, 'detail'],
  detail: (id) => [...employeeKeys.details(), id],
  byCampaign: (campaignId) => [...employeeKeys.all, 'campaign', campaignId],
};

// Get all employees with enhanced caching and pagination support
export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeService.getEmployees(params),
    // Enhanced caching for employees list
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    // Keep previous data while fetching new data (for pagination)
    keepPreviousData: true,
    // Refetch on mount only if data is stale
    refetchOnMount: 'stale',
  });
};

// Get employees by campaign
export const useEmployeesByCampaign = (campaignId) => {
  return useQuery({
    queryKey: employeeKeys.byCampaign(campaignId),
    queryFn: () => employeeService.getEmployeesByCampaign(campaignId),
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Create employee mutation
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
};

// Update employee mutation
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => employeeService.updateEmployee(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
    },
  });
};

// Delete employee mutation
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
};

// Upload Excel mutation
export const useUploadEmployeeExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, file, replaceExisting }) => 
      employeeService.uploadExcel(campaignId, file, replaceExisting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
};
