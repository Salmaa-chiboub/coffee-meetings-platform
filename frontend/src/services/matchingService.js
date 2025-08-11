import api from './api';

export const matchingService = {
  // Get available attributes for matching criteria
  getAvailableAttributes: async (campaignId) => {
    try {
      const response = await api.get(`/matching/campaigns/${campaignId}/available-attributes/`);
      // Handle the response format from the backend
      const attributes = response.data.available_attributes || [];
      return attributes.map(attr => ({
        key: attr,
        display_name: attr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        unique_values: 1 // Placeholder, could be enhanced later
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Save matching criteria
  saveCriteria: async (campaignId, criteria) => {
    try {
      console.log('🔍 DEBUG: matchingService.saveCriteria called');
      console.log('Campaign ID:', campaignId);
      console.log('Criteria:', criteria);
      console.log('URL:', `/matching/campaigns/${campaignId}/criteria/`);

      const response = await api.post(`/matching/campaigns/${campaignId}/criteria/`, {
        criteria
      });

      console.log('✅ DEBUG: saveCriteria success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ DEBUG: saveCriteria error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error.response?.data || error.message;
    }
  },

  // Generate pairs based on criteria
  generatePairs: async (campaignId, limit = null) => {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get(`/matching/campaigns/${campaignId}/generate-pairs/`, {
        params
      });

      // Normalize pairs structure to match frontend expectations
      const result = response.data;
      if (result.pairs) {
        result.pairs = result.pairs.map(pair => ({
          ...pair,
          employee1_name: pair.employee_1?.name || pair.employee1_name,
          employee2_name: pair.employee_2?.name || pair.employee2_name,
          employee1_id: pair.employee_1?.id || pair.employee1_id,
          employee2_id: pair.employee_2?.id || pair.employee2_id
        }));
      }

      return result;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Confirm pairs and send notifications
  confirmPairs: async (campaignId, pairs = []) => {
    try {
      // If no pairs provided, try to get from workflow state or generate new ones
      if (!pairs || pairs.length === 0) {
        const generateResponse = await api.get(`/matching/campaigns/${campaignId}/generate-pairs/`);
        pairs = generateResponse.data.pairs || [];
      }

      // Format pairs for confirmation
      const pairsData = pairs.map(pair => ({
        employee_1_id: pair.employee_1?.id || pair.employee1_id,
        employee_2_id: pair.employee_2?.id || pair.employee2_id
      }));

      console.log('DEBUG: Confirming pairs:', { pairs: pairsData, send_emails: true });

      const response = await api.post(`/matching/campaigns/${campaignId}/confirm-pairs/`, {
        pairs: pairsData,
        send_emails: true
      }, { timeout: 0 }); // No timeout for potentially long email sending

      return {
        success: true,
        confirmed_pairs: response.data.total_saved || 0,
        emails_sent: response.data.total_saved ? response.data.total_saved * 2 : 0
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get matching history
  getMatchingHistory: async (campaignId) => {
    try {
      const response = await api.get(`/matching/campaigns/${campaignId}/history/`);

      // Normalize pairs structure to match frontend expectations
      const pairs = (response.data.pairs || []).map(pair => ({
        ...pair,
        employee1_name: pair.employee_1?.name || pair.employee1_name,
        employee2_name: pair.employee_2?.name || pair.employee2_name,
        employee1_id: pair.employee_1?.id || pair.employee1_id,
        employee2_id: pair.employee_2?.id || pair.employee2_id
      }));

      return {
        pairs: pairs,
        total_possible: response.data.total_pairs || 0,
        criteria_used: response.data.criteria_history || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get criteria history
  getCriteriaHistory: async (campaignId) => {
    try {
      const response = await api.get(`/matching/campaigns/${campaignId}/criteria-history/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
