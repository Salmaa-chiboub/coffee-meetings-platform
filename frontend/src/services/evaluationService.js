import api from './api';
import axios from 'axios';

// Create a completely independent public API instance for evaluations
const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// NO interceptors for public API - completely independent
// This ensures no authentication is required and no redirects to login

export const evaluationService = {
  /**
   * Get evaluation form data by token (public endpoint)
   */
  getEvaluationForm: async (token) => {
    try {
      console.log('🔍 DEBUG: Getting evaluation form for token:', token);
      console.log('🔍 DEBUG: Using URL:', `${API_BASE_URL}/evaluations/evaluate/${token}/`);

      const response = await publicApi.get(`/evaluations/evaluate/${token}/`);
      console.log('✅ DEBUG: Evaluation form loaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ DEBUG: Error loading evaluation form:', error);
      console.error('❌ DEBUG: Error response:', error.response?.data);
      console.error('❌ DEBUG: Error status:', error.response?.status);

      // Don't redirect to login for public endpoints
      const errorData = error.response?.data || {
        error: 'Network error',
        message: 'Failed to load evaluation form'
      };
      errorData.status = error.response?.status;
      throw errorData;
    }
  },

  /**
   * Submit evaluation by token (public endpoint)
   */
  submitEvaluation: async (token, evaluationData) => {
    try {
      console.log('🔍 DEBUG: Submitting evaluation for token:', token);
      console.log('🔍 DEBUG: Evaluation data:', evaluationData);

      const response = await publicApi.post(`/evaluations/evaluate/${token}/submit/`, evaluationData);
      console.log('✅ DEBUG: Evaluation submitted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ DEBUG: Error submitting evaluation:', error);
      console.error('❌ DEBUG: Error response:', error.response?.data);
      console.error('❌ DEBUG: Error status:', error.response?.status);

      // Don't redirect to login for public endpoints
      const errorData = error.response?.data || {
        error: 'Network error',
        message: 'Failed to submit evaluation'
      };
      errorData.status = error.response?.status;
      throw errorData;
    }
  },

  /**
   * Get campaign evaluation results (protected endpoint)
   */
  getCampaignEvaluations: async (campaignId) => {
    try {
      const response = await api.get(`/evaluations/campaigns/${campaignId}/evaluations/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get campaign evaluation statistics (protected endpoint)
   */
  getCampaignStatistics: async (campaignId) => {
    try {
      const response = await api.get(`/evaluations/campaigns/${campaignId}/statistics/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default evaluationService;
