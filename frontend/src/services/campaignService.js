import { authAPI } from './api';

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
};
