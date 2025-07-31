import axios from 'axios';

// Create a simple API client for dashboard
const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

const dashboardAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds for dashboard operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
dashboardAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for authentication errors
dashboardAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors by redirecting to login
    if (error.response?.status === 401) {
      console.log('❌ Dashboard API: Authentication failed, redirecting to login');

      // Clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const dashboardService = {
  // Get recent evaluations for dashboard
  getRecentEvaluations: async (limit = 4) => {
    try {
      const response = await dashboardAPI.get(`/dashboard/recent-evaluations/?limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching recent evaluations:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch recent evaluations'
      };
    }
  },

  // Get rating distribution data
  getRatingDistribution: async () => {
    try {
      const response = await dashboardAPI.get('/dashboard/rating-distribution/');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching rating distribution:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch rating distribution'
      };
    }
  },

  // Get evaluation trends over time
  getEvaluationTrends: async (period = '6months') => {
    try {
      const response = await dashboardAPI.get(`/dashboard/evaluation-trends/?period=${period}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching evaluation trends:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch evaluation trends'
      };
    }
  },

  // Get overall dashboard statistics
  getOverallEvaluationStats: async () => {
    try {
      const response = await dashboardAPI.get('/dashboard/statistics/');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch dashboard statistics'
      };
    }
  }
};
