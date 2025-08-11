import { authAPI, tokenUtils } from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const result = await authAPI.login(credentials);

      if (result.success) {
        const { access_token, refresh_token, user_id, name, email, company_name, profile_picture_url } = result.data;

        // Store tokens using the new token utils
        tokenUtils.setTokens(access_token, refresh_token);

        // Create user object matching backend structure
        const user = {
          id: user_id,
          name,
          email,
          company_name,
          profile_picture_url,
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
        let errorMessage = 'Inscription échouée. Veuillez réessayer.';

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
      // Supprimer les tokens
      tokenUtils.clearTokens();

      // Supprimer les informations utilisateur
      localStorage.removeItem('user');

      // Supprimer toute autre donnée de session si nécessaire
      localStorage.removeItem('authToken'); // Legacy token

      // Déclencher l'événement de déconnexion
      window.dispatchEvent(new CustomEvent('auth:logout'));

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Continuer avec la déconnexion locale même en cas d'erreur
      tokenUtils.clearTokens();
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return { success: true };
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const accessToken = tokenUtils.getAccessToken();
    const refreshToken = tokenUtils.getRefreshToken();
    const user = authService.getCurrentUser();

    // Must have at least refresh token and user data
    if (!refreshToken || !user) {
      return false;
    }

    // If we have a refresh token, check if it's expired
    if (tokenUtils.isTokenExpired(refreshToken)) {
      // Refresh token expired, user needs to login again
      console.log('🔄 Refresh token expired, clearing auth data');
      tokenUtils.clearTokens();
      return false;
    }

    // If access token is expired but refresh token is valid, that's OK
    // The API interceptor will handle refreshing the access token
    return true;
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

  // Validate current session
  validateSession: () => {
    const refreshToken = tokenUtils.getRefreshToken();
    const user = authService.getCurrentUser();

    // Only require refresh token and user data
    if (!refreshToken || !user) {
      console.log('🔄 Session invalid: missing refresh token or user data');
      return false;
    }

    // Check if refresh token is expired
    if (tokenUtils.isTokenExpired(refreshToken)) {
      console.log('🔄 Session invalid: refresh token expired');
      tokenUtils.clearTokens();
      return false;
    }

    // Session is valid if we have a valid refresh token and user data
    // Access token expiration is handled by the API interceptor
    return true;
  },

  // Get token expiration info
  getTokenInfo: () => {
    const accessToken = tokenUtils.getAccessToken();
    const refreshToken = tokenUtils.getRefreshToken();

    return {
      accessToken: {
        token: accessToken,
        expired: accessToken ? tokenUtils.isTokenExpired(accessToken) : true,
        expiration: accessToken ? tokenUtils.getTokenExpiration(accessToken) : null,
      },
      refreshToken: {
        token: refreshToken,
        expired: refreshToken ? tokenUtils.isTokenExpired(refreshToken) : true,
        expiration: refreshToken ? tokenUtils.getTokenExpiration(refreshToken) : null,
      },
    };
  },
};
