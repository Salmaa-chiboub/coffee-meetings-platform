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

// Response interceptor to handle token refresh and automatic logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const accessToken = localStorage.getItem('access_token');

        // If no refresh token or access token, immediately logout
        if (!refreshToken || !accessToken) {
          console.log('❌ No tokens found, redirecting to login');
          handleAuthenticationFailure();
          return Promise.reject(error);
        }

        console.log('🔄 Access token expired, attempting refresh...');

        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('access_token', access);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        console.log('✅ Token refreshed successfully');

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);

        // Check if refresh token is also expired or invalid
        if (refreshError.response?.status === 401) {
          console.log('❌ Refresh token expired, logging out');
        }

        handleAuthenticationFailure();
        return Promise.reject(refreshError);
      }
    }

    // Handle other authentication errors
    if (error.response?.status === 403) {
      console.log('❌ Access forbidden, insufficient permissions');
    }

    return Promise.reject(error);
  }
);

// Helper function to handle authentication failures
const handleAuthenticationFailure = () => {
  console.log('🔄 Handling authentication failure...');

  // Clear all authentication data
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('authToken'); // Legacy token

  // Dispatch custom event for auth context to handle
  window.dispatchEvent(new CustomEvent('auth:logout'));

  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// API Methods
export const authAPI = {
  // Login user
  login: async (credentials) => {
    try {
      console.log('🔍 Login Debug - Sending request to:', `${API_BASE_URL}/users/login/`);
      const response = await apiClient.post('/users/login/', credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Login Debug - Error:', error);
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

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await apiClient.post('/users/profile/picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to upload profile picture' },
        message: error.response?.data?.message || 'Failed to upload profile picture',
      };
    }
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    try {
      const response = await apiClient.delete('/users/profile/picture/');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to delete profile picture' },
        message: error.response?.data?.message || 'Failed to delete profile picture',
      };
    }
  },

  // Get campaigns
  getCampaigns: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const url = `/campaigns/${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get(url);

      if (response.data.results) {
        return {
          success: true,
          data: response.data.results,
          pagination: {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            page_size: params.page_size || 20,
            current_page: params.page || 1
          }
        };
      }

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

  // Create campaign
  createCampaign: async (campaignData) => {
    try {
      const response = await apiClient.post('/campaigns/', campaignData);
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
};

// Token management utilities
export const tokenUtils = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  setTokens: (accessToken, refreshToken) => {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Legacy token
  },

  isAuthenticated: () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // Must have both tokens to be considered authenticated
    return !!(accessToken && refreshToken);
  },

  // Check if token is expired (basic check without decoding)
  isTokenExpired: (token) => {
    if (!token) return true;

    try {
      // Basic JWT structure check
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      // Decode payload (without verification)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  },

  // Get token expiration time
  getTokenExpiration: (token) => {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  },
};

export default apiClient;
