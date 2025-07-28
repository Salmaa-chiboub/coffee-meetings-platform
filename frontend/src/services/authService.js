import { authAPI, tokenUtils } from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const result = await authAPI.login(credentials);

      if (result.success) {
        const { access_token, refresh_token, user_id, name, email } = result.data;

        // Store tokens using the new token utils
        tokenUtils.setTokens(access_token, refresh_token);

        // Create user object matching backend structure
        const user = {
          id: user_id,
          name,
          email,
          role: 'hr_manager'
        };

        localStorage.setItem('user', JSON.stringify(user));

        return { user, access_token, refresh_token };
      } else {
        // Handle API errors from backend
        const errorMessage = result.error?.email?.[0] ||
                           result.error?.password?.[0] ||
                           result.error?.non_field_errors?.[0] ||
                           result.error?.message ||
                           'Login failed. Please check your credentials.';

        throw new Error(errorMessage);
      }
    } catch (error) {
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      // Map frontend field names to backend expected names
      const backendData = {
        name: userData.fullName,
        email: userData.email,
        company_name: userData.companyName,
        password: userData.password,
      };

      const result = await authAPI.register(backendData);

      if (result.success) {
        const { token, refresh_token, id, name, email, company_name } = result.data;

        // Store tokens for auto-login
        tokenUtils.setTokens(token, refresh_token);

        // Create user object
        const user = {
          id,
          name,
          email,
          company_name,
          role: 'hr_manager'
        };

        // Store user data for auto-login
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Registration successful - User auto-logged in');

        return { user, token, refresh_token, autoLogin: true };
      } else {
        // Handle API errors from backend
        const errors = result.error;
        let errorMessage = 'Registration failed. Please try again.';

        if (errors) {
          if (errors.email?.[0]) errorMessage = errors.email[0];
          else if (errors.name?.[0]) errorMessage = errors.name[0];
          else if (errors.password?.[0]) errorMessage = errors.password[0];
          else if (errors.company_name?.[0]) errorMessage = errors.company_name[0];
          else if (errors.non_field_errors?.[0]) errorMessage = errors.non_field_errors[0];
          else if (errors.message) errorMessage = errors.message;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      console.log('🔄 AuthService - Starting logout process...');

      // Clear tokens via API (this also clears localStorage)
      await authAPI.logout();

      console.log('✅ AuthService - API logout successful');

    } catch (error) {
      console.error('❌ AuthService - Logout error:', error);
    } finally {
      // Ensure tokens are cleared even if API call fails
      console.log('🧹 AuthService - Clearing all tokens and user data');
      tokenUtils.clearTokens();

      // Double-check: manually clear any remaining auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken'); // Legacy token name

      console.log('✅ AuthService - Logout cleanup complete');
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return tokenUtils.isAuthenticated();
  },

  // Get user profile from backend
  getProfile: async () => {
    try {
      const result = await authAPI.getProfile();
      if (result.success) {
        const user = result.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        throw new Error(result.error?.message || 'Failed to get profile');
      }
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const result = await authAPI.updateProfile(userData);
      if (result.success) {
        const user = result.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        throw new Error(result.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const result = await authAPI.changePassword(passwordData);
      if (result.success) {
        return result.data;
      } else {
        const errors = result.error;
        let errorMessage = 'Failed to change password.';

        if (errors) {
          if (errors.current_password?.[0]) errorMessage = errors.current_password[0];
          else if (errors.new_password?.[0]) errorMessage = errors.new_password[0];
          else if (errors.non_field_errors?.[0]) errorMessage = errors.non_field_errors[0];
          else if (errors.message) errorMessage = errors.message;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const result = await authAPI.requestPasswordReset(email);
      if (result.success) {
        return result.data;
      } else {
        const errorMessage = result.error?.email?.[0] ||
                           result.error?.message ||
                           'Failed to send password reset email.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      throw error;
    }
  },

  // Confirm password reset
  confirmPasswordReset: async (resetData) => {
    try {
      console.log('🔍 AuthService - Password Reset Data:', resetData);

      const result = await authAPI.confirmPasswordReset(resetData);

      console.log('🔍 AuthService - API Result:', result);

      if (result.success) {
        return result.data;
      } else {
        const errors = result.error;
        let errorMessage = 'Failed to reset password.';

        console.log('❌ AuthService - API Errors:', errors);

        if (errors) {
          if (errors.token?.[0]) errorMessage = errors.token[0];
          else if (errors.new_password?.[0]) errorMessage = errors.new_password[0];
          else if (errors.confirm_password?.[0]) errorMessage = errors.confirm_password[0];
          else if (errors.non_field_errors?.[0]) errorMessage = errors.non_field_errors[0];
          else if (errors.message) errorMessage = errors.message;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ AuthService - Password Reset Error:', error);
      throw error;
    }
  },
};
