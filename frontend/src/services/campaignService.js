import apiClient, { authAPI } from './api';

export const campaignService = {
  // Get all campaigns
  getCampaigns: async (params = {}) => {
    try {
      const result = await authAPI.getCampaigns(params);
      return result;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Get campaign by ID
  getCampaign: async (id) => {
    try {
      console.log('🔍 getCampaign called with ID:', id);
      if (!id || id === 'undefined') {
        throw new Error('Campaign ID is required and cannot be undefined');
      }
      const response = await apiClient.get(`/campaigns/${id}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error fetching campaign:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      const result = await authAPI.createCampaign(campaignData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Get campaign matches
  getCampaignMatches: async (campaignId) => {
    try {
      const response = await apiClient.get(`/matching/campaigns/${campaignId}/history/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching campaign matches:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};
