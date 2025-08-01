import axios from 'axios';

// Base URL configuration - Fixed for Vite
const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/auth`;

// Create axios instance with default config
const authAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pennypal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
authAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('pennypal_token');
      localStorage.removeItem('pennypal_user');
      // Redirect ke home jika unauthorized
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  // Sign Up
  signup: async (name, email, password) => {
    try {
      const response = await authAPI.post('/signup', {
        username: name, // Backend expects 'username', not 'name'
        email,
        password,
      });
      
      // Store token and user data if registration successful
      if (response.data.token) {
        localStorage.setItem('pennypal_token', response.data.token);
        localStorage.setItem('pennypal_user', JSON.stringify(response.data.user));
        
        // Redirect ke dashboard setelah signup berhasil
        window.location.href = '/dashboard';
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Sign In
  signin: async (email, password) => {
    try {
      const response = await authAPI.post('/signin', {
        email,
        password,
      });
      
      // Store token and user data if login successful
      if (response.data.token) {
        localStorage.setItem('pennypal_token', response.data.token);
        localStorage.setItem('pennypal_user', JSON.stringify(response.data.user));
        
        // Redirect ke dashboard setelah login berhasil
        window.location.href = '/dashboard';
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Sign Out
  signout: async () => {
    try {
      await authAPI.post('/signout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('pennypal_token');
      localStorage.removeItem('pennypal_user');
      window.location.href = '/';
    }
  },

  // Get Current User
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('pennypal_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('pennypal_token');
    return !!token;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('pennypal_token');
  },

  // Refresh Token
  refreshToken: async () => {
    try {
      const response = await authAPI.post('/refresh');
      
      if (response.data.token) {
        localStorage.setItem('pennypal_token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      // If refresh fails, logout user
      authService.signout();
      throw error.response?.data || { message: 'Token refresh failed' };
    }
  },

  // Forgot Password
  forgotPassword: async (email) => {
    try {
      const response = await authAPI.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset email' };
    }
  },

  // Reset Password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await authAPI.post('/reset-password', {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  // Change Password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.post('/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password change failed' };
    }
  },

  // Verify Email
  verifyEmail: async (token) => {
    try {
      const response = await authAPI.post('/verify-email', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Email verification failed' };
    }
  },

  // Resend Verification Email
  resendVerification: async (email) => {
    try {
      const response = await authAPI.post('/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend verification email' };
    }
  },

  // Google OAuth
  googleAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Handle OAuth Callback
  handleOAuthCallback: (token, user) => {
    if (token) {
      localStorage.setItem('pennypal_token', token);
      localStorage.setItem('pennypal_user', JSON.stringify(user));
      // Redirect ke dashboard setelah OAuth berhasil
      window.location.href = '/dashboard';
      return true;
    }
    return false;
  },

  // Update User Profile
  updateProfile: async (userData) => {
    try {
      const response = await authAPI.put('/profile', userData);
      
      // Update stored user data
      if (response.data.user) {
        localStorage.setItem('pennypal_user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Profile update failed' };
    }
  },

  // Delete Account
  deleteAccount: async (password) => {
    try {
      const response = await authAPI.delete('/account', {
        data: { password }
      });
      
      // Clear all data on successful deletion
      localStorage.removeItem('pennypal_token');
      localStorage.removeItem('pennypal_user');
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Account deletion failed' };
    }
  }
};

// Legacy exports for backward compatibility
export const signup = (name, email, password) => {
  return authService.signup(name, email, password);
};

export const signin = (email, password) => {
  return authService.signin(email, password);
};

// Default export
export default authService;