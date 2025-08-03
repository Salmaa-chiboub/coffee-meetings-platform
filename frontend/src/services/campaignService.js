import { authAPI } from './api';
import { workflowService } from './workflowService';
import apiClient from './api';
import { createCachedCall, CACHE_CONFIGS } from './cacheService';

export const campaignService = {
  // Get all campaigns
  getCampaigns: async (params = {}) => {
    try {
      const result = await authAPI.getCampaigns(params);
      if (result.success) {
        // Return the full result structure including pagination
        return {
          data: result.data,
          pagination: result.pagination
        };
      } else {
        throw new Error(result.error?.message || 'Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Get campaign by ID
  getCampaign: async (id) => {
    try {
      // For now, we'll use the campaigns list and filter by ID
      // This can be optimized later with a dedicated API endpoint
      const campaignsResponse = await campaignService.getCampaigns();
      const campaigns = campaignsResponse.data || [];
      const campaign = campaigns.find(c => c.id === parseInt(id));
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      return campaign;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      const result = await authAPI.createCampaign(campaignData);
      if (result.success) {
        return result.data;
      } else {
        throw result.error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Update campaign - placeholder for future implementation
  updateCampaign: async (id, campaignData) => {
    throw new Error('Update campaign functionality not yet implemented');
  },

  // Delete campaign - placeholder for future implementation
  deleteCampaign: async (id) => {
    throw new Error('Delete campaign functionality not yet implemented');
  },

  // Upload employee data - placeholder for future implementation
  uploadEmployeeData: async (campaignId, file) => {
    throw new Error('Upload employee data functionality not yet implemented');
  },

  // Get campaign matches - placeholder for future implementation
  getCampaignMatches: async (campaignId) => {
    throw new Error('Get campaign matches functionality not yet implemented');
  },

  // Confirm campaign matches - placeholder for future implementation
  confirmMatches: async (campaignId) => {
    throw new Error('Confirm matches functionality not yet implemented');
  },

  // Get completed campaigns with real data and optimized performance
  getCompletedCampaignsWithDetails: async (page = 1, pageSize = 10) => {
    try {
      // Get campaigns from API with optimized page size
      const response = await createCachedCall(
        '/campaigns/',
        { page_size: Math.min(50, pageSize * 5) }, // Cache larger batches
        () => apiClient.get('/campaigns/', {
          params: { page_size: Math.min(50, pageSize * 5) }
        }),
        CACHE_CONFIGS.campaigns
      );

      const allCampaigns = response.data?.results || response.data || [];

      if (allCampaigns.length === 0) {
        return {
          success: true,
          data: [],
          pagination: {
            current_page: page,
            page_size: pageSize,
            total_count: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false
          }
        };
      }

      // Process campaigns in optimized batches
      const completedCampaigns = [];
      const batchSize = 5; // Increased batch size for better performance

      for (let i = 0; i < allCampaigns.length; i += batchSize) {
        const batch = allCampaigns.slice(i, i + batchSize);

        // Process batch in parallel with caching
        const batchPromises = batch.map(async (campaign) => {
          try {
            // Check workflow status with cache
            const workflowResponse = await createCachedCall(
              `/campaigns/${campaign.id}/workflow-status/`,
              {},
              () => apiClient.get(`/campaigns/${campaign.id}/workflow-status/`),
              CACHE_CONFIGS.workflow
            );

            const workflow = workflowResponse.data;

            if (workflow?.completed_steps?.includes(5)) {
              // Get additional data in parallel for completed campaigns
              const [employeesResponse, pairsResponse, evalResponse] = await Promise.allSettled([
                createCachedCall(
                  `/campaigns/${campaign.id}/employees/`,
                  {},
                  () => apiClient.get(`/campaigns/${campaign.id}/employees/`),
                  CACHE_CONFIGS.campaigns
                ),
                createCachedCall(
                  `/matching/campaigns/${campaign.id}/history/`,
                  {},
                  () => apiClient.get(`/matching/campaigns/${campaign.id}/history/`),
                  CACHE_CONFIGS.campaigns
                ),
                createCachedCall(
                  `/evaluations/campaigns/${campaign.id}/statistics/`,
                  {},
                  () => apiClient.get(`/evaluations/campaigns/${campaign.id}/statistics/`),
                  CACHE_CONFIGS.campaigns
                )
              ]);

              // Extract real data with fallbacks
              const participants_count = employeesResponse.status === 'fulfilled'
                ? (employeesResponse.value?.data?.count || 0)
                : 0;

              const total_pairs = pairsResponse.status === 'fulfilled'
                ? (pairsResponse.value?.data?.total_pairs || 0)
                : 0;

              let total_evaluations = 0;
              let average_rating = null;
              if (evalResponse.status === 'fulfilled' && evalResponse.value?.data?.success) {
                const stats = evalResponse.value.data.statistics;
                total_evaluations = stats.evaluations_submitted || 0;
                average_rating = stats.average_rating;
              }

              return {
                ...campaign,
                participants_count,
                total_pairs,
                total_evaluations,
                average_rating,
                total_criteria: 0, // Will be enhanced later if needed
                completion_date: campaign.end_date
              };
            }
            return null;
          } catch (error) {
            console.warn(`Failed to process campaign ${campaign.id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null);
        completedCampaigns.push(...validResults);

        // Early exit if we have enough completed campaigns for this page
        if (completedCampaigns.length >= pageSize * page) {
          break;
        }

        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < allCampaigns.length && completedCampaigns.length < pageSize * page) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Sort by creation date (most recent first)
      completedCampaigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Implement client-side pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCampaigns = completedCampaigns.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedCampaigns,
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_count: completedCampaigns.length,
          total_pages: Math.ceil(completedCampaigns.length / pageSize),
          has_next: endIndex < completedCampaigns.length,
          has_previous: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching completed campaigns:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch completed campaigns',
        data: [],
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_count: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false
        }
      };
    }
  },

  // Paginated campaigns for lazy loading with caching
  getCampaignsPaginated: async (page = 1, pageSize = 6, filters = {}) => {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters
      };

      // Use cached call for better performance
      const response = await createCachedCall(
        '/campaigns/',
        params,
        () => apiClient.get('/campaigns/', { params }),
        CACHE_CONFIGS.campaigns
      );

      const campaigns = response.data?.results || response.data || [];

      // Calculate pagination info
      const totalCount = response.data?.count || campaigns.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return {
        success: true,
        data: campaigns,
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_count: totalCount,
          total_pages: totalPages,
          has_next: hasNext,
          has_previous: hasPrevious
        }
      };
    } catch (error) {
      console.error('Error fetching paginated campaigns:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch campaigns',
        data: [],
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_count: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false
        }
      };
    }
  },

  // Legacy method for backward compatibility - fetch all campaigns
  getAllCompletedCampaignsWithDetails: async () => {
    try {
      const campaignsResponse = await campaignService.getCampaigns();
      const campaigns = campaignsResponse.data || [];

      // Fetch detailed data for each campaign
      const campaignsWithDetails = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            // Fetch workflow state
            const workflowState = await workflowService.getCampaignWorkflowStatus(campaign.id);

            // Check if campaign is completed
            const isCompleted = workflowState?.current_step === 5 &&
                               workflowState?.completed_steps?.includes(5);

            if (!isCompleted) return null; // Skip incomplete campaigns

            // Fetch additional data for completed campaigns
            let matchingData = null;
            let criteriaData = null;
            let employeesData = null;

            try {
              // Get matching history (pairs data) - correct URL format
              const matchingResponse = await apiClient.get(`/matching/campaigns/${campaign.id}/history/`);
              matchingData = matchingResponse.data;
              console.log(`Matching data for campaign ${campaign.id}:`, matchingData);
            } catch (error) {
              console.log(`No matching data for campaign ${campaign.id}:`, error.response?.status);
            }

            try {
              // Get criteria history - correct URL format
              const criteriaResponse = await apiClient.get(`/matching/campaigns/${campaign.id}/criteria-history/`);
              criteriaData = criteriaResponse.data;
              console.log(`Criteria data for campaign ${campaign.id}:`, criteriaData);
            } catch (error) {
              console.log(`No criteria data for campaign ${campaign.id}:`, error.response?.status);
            }

            try {
              // Get employees data
              const employeesResponse = await apiClient.get(`/campaigns/${campaign.id}/employees/`);
              employeesData = employeesResponse.data;
              console.log(`Employees data for campaign ${campaign.id}:`, employeesData);
            } catch (error) {
              console.log(`No employees data for campaign ${campaign.id}`);
            }

            // Extract data based on backend API structure
            const totalPairs = matchingData?.total_pairs || 0;
            const totalCriteria = criteriaData?.total_criteria || 0;
            const participantsCount = employeesData?.count || campaign.employee_count || campaign.employees_count || 0;

            console.log(`Final counts for campaign ${campaign.id}:`, {
              totalPairs,
              totalCriteria,
              participantsCount,
              matchingDataKeys: matchingData ? Object.keys(matchingData) : 'null',
              criteriaDataKeys: criteriaData ? Object.keys(criteriaData) : 'null',
              employeesDataKeys: employeesData ? Object.keys(employeesData) : 'null'
            });

            return {
              ...campaign,
              workflow_state: workflowState,
              matching_data: matchingData,
              criteria_data: criteriaData,
              employees_data: employeesData,
              status: 'completed',
              completion_date: workflowState.updated_at || campaign.end_date,
              total_pairs: totalPairs,
              total_criteria: totalCriteria,
              participants_count: participantsCount
            };
          } catch (error) {
            console.log(`Failed to fetch details for campaign ${campaign.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (incomplete campaigns)
      return campaignsWithDetails.filter(campaign => campaign !== null);
    } catch (error) {
      throw error;
    }
  },

  // Legacy method for backward compatibility
  getCompletedCampaigns: async () => {
    return campaignService.getCompletedCampaignsWithDetails();
  },

  // Get campaign statistics for analytics
  getCampaignStatistics: async (campaignId) => {
    try {
      // Mock statistics - in real implementation, this would fetch from API
      return {
        totalParticipants: Math.floor(Math.random() * 100 + 20),
        totalPairs: Math.floor(Math.random() * 50 + 10),
        averageRating: (Math.random() * 2 + 3).toFixed(1),
        feedbackRate: Math.floor(Math.random() * 30 + 70),
        successRate: Math.floor(Math.random() * 20 + 80),
        departmentBreakdown: {
          'Engineering': Math.floor(Math.random() * 30 + 10),
          'Marketing': Math.floor(Math.random() * 20 + 5),
          'Sales': Math.floor(Math.random() * 25 + 8),
          'HR': Math.floor(Math.random() * 15 + 3),
          'Finance': Math.floor(Math.random() * 18 + 5),
          'Operations': Math.floor(Math.random() * 22 + 7),
        },
        monthlyTrends: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          participants: Math.floor(Math.random() * 50 + 10),
          pairs: Math.floor(Math.random() * 25 + 5),
          rating: (Math.random() * 2 + 3).toFixed(1)
        }))
      };
    } catch (error) {
      throw error;
    }
  },

  // Upload campaign documents
  uploadCampaignDocument: async (campaignId, file, documentType = 'report') => {
    try {
      // Mock upload - in real implementation, this would upload to server
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              id: Date.now(),
              campaignId,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              documentType,
              uploadedAt: new Date().toISOString(),
              url: `https://example.com/documents/${Date.now()}-${file.name}`
            }
          });
        }, 1000 + Math.random() * 2000); // Simulate upload time
      });
    } catch (error) {
      throw error;
    }
  },

  // Get campaign documents
  getCampaignDocuments: async (campaignId) => {
    try {
      // Mock documents - in real implementation, this would fetch from API
      return [
        {
          id: 1,
          campaignId,
          fileName: 'Campaign_Report.pdf',
          fileSize: 2048576,
          fileType: 'application/pdf',
          documentType: 'report',
          uploadedAt: '2024-01-15T10:30:00Z',
          url: 'https://example.com/documents/campaign-report.pdf'
        },
        {
          id: 2,
          campaignId,
          fileName: 'Feedback_Analysis.xlsx',
          fileSize: 1024768,
          fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          documentType: 'analysis',
          uploadedAt: '2024-01-16T14:20:00Z',
          url: 'https://example.com/documents/feedback-analysis.xlsx'
        }
      ];
    } catch (error) {
      throw error;
    }
  },
};
