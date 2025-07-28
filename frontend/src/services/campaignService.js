import api from './api';

export const campaignService = {
  // Get all campaigns
  getCampaigns: async (params = {}) => {
    try {
      const response = await api.get('/campaigns/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign by ID
  getCampaign: async (id) => {
    try {
      const response = await api.get(`/campaigns/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      const response = await api.post('/campaigns/', campaignData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update campaign
  updateCampaign: async (id, campaignData) => {
    try {
      const response = await api.put(`/campaigns/${id}/`, campaignData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    try {
      await api.delete(`/campaigns/${id}/`);
      return true;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload employee data
  uploadEmployeeData: async (campaignId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(
        `/campaigns/${campaignId}/upload-employees/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign matches
  getCampaignMatches: async (campaignId) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/matches/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Confirm campaign matches
  confirmMatches: async (campaignId) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/confirm-matches/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
