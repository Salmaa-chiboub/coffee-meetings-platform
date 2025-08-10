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
      console.log('🔍 campaignService.getCampaign: Starting request for ID:', id);

      if (!id || id === 'undefined') {
        throw new Error('Campaign ID is required and cannot be undefined');
      }

      // Check authentication before making request
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      console.log('🔍 campaignService.getCampaign: Auth check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        campaignId: id
      });

      if (!accessToken && !refreshToken) {
        console.error('❌ campaignService.getCampaign: No authentication tokens');
        throw new Error('Authentication required');
      }

      const response = await apiClient.get(`/campaigns/${id}/`);
      // If response doesn't include workflow, consumer may call workflowService for details page only
      console.log('✅ campaignService.getCampaign: Success response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ campaignService.getCampaign: Request failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        campaignId: id
      });

      // Check for authentication errors
      if (error.response?.status === 401) {
        console.error('❌ campaignService.getCampaign: 401 Unauthorized');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      console.log('🔍 campaignService.createCampaign: Starting request with data:', campaignData);

      // Check authentication before making request
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken && !refreshToken) {
        console.error('❌ campaignService.createCampaign: No authentication tokens');
        throw new Error('Authentication required. Please log in again.');
      }

      const result = await authAPI.createCampaign(campaignData);
      console.log('✅ campaignService.createCampaign: API response:', result);

      if (!result.success) {
        console.error('❌ campaignService.createCampaign: API error:', result.error);

        // Check for authentication errors
        if (result.error?.status === 401 || result.error?.detail?.includes('authentication')) {
          console.error('❌ campaignService.createCampaign: Authentication error detected');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        throw result.error;
      }

      return result;
    } catch (error) {
      console.error('❌ campaignService.createCampaign: Request failed:', error);

      // Handle different types of errors
      if (error.response?.status === 401) {
        console.error('❌ campaignService.createCampaign: 401 Unauthorized');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      } else if (error.response?.status === 403) {
        console.error('❌ campaignService.createCampaign: 403 Forbidden');
      }

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
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    try {
      const response = await apiClient.delete(`/campaigns/${id}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },

  // Update campaign
  updateCampaign: async (id, campaignData) => {
    try {
      const response = await apiClient.put(`/campaigns/${id}/`, campaignData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating campaign:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};
