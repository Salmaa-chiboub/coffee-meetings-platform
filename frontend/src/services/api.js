import axios from 'axios';

// CACHE BUSTER - UPDATED API CONFIGURATION v2.0

// API Configuration - FIXED: Remove /api/ from URL
const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

console.log('🔧 API Configuration FIXED:');
console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);
console.log('After removing /api:', process.env.REACT_APP_API_URL?.replace('/api', ''));
console.log('Final API_BASE_URL:', API_BASE_URL);

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('🔄 Access token expired, refreshing...');

          const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          console.log('✅ Token refreshed successfully');

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.log('❌ Token refresh failed, logging out');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  // Login user
  login: async (credentials) => {
    try {
      console.log('🔍 Login Debug - Sending request to:', `${API_BASE_URL}/users/login/`);
      console.log('🔍 Login Debug - Credentials:', credentials);
      console.log('🔍 Login Debug - Headers:', {
        'Content-Type': 'application/json',
      });

      const response = await apiClient.post('/users/login/', credentials);

      console.log('✅ Login Debug - Success response:', response.data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Login Debug - Error details:');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      console.error('Request Data:', error.config?.data);
      console.error('Full Error:', error);

      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/users/register/', userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/users/profile/', userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.post('/users/change-password/', passwordData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await apiClient.post('/users/password-reset-request/', { email });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Confirm password reset
  confirmPasswordReset: async (resetData) => {
    try {
      console.log('🔍 API - Password Reset Confirm Request:');
      console.log('URL:', `${API_BASE_URL}/users/password-reset-confirm/`);
      console.log('Data:', resetData);

      const response = await apiClient.post('/users/password-reset-confirm/', resetData);

      console.log('✅ API - Password Reset Success:', response.data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ API - Password Reset Error:');
      console.error('Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      console.error('Request Data:', error.config?.data);

      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Logout (clear tokens)
  logout: () => {
    console.log('🔄 API - Clearing all authentication data...');

    // Clear all possible auth-related items from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Legacy token name

    // Verify everything is cleared
    const remainingTokens = {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
      user: localStorage.getItem('user'),
      authToken: localStorage.getItem('authToken'),
    };

    console.log('🔍 API - Remaining tokens after logout:', remainingTokens);

    // Check if anything is still there
    const hasRemainingData = Object.values(remainingTokens).some(value => value !== null);

    if (hasRemainingData) {
      console.warn('⚠️ API - Some authentication data still exists after logout');
    } else {
      console.log('✅ API - All authentication data successfully cleared');
    }

    return Promise.resolve({ success: true });
  },

  // Get campaigns
  getCampaigns: async () => {
    try {
      const response = await apiClient.get('/campaigns/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.warn('Campaigns API not available, returning empty data:', error);
      // Return empty data instead of failing to prevent dashboard crash
      return {
        success: true,
        data: [],
      };
    }
  },

  // Get campaign employees
  getCampaignEmployees: async (campaignId) => {
    try {
      const response = await apiClient.get(`/campaigns/${campaignId}/employees/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Get campaign evaluation statistics
  getCampaignStatistics: async (campaignId) => {
    try {
      const response = await apiClient.get(`/evaluations/campaigns/${campaignId}/statistics/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Get campaign evaluation results
  getCampaignEvaluations: async (campaignId) => {
    try {
      const response = await apiClient.get(`/evaluations/campaigns/${campaignId}/evaluations/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Get matching history for campaign
  getMatchingHistory: async (campaignId) => {
    try {
      const response = await apiClient.get(`/matching/campaigns/${campaignId}/history/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error occurred' },
      };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch profile' },
      };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile/', profileData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update profile' },
      };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.post('/users/change-password/', passwordData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to change password' },
      };
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await apiClient.post('/users/password-reset-request/', { email });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to request password reset' },
      };
    }
  },
};

// Token management utilities
export const tokenUtils = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },
};

export default apiClient;
