import { authAPI } from './api';
import { workflowService } from './workflowService';

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

  // Get completed campaigns with enhanced data for history view
  getCompletedCampaigns: async () => {
    try {
      const campaignsResponse = await campaignService.getCampaigns();
      const campaigns = campaignsResponse.data || [];

      // Fetch workflow state for each campaign and filter completed ones
      const campaignsWithWorkflow = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            // Fetch workflow state for this campaign using the workflow service
            const workflowState = await workflowService.getCampaignWorkflowStatus(campaign.id);
            return {
              ...campaign,
              workflow_state: workflowState
            };
          } catch (error) {
            console.log(`Failed to fetch workflow state for campaign ${campaign.id}:`, error);
            // If workflow state fetch fails, assume not completed
            return {
              ...campaign,
              workflow_state: null
            };
          }
        })
      );

      // Filter campaigns where HR has completed all workflow steps (step 5 - "Confirm and Send")
      const completedCampaigns = campaignsWithWorkflow.filter(campaign => {
        const workflowState = campaign.workflow_state;

        console.log(`Campaign ${campaign.id} (${campaign.title}):`, {
          hasWorkflowState: !!workflowState,
          currentStep: workflowState?.current_step,
          completedSteps: workflowState?.completed_steps,
          workflowState: workflowState
        });

        if (!workflowState) {
          console.log(`Campaign ${campaign.id}: No workflow state - excluding`);
          return false; // No workflow state means not completed
        }

        // Campaign is completed if:
        // 1. Current step is 5 (final step)
        // 2. Step 5 is in the completed steps array
        const isWorkflowCompleted = workflowState.current_step === 5 &&
                                   workflowState.completed_steps &&
                                   workflowState.completed_steps.includes(5);

        console.log(`Campaign ${campaign.id}: Workflow completed = ${isWorkflowCompleted}`);
        return isWorkflowCompleted;
      });

      const campaignsToShow = completedCampaigns;

      // Enhance with real feedback data by fetching evaluation statistics for each campaign
      const campaignsWithRatings = await Promise.all(
        campaignsToShow.map(async (campaign) => {
          try {
            // Fetch real evaluation statistics for this campaign using the API service
            const result = await authAPI.getCampaignStatistics(campaign.id);

            let evaluationStats = null;
            if (result.success && result.data) {
              evaluationStats = result.data.statistics;
            }

            const estimatedPairs = Math.floor((campaign.employees_count || 0) / 2);
            const hasRealFeedback = evaluationStats && evaluationStats.average_rating !== null;

            return {
              ...campaign,
              avg_rating: hasRealFeedback ? evaluationStats.average_rating : null,
              pairs_count: evaluationStats ? evaluationStats.total_pairs : estimatedPairs,
              success_rate: hasRealFeedback ? evaluationStats.response_rate : null,
              feedback_count: evaluationStats ? evaluationStats.evaluations_submitted : 0,
              // Mark as completed for demo purposes
              status: 'completed',
              completion_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
          } catch (error) {
            // Fallback to basic data without ratings if API call fails
            const estimatedPairs = Math.floor((campaign.employees_count || 0) / 2);
            return {
              ...campaign,
              avg_rating: null,
              pairs_count: estimatedPairs,
              success_rate: null,
              feedback_count: 0,
              status: 'completed',
              completion_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
          }
        })
      );

      return campaignsWithRatings;
    } catch (error) {
      throw error;
    }
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
